"use client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MultipleSelector } from "@/components/multiple-selector";

// Mock user list
const MOCK_USERS = [
  { aadhaarId: "123456789012", name: "Manoj Kumar" },
  { aadhaarId: "987654321098", name: "Priya Sharma" },
  { aadhaarId: "111122223333", name: "Rahul Singh" },
  { aadhaarId: "444455556666", name: "Asha Patel" },
  { aadhaarId: "777788889999", name: "Vikram Rao" },
];

const PROOF_OPTIONS = [
  { value: "age", label: "Age (Are you >= 18?)" },
  { value: "location", label: "Location (Are you within X km of Y?)" },
];

const STATUS_OPTIONS = [
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Completed" },
  { value: "Rejected", label: "Rejected" },
  { value: "Revoked", label: "Revoked" },
];

function formatISTTime(date) {
  return date.toLocaleTimeString("en-IN", { hour12: false });
}

export default function ProviderDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]); // All sent requests
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
  const [selectedProofs, setSelectedProofs] = useState([]); // Multi-select for proofs
  const [isSending, setIsSending] = useState(false);
  // Multi-select filters
  const [userFilter, setUserFilter] = useState([]);
  const [proofFilter, setProofFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [sortBy, setSortBy] = useState("requestTime");
  const [sortDir, setSortDir] = useState("desc");
  const [showResignModal, setShowResignModal] = useState(false);
  const [pendingResignVC, setPendingResignVC] = useState(null);
  const [pendingResignStatus, setPendingResignStatus] = useState("");
  const [pendingResignRequest, setPendingResignRequest] = useState(null);
  const [isResigning, setIsResigning] = useState(false);

  const clearAllRequests = () => {
    localStorage.removeItem('allRequests');
    setRequests([]);
    toast({ title: 'All requests cleared' });
  };

  // Load requests from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("allRequests");
    if (saved) setRequests(JSON.parse(saved));
  }, []);

  // Save requests to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("allRequests", JSON.stringify(requests));
  }, [requests]);

  // Listen for status updates from user dashboard (for demo, use storage event)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "allRequests") {
        setRequests(JSON.parse(e.newValue || "[]"));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Filtering and sorting
  const filteredRequests = requests.filter((req) => {
    const userMatch = userFilter.length === 0 || userFilter.includes(req.user.aadhaarId);
    const proofMatch = proofFilter.length === 0 || proofFilter.includes(req.proofType);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(req.status);
    return userMatch && proofMatch && statusMatch;
  });
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === "requestTime") {
      return sortDir === "asc"
        ? a.requestTime - b.requestTime
        : b.requestTime - a.requestTime;
    }
    if (sortBy === "user") {
      return sortDir === "asc"
        ? a.user.name.localeCompare(b.user.name)
        : b.user.name.localeCompare(a.user.name);
    }
    if (sortBy === "proofType") {
      return sortDir === "asc"
        ? a.proofType.localeCompare(b.proofType)
        : b.proofType.localeCompare(a.proofType);
    }
    if (sortBy === "status") {
      return sortDir === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  // Handle sending a request
  const handleSendRequest = async () => {
    if (!selectedUser || selectedProofs.length === 0) return;
    setIsSending(true);
    try {
      // For demo, proofType maps to requestedFields
      const requestedFields = selectedProofs.map((proof) =>
        proof === "age" ? "dob" : proof === "location" ? "location" : proof
      );
      const providerRequest = {
        walletAddress: selectedUser.aadhaarId, // For demo, use Aadhaar as wallet
        provider: {
          name: "Provider Admin",
          description: `Proof requested: ${selectedProofs.join(", ")}`,
          providerId: `provider_admin_${selectedUser.aadhaarId}`,
          sessionDuration: 60000, // 1 minute
          category: "Admin"
        },
        requestedFields,
        proofType: selectedProofs // now an array
      };
      const response = await fetch("/api/request-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providerRequest),
      });
      if (response.ok) {
        const data = await response.json();
        const providerDetails = {
          name: "Provider Admin",
          description: `Proof requested: ${selectedProofs.join(", ")}`,
          providerId: `provider_admin_${selectedUser.aadhaarId}`,
          sessionDuration: 60000, // 1 minute
          category: "Admin"
        };
        const newReq = {
          id: data.provider.requestMetadata.sessionId,
          user: selectedUser,
          proofType: selectedProofs, // now an array
          requestTime: Date.now(),
          status: "Pending",
          timerEnd: Date.now() + 60000, // 1 minute
          ...providerDetails,
          requestedFields,
        };
        // Add to allRequests in localStorage
        const allRequests = JSON.parse(localStorage.getItem("allRequests") || "[]");
        allRequests.unshift(newReq);
        localStorage.setItem("allRequests", JSON.stringify(allRequests));
        setRequests(allRequests);
        setShowModal(false);
        setSelectedProofs([]);
        toast({ title: "Request Sent", description: `Request sent to ${selectedUser.name}` });
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.error || "Failed to send request", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  // Handler for Complete/Revoke
  const handleSessionUpdate = async (req, status) => {
    // Mock VC and session info for demo
    const vc = {
      walletAddress: req.user.aadhaarId,
      issuer: req.providerId,
      locationHistory: req.locationHistory || [],
      challenge: req.challenge || "old-challenge"
    };
    const session = {
      id: req.id,
      createdAt: new Date(req.requestTime).toISOString(),
      expiresAt: new Date(req.timerEnd).toISOString()
    };
    // Mock location (could use real geolocation)
    const location = { latitude: 28.6139, longitude: 77.2090 };
    setIsResigning(true);
    try {
      const response = await fetch("/api/vc-session-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vc, session, status, location })
      });
      if (response.ok) {
        const data = await response.json();
        setPendingResignVC(data.updatedVC);
        setPendingResignStatus(status);
        setPendingResignRequest(req);
        setShowResignModal(true);
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.error || "Failed to update session", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsResigning(false);
    }
  };

  // Timer/status update
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests((prev) =>
        prev.map((req) => {
          if (req.status !== "Ongoing" && req.status !== "Pending") return req;
          const now = Date.now();
          if (now >= req.timerEnd) {
            return { ...req, status: "Completed" };
          }
          return req;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Table header click for sorting
  const handleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-2 sm:px-4 py-4">
      <Card className="w-full max-w-5xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-xl font-semibold">Provider Dashboard</CardTitle>
          <p className="text-sm text-zinc-400 mt-1">Send proof requests to users and track their status.</p>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <div>
            <h3 className="text-white text-lg font-semibold mb-2">Select User</h3>
            <Select value={selectedUser?.aadhaarId} onValueChange={val => setSelectedUser(MOCK_USERS.find(u => u.aadhaarId === val))}>
              <SelectTrigger className="w-full max-w-xs bg-zinc-800 text-white border-zinc-700">
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                {MOCK_USERS.map(user => (
                  <SelectItem key={user.aadhaarId} value={user.aadhaarId} className="text-white">
                    {user.name} ({user.aadhaarId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="mt-4" onClick={() => setShowModal(true)}>
              Send Request <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button onClick={() => {localStorage.removeItem('allRequests');}} variant="destructive" className="ml-auto">Clear All</Button>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h3 className="text-white text-lg font-semibold">Requests</h3>
              <MultipleSelector
                options={MOCK_USERS.map(u => ({ value: u.aadhaarId, label: u.name }))}
                value={userFilter}
                onChange={setUserFilter}
                placeholder="Filter by user"
                className="max-w-xs"
              />
              <MultipleSelector
                options={PROOF_OPTIONS}
                value={proofFilter}
                onChange={setProofFilter}
                placeholder="Filter by proof"
                className="max-w-xs"
              />
              <MultipleSelector
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status"
                className="max-w-xs"
              />
            </div>
            <Table>
              <TableCaption className="text-zinc-400">All requests sent to users.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("user")} className="cursor-pointer">USER</TableHead>
                  <TableHead onClick={() => handleSort("requestTime")} className="cursor-pointer">Request Time</TableHead>
                  <TableHead onClick={() => handleSort("proofType")} className="cursor-pointer">Proof Requested</TableHead>
                  <TableHead onClick={() => handleSort("status")} className="cursor-pointer">Timer Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-zinc-400">No requests yet.</TableCell>
                  </TableRow>
                ) : (
                  sortedRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium text-white">{req.user.name}</div>
                        <div className="text-xs text-zinc-400">{req.user.aadhaarId}</div>
                      </TableCell>
                      <TableCell className="text-white">{formatISTTime(new Date(req.requestTime))}</TableCell>
                      <TableCell className="text-white">{
                        Array.isArray(req.proofType)
                          ? req.proofType.map(pt => PROOF_OPTIONS.find(p => p.value === pt)?.label || pt).join(", ")
                          : PROOF_OPTIONS.find(p => p.value === req.proofType)?.label || req.proofType
                      }</TableCell>
                      <TableCell className="text-white">
                        {req.status === "Ongoing" && (
                          <span className="text-yellow-400">Ongoing ({Math.max(0, Math.floor((req.timerEnd - Date.now()) / 1000))}s)</span>
                        )}
                        {req.status === "Pending" && <span className="text-blue-400">Pending</span>}
                        {req.status === "Completed" && <span className="text-green-400">Completed</span>}
                        {req.status === "Rejected" && <span className="text-red-400">Rejected</span>}
                        {req.status === "Revoked" && <span className="text-purple-400">Revoked</span>}
                        {/* Action buttons for Complete/Revoke */}
                        {(req.status === "Ongoing" || req.status === "Pending") && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="success" disabled={isResigning} onClick={() => handleSessionUpdate(req, "completed")}>Complete</Button>
                            <Button size="sm" variant="destructive" disabled={isResigning} onClick={() => handleSessionUpdate(req, "revoked")}>Revoke</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal for proof selection */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-white bg-zinc-900 border-zinc-800 max-w-md w-full p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Send Proof Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-zinc-800 rounded-lg p-4 flex flex-col gap-1 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">User</div>
              <div className="font-semibold text-base text-white">{selectedUser?.name}</div>
              <div className="text-xs text-zinc-400">{selectedUser?.aadhaarId}</div>
            </div>
            <div className="border-t border-zinc-700 my-2" />
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Proof(s) Requested</div>
              <MultipleSelector
                options={PROOF_OPTIONS}
                value={selectedProofs}
                onChange={setSelectedProofs}
                placeholder="Select proof(s)"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={handleSendRequest} disabled={isSending} className="w-full py-2 text-base font-semibold">
              {isSending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* update this modal with proof generation logic for location */}
      <Dialog open={showResignModal} onOpenChange={setShowResignModal}>
        <DialogContent className="text-white bg-zinc-900 border-zinc-800 max-w-lg w-full p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Re-sign VC ({pendingResignStatus})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-zinc-300">A new challenge and session ID have been generated. Please re-sign the updated VC to complete this action.</div>
            <pre className="bg-zinc-800 rounded p-2 text-xs overflow-x-auto max-h-48">{JSON.stringify(pendingResignVC, null, 2)}</pre>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => setShowResignModal(false)} className="w-full py-2 text-base font-semibold">Sign (stub)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 