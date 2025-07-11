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
import { Download, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ConsentModal from "@/components/ConsentModal";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useSignMessage } from "wagmi";
import { generateAgeProof } from "@/utils/generateAgeProof";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Mock providers for Bharat Stack use cases
// Only using fields that exist in vcSchema.js: aadhaarId, name, dob, location
const MOCK_PROVIDERS = [
  {
    name: "Voting Booth System",
    description: "We need to verify your eligibility and location for voting purposes.",
    providerId: "voting_booth_001",
    requestedFields: ["dob", "location"],
    sessionDuration: 30000, // 30 seconds
    category: "Government"
  },
  {
    name: "UPI Payment Gateway",
    description: "Verify your identity for secure UPI transactions and KYC compliance.",
    providerId: "upi_gateway_001",
    requestedFields: ["name", "aadhaarId"],
    sessionDuration: 30000,
    category: "Finance"
  },
  {
    name: "DigiLocker",
    description: "Access your digital documents and certificates securely.",
    providerId: "digilocker_001",
    requestedFields: ["name", "dob", "aadhaarId"],
    sessionDuration: 30000,
    category: "Government"
  },
  {
    name: "CoWIN Portal",
    description: "Verify vaccination status and schedule appointments.",
    providerId: "cowin_001",
    requestedFields: ["name", "dob", "aadhaarId"],
    sessionDuration: 30000,
    category: "Healthcare"
  },
  {
    name: "Aadhaar Authentication",
    description: "Biometric authentication for government services.",
    providerId: "aadhaar_auth_001",
    requestedFields: ["aadhaarId", "location"],
    sessionDuration: 30000,
    category: "Government"
  },
  {
    name: "Bank KYC Verification",
    description: "Complete your Know Your Customer verification for banking services.",
    providerId: "bank_kyc_001",
    requestedFields: ["name", "dob", "aadhaarId"],
    sessionDuration: 30000,
    category: "Finance"
  },
  {
    name: "GST Portal",
    description: "Business registration and tax filing verification.",
    providerId: "gst_portal_001",
    requestedFields: ["name", "aadhaarId"],
    sessionDuration: 30000,
    category: "Business"
  },
  {
    name: "PDS (Public Distribution System)",
    description: "Ration card verification for subsidized food grains.",
    providerId: "pds_001",
    requestedFields: ["name", "dob", "location"],
    sessionDuration: 30000,
    category: "Government"
  },
  {
    name: "Ayushman Bharat",
    description: "Health insurance verification and claim processing.",
    providerId: "ayushman_001",
    requestedFields: ["name", "dob", "aadhaarId"],
    sessionDuration: 30000,
    category: "Healthcare"
  },
  {
    name: "e-Court Services",
    description: "Access court documents and case status verification.",
    providerId: "ecourt_001",
    requestedFields: ["name", "aadhaarId"],
    sessionDuration: 30000,
    category: "Legal"
  }
];

export default function UserDashboard() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState([]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProviderData, setCurrentProviderData] = useState(null);

  // Session timer management
  const [sessionTimers, setSessionTimers] = useState({});
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
      // Optionally update local state/UI here
      setShowResignModal(false);
    } catch (e) {
      setResignError(e.message || "Unexpected error");
      setResignStep("error");
    }
  };

  useEffect(() => {
    // Load existing requests from localStorage on mount
    const saved = localStorage.getItem('allRequests');
    if (saved) {
      setAllRequests(JSON.parse(saved));
    }
  }, []);

  // Listen for storage events to update requests in real time
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'allRequests') {
        setAllRequests(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Filter requests for the current user (by walletAddress/aadhaarId)
  const userRequests = allRequests.filter(req => req.user?.aadhaarId === address);

  // Save timers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sessionTimers', JSON.stringify(sessionTimers));
  }, [sessionTimers]);

  // Timer effect to update session status every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Find the first pending request (no user filtering for demo)
  const pendingRequest = allRequests.find(req => req.status === "Pending");

  // Show ConsentModal for new pending requests
  useEffect(() => {
    if (pendingRequest && (!currentProviderData || currentProviderData.id !== pendingRequest.id)) {
      setCurrentProviderData(pendingRequest);
      setShowConsentModal(true);
    }
  }, [pendingRequest, currentProviderData]);

  // Clear all requests from localStorage
  const clearAllRequests = () => {
    localStorage.removeItem('allRequests');
    setAllRequests([]);
    toast({ title: 'All requests cleared' });
  };

  // Approve consent: update status, approvedFields, timer
  const handleConsentApproved = (approvedFields) => {
    if (!currentProviderData) return;
    const updatedRequests = allRequests.map(req =>
      req.id === currentProviderData.id
        ? {
            ...req,
            status: "Ongoing",
            approvedFields,
            timerEnd: Date.now() + 60000, // 1 minute
          }
        : req
    );
    setAllRequests(updatedRequests);
    localStorage.setItem("allRequests", JSON.stringify(updatedRequests));
    setShowConsentModal(false);
    setCurrentProviderData(null);
    toast({
      title: "Consent Approved",
      description: `Session started with ${currentProviderData.name}`,
    });
  };

  // Reject consent: update status
  const handleConsentRejected = () => {
    if (!currentProviderData) return;
    const updatedRequests = allRequests.map(req =>
      req.id === currentProviderData.id
        ? { ...req, status: "Rejected" }
        : req
    );
    setAllRequests(updatedRequests);
    localStorage.setItem("allRequests", JSON.stringify(updatedRequests));
    setShowConsentModal(false);
    setCurrentProviderData(null);
    toast({
      title: "Consent Rejected",
      description: "No data will be shared",
      variant: "destructive",
    });
  };

  // Revoke session: set status to 'Revoked' (only if active)
  const revokeSession = (providerId) => {
    const updatedRequests = allRequests.map(req => {
      if (req.id === providerId) {
        // Only allow revoke if not expired/completed/revoked
        const now = Date.now();
        if (req.status === "Ongoing" && req.timerEnd > now) {
          return { ...req, status: "Revoked" };
        }
      }
      return req;
    });
    setAllRequests(updatedRequests);
    localStorage.setItem("allRequests", JSON.stringify(updatedRequests));
    toast({
      title: "Session Revoked",
      description: "Access has been revoked",
    });
  };

  // Session timer display
  const getSessionStatus = (req) => {
    if (req.status === "Ongoing") {
      const now = Date.now();
      const timeLeft = req.timerEnd - now;
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
      'Legal': 'text-purple-400'
    };
    return colors[category] || 'text-zinc-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-2 sm:px-4 py-4">
      <Card className="w-full max-w-6xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
        <CardHeader className="pb-2">
          <BackButton />
          <div className="flex items-center gap-2">
            <CardTitle className="text-white text-xl font-semibold">
              Consent Dashboard
            </CardTitle>
          </div>
          <p className="text-sm text-zinc-400 pl-7 mt-1">
            Hi, {address ? address : "(not connected)"}
          </p>
          <Button onClick={clearAllRequests} variant="destructive" className="ml-auto">Clear All</Button>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-4">
          {allRequests.length === 0 && (
            <div className="text-center text-zinc-400 text-sm py-4">
              You haven't shared your data with anyone yet
            </div>
          )}
          <div className="w-full">
            <Table>
              <TableCaption className="text-zinc-400">Your data sharing activity with Bharat Stack services.</TableCaption>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Provider Name</TableHead>
                  <TableHead className="text-zinc-400">Category</TableHead>
                  <TableHead className="text-zinc-400">Approved Fields</TableHead>
                  <TableHead className="text-zinc-400">Active/Inactive</TableHead>
                  <TableHead className="text-zinc-400">Download</TableHead>
                  <TableHead className="text-zinc-400">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRequests.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={6} className="text-center text-zinc-400">
                      {/* Empty row for visual consistency */}
                    </TableCell>
                  </TableRow>
                ) : (
                  allRequests.map((provider) => {
                    const sessionStatus = getSessionStatus(provider);
                    const needsResign = ["Completed", "Revoked"].includes(provider.status) && !hasResignSignature(provider);
                    return (
                      <TableRow key={provider.id} className="border-zinc-800 hover:bg-zinc-800/50">
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
                                  onClick={() => revokeSession(provider.id)}
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
                            <Button type="button" variant="secondary" className="min-w-[120px]" onClick={() => handleResign(provider)}>
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
            <pre className="bg-zinc-800 rounded p-2 text-xs overflow-x-auto max-h-48">{JSON.stringify(pendingResignRequest, null, 2)}</pre>
            <div className="text-xs text-red-400">If you do not re-sign, you will be <b>barred from further authentication</b>.</div>
          </div>
          <DialogFooter className="mt-6">
            {resignStep !== "done" && resignStep !== "error" && (
              <Button onClick={async () => await handleResign(pendingResignRequest)} className="w-full py-2 text-base font-semibold">
                {resignStep === "proof" ? "Sign & Upload" : resignStep === "sign" ? "Signing..." : resignStep === "upload" ? "Uploading..." : "Sign & Upload"}
              </Button>
            )}
            {(resignStep === "done" || resignStep === "error") && (
              <Button onClick={() => setShowResignModal(false)} className="w-full py-2 text-base font-semibold">Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}