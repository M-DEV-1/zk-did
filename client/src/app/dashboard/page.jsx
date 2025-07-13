"use client";
import { useAccount } from "wagmi";
import { BackButton } from "@/components/backButton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Clock, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ConsentModal from "@/components/ConsentModal";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useSignMessage } from "wagmi";
import { generateAgeProof } from "@/utils/generateAgeProof";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function UserDashboard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProviderData, setCurrentProviderData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Session timer management
  const [timerUpdate, setTimerUpdate] = useState(0); // Force re-render for timer updates

  const { signMessageAsync } = useSignMessage();
  const [showResignModal, setShowResignModal] = useState(false);
  const [pendingResignRequest, setPendingResignRequest] = useState(null);
  const [resignStep, setResignStep] = useState("proof");
  const [resignError, setResignError] = useState(null);
  const [resignSuccess, setResignSuccess] = useState(false);
  const [resignCID, setResignCID] = useState(null);

  // Helper: Check if a VC has a complete/revoke signature
  const hasResignSignature = (req) => {
    if (!req.signatures) return false;
    return req.signatures.some(sig => ["complete", "revoke"].includes(sig.stage));
  };

  // Fetch requests from database
  const fetchRequests = async () => {

    try {
      setIsRefreshing(true);
      console.log(`Fetching requests for wallet: ${address}`);

      const res = await fetch("/api/requests/provider");

      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();

      console.log(`Loaded ${data.requests.length} requests from database`);
      setAllRequests(data.requests);

    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: `Failed to fetch requests: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update request in database
  const updateRequest = async (sessionId, updates) => {
    try {
      const response = await fetch('/api/requests/provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...updates
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to update request");
      }

      // Refresh requests after update
      await fetchRequests();

      return data.request;

    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  };

  // Handler for Re-sign
  const handleResign = async (req) => {
    setShowResignModal(true);
    setPendingResignRequest(req);
    setResignStep("proof");
    setResignError(null);
    setResignSuccess(false);
    setResignCID(null);

    try {
      // 1. Generate ZK proof (location proof for demo, use dob for age if needed)
      const referenceYear = new Date().getFullYear();
      const dob = req.dob || (req.user && req.user.dob) || "1990-01-01";
      let challenge = req.challenge;

      if (!challenge) {
        // Generate a random challenge as a BigInt from UUID
        challenge = BigInt('0x' + crypto.randomUUID().replace(/-/g, ''));
      } else if (typeof challenge === 'string' && !/^[0-9]+$/.test(challenge)) {
        // Try to convert string challenge to BigInt if possible
        try {
          challenge = BigInt(challenge);
        } catch {
          challenge = BigInt('0x' + challenge.replace(/-/g, ''));
        }
      }

      const zkProof = await generateAgeProof(dob, referenceYear, challenge);
      setResignStep("sign");

      // 2. Build updated VC
      const updatedVC = {
        ...req,
        proof: zkProof,
        referenceYear,
      };

      // 3. Sign the updated VC
      const signature = await signMessageAsync({ message: JSON.stringify(updatedVC) });
      updatedVC.signatures = [
        ...(updatedVC.signatures || []),
        {
          stage: req.status === "Completed" ? "complete" : "revoke",
          value: signature,
          timestamp: new Date().toISOString(),
        },
      ];

      setResignStep("upload");

      // 4. Upload the VC
      const res = await fetch("/api/upload-vc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedVC),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResignCID(data.cid);
      setResignSuccess(true);
      setResignStep("done");

      toast({ title: "VC Updated", description: `IPFS CID: ${data.cid}` });

      // Update the request in database with new signature
      await updateRequest(req.sessionId, {
        status: req.status,
        proofStatus: "Valid" // Assuming successful re-sign means valid proof
      });

      setShowResignModal(false);

    } catch (e) {
      setResignError(e.message || "Unexpected error");
      setResignStep("error");
    }
  };

  // Load requests when component mounts or address changes
  useEffect(() => {
    fetchRequests();
  }, [address]);

  // Set up polling to check for new requests every 5 seconds
  useEffect(() => {
    if (!address) return;

    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [address]);

  // Timer effect to update session status every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find the first pending request
  const pendingRequest = allRequests.find(req => req.status === "Pending");

  // Show ConsentModal for new pending requests
  useEffect(() => {
    if (pendingRequest && (!currentProviderData || currentProviderData.id !== pendingRequest.id)) {
      setCurrentProviderData(pendingRequest);
      setShowConsentModal(true);
    }
  }, [pendingRequest, currentProviderData]);

  // Approve consent: update status, approvedFields, timer
  const handleConsentApproved = async (approvedFields) => {
    try {
      if (!currentProviderData) {
        console.error("No current provider data available");
        return;
      }

      console.log(`Approving consent for provider: ${currentProviderData.name}`);

      await updateRequest(currentProviderData.sessionId, {
        status: "Ongoing",
        approvedFields,
        proofStatus: "awaited"
      });

      setShowConsentModal(false);
      setCurrentProviderData(null);

      toast({
        title: "Consent Approved",
        description: `Session started with ${currentProviderData.name}`,
      });

    } catch (error) {
      console.error("Error approving consent:", error);
      toast({
        title: "Error",
        description: "Failed to approve consent",
        variant: "destructive"
      });
    }
  };

  // Reject consent: update status
  const handleConsentRejected = async () => {
    try {
      if (!currentProviderData) {
        console.error("No current provider data available");
        return;
      }

      console.log(`Rejecting consent for provider: ${currentProviderData.name}`);

      await updateRequest(currentProviderData.sessionId, {
        status: "Rejected"
      });

      setShowConsentModal(false);
      setCurrentProviderData(null);

      toast({
        title: "Consent Rejected",
        description: "No data will be shared",
        variant: "destructive",
      });

    } catch (error) {
      console.error("Error rejecting consent:", error);
      toast({
        title: "Error",
        description: "Failed to reject consent",
        variant: "destructive"
      });
    }
  };

  // Revoke session: set status to 'Revoked' (only if active)
  const revokeSession = async (sessionId) => {
    try {
      const request = allRequests.find(req => req.sessionId === sessionId);
      if (!request) return;

      console.log(`Revoking session: ${sessionId}`);

      // Only allow revoke if not expired/completed/revoked
      const now = Date.now();
      if (request.status === "Ongoing" && request.timerEnd > now) {
        await updateRequest(sessionId, {
          status: "Revoked"
        });

        toast({
          title: "Session Revoked",
          description: "Access has been revoked",
        });
      } else {
        console.log(`Cannot revoke session ${sessionId}: status=${request.status}, expired=${now >= request.timerEnd}`);
        toast({
          title: "Cannot Revoke",
          description: "Session is already expired or completed",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error("Error revoking session:", error);
      toast({
        title: "Error",
        description: "Failed to revoke session",
        variant: "destructive"
      });
    }
  };

  // Session timer display
  const getSessionStatus = (req) => {
    if (req.status === "Ongoing") {
      // Convert timerEnd to timestamp in ms if it's a string
      const timerEnd = typeof req.timerEnd === "string"
        ? new Date(req.timerEnd).getTime()
        : req.timerEnd;

      if (!timerEnd || isNaN(timerEnd)) return "Unknown";

      const now = Date.now();
      const timeLeft = timerEnd - now;
      if (timeLeft <= 0) return "Expired";
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return req.status;
  };


  const formatApprovedFields = (fields) => {
    if (!fields || fields.length === 0) return "None";
    return fields.join(", ");
  };

  // Get unique provider instances (group by providerId but show each session separately)
  const getProviderDisplayName = (provider) => {
    const sameTypeProviders = allRequests.filter(p => p.providerId === provider.providerId);
    if (sameTypeProviders.length > 1) {
      const index = sameTypeProviders.findIndex(p => p.id === provider.id) + 1;
      return `${provider.name} (Session ${index})`;
    }
    return provider.name;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Government': 'text-blue-400',
      'Finance': 'text-green-400',
      'Healthcare': 'text-red-400',
      'Business': 'text-yellow-400',
      'Legal': 'text-purple-400',
      'Admin': 'text-cyan-400'
    };
    return colors[category] || 'text-zinc-400';
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Card className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-zinc-400">Please connect your wallet to view your consent dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-2 sm:px-4 py-4">
      <Card className="w-full max-w-6xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
        <CardHeader className="pb-2">
          <BackButton />
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-xl font-semibold">
                Consent Dashboard
              </CardTitle>
              <p className="text-sm text-zinc-400 pl-7 mt-1">
                Hi, {address}
              </p>
            </div>
            <Button
              onClick={fetchRequests}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {allRequests.length === 0 && !isRefreshing && (
            <div className="text-center text-zinc-400 text-sm py-8">
              No data sharing requests found. Requests will appear here when providers ask for your consent.
            </div>
          )}

          {isRefreshing && allRequests.length === 0 && (
            <div className="text-center text-zinc-400 text-sm py-8">
              Loading requests...
            </div>
          )}

          <div className="w-full">
            <Table>
              <TableCaption className="text-zinc-400">Your data sharing activity with providers.</TableCaption>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Provider Name</TableHead>
                  <TableHead className="text-zinc-400">Category</TableHead>
                  <TableHead className="text-zinc-400">Approved Fields</TableHead>
                  <TableHead className="text-zinc-400">Active/Inactive</TableHead>
                  <TableHead className="text-zinc-400">Proof Status</TableHead>
                  <TableHead className="text-zinc-400">Download</TableHead>
                  <TableHead className="text-zinc-400">Activity</TableHead>
                  <TableHead className="text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRequests.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={8} className="text-center text-zinc-400">
                      {/* Empty row for visual consistency */}
                    </TableCell>
                  </TableRow>
                ) : (
                  allRequests.map((provider) => {
                    const sessionStatus = getSessionStatus(provider);
                    const needsResign = ["Completed", "Revoked"].includes(provider.status) && !hasResignSignature(provider);
                    return (
                      <TableRow key={provider.id || provider.sessionId} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="font-medium text-white">
                          <div>
                            <div>{getProviderDisplayName(provider)}</div>
                            <div className="text-xs text-zinc-400">{provider.description}</div>
                            <div className="text-xs text-zinc-500">ID: {provider.sessionId?.slice(-8)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(provider.category)}`}>
                            {provider.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-zinc-300">
                          {formatApprovedFields(provider.approvedFields)}
                        </TableCell>
                        <TableCell>
                          {provider.status === "Pending" ? (
                            <span className="text-yellow-400">Pending</span>
                          ) : provider.status === "Ongoing" && getSessionStatus(provider) !== "Expired" ? (
                            <span className="text-green-400">Active</span>
                          ) : (
                            <span className="text-red-400">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {provider.proofStatus === "awaited" && <span className="text-yellow-400">Awaited</span>}
                          {provider.proofStatus === "Valid" && <span className="text-green-400">Valid</span>}
                          {provider.proofStatus === "Invalid" && <span className="text-red-400">Invalid</span>}
                          {!provider.proofStatus && <span className="text-zinc-400">-</span>}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="hover:text-white transition-colors"
                            title="Download data"
                          >
                            <Download className="w-4 h-4 text-zinc-400" />
                          </button>
                        </TableCell>
                        <TableCell>
                          {sessionStatus ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-white">{sessionStatus}</span>
                              {provider.status === "Ongoing" && getSessionStatus(provider) !== "Expired" && (
                                <button
                                  onClick={() => revokeSession(provider.sessionId)}
                                  className="hover:text-red-400 transition-colors"
                                  title="Revoke session"
                                >
                                  <X className="w-4 h-4 text-zinc-400" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-sm">
                              {provider.status === "Ongoing" ? "Session expired" : "No active session"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {needsResign && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleResign(provider)}
                            >
                              Re-sign
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onApprove={({ approvedFields }) => handleConsentApproved(approvedFields)}
        onReject={handleConsentRejected}
        providerData={currentProviderData}
      />

      {/* Modal for re-signing VC */}
      <Dialog open={showResignModal} onOpenChange={(open) => {
        setShowResignModal(open);
        if (!open && !resignSuccess) {
          toast({
            title: "Re-signing Required",
            description: "You must re-sign your credential. If you close this without signing, you will be barred from further authentication.",
            variant: "destructive",
          });
        }
      }}>
        <DialogContent className="text-white bg-zinc-900 border-zinc-800 max-w-lg w-full p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Re-sign VC ({pendingResignRequest?.status})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {resignStep === "proof" && <div className="text-sm text-zinc-300">Generating ZK Proof...</div>}
            {resignStep === "sign" && <div className="text-sm text-zinc-300">Signing updated VC...</div>}
            {resignStep === "upload" && <div className="text-sm text-zinc-300">Uploading VC to IPFS...</div>}
            {resignStep === "done" && <div className="text-green-400">VC updated and uploaded! CID: {resignCID}</div>}
            {resignStep === "error" && <div className="text-red-400">Error: {resignError}</div>}
            <pre className="bg-zinc-800 rounded p-2 text-xs overflow-x-auto max-h-48">
              {JSON.stringify(pendingResignRequest, null, 2)}
            </pre>
            <div className="text-xs text-red-400">
              If you do not re-sign, you will be <b>barred from further authentication</b>.
            </div>
          </div>
          <DialogFooter className="mt-6">
            {resignStep !== "done" && resignStep !== "error" && (
              <Button
                onClick={async () => await handleResign(pendingResignRequest)}
                className="w-full py-2 text-base font-semibold"
              >
                {resignStep === "proof" ? "Sign & Upload" :
                  resignStep === "sign" ? "Signing..." :
                    resignStep === "upload" ? "Uploading..." : "Sign & Upload"}
              </Button>
            )}
            {(resignStep === "done" || resignStep === "error") && (
              <Button
                onClick={() => setShowResignModal(false)}
                className="w-full py-2 text-base font-semibold"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}