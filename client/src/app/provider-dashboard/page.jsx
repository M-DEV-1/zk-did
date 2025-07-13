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

const PROOF_STATUS_OPTIONS = [
  { value: "awaited", label: "Awaited" },
  { value: "Valid", label: "Valid" },
  { value: "Invalid", label: "Invalid" },
];

function formatISTTime(date) {
  return date.toLocaleTimeString("en-IN", { hour12: false });
}

export default function ProviderDashboard() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProofs, setSelectedProofs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Multi-select filters
  const [userFilter, setUserFilter] = useState([]);
  const [proofFilter, setProofFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [proofStatusFilter, setProofStatusFilter] = useState([]);
  const [sortBy, setSortBy] = useState("requestTime");
  const [sortDir, setSortDir] = useState("desc");

  // FIXED: Added missing state declarations
  const [verificationInProgress, setVerificationInProgress] = useState(new Set());

  function formatCid(cid) {
    if (typeof cid !== "string") {
      console.warn("Invalid cid passed to formatCid:", cid);
      return "Invalid CID";
    }
    return cid.slice(0, 4) + "..." + cid.slice(-4);
  }


  // FIXED: Define fetchRequests function properly
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests/provider");
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast({
        title: "Error fetching requests",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        console.log("Fetching users from database...");

        const response = await fetch("/api/users");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.users) {
          throw new Error("Invalid response format - missing users array");
        }

        setUsers(data.users);
        if (data.users.length > 0) {
          setSelectedUser(data.users[0]);
          console.log(`Loaded ${data.users.length} users from database`);
        } else {
          console.log("No users found in database");
        }

      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: `Failed to fetch users: ${error.message}`,
          variant: "destructive"
        });
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // FIXED: Improved verification effect that runs immediately when status changes to "Ongoing"
  useEffect(() => {
    const verifyPendingProofs = async () => {
      const pending = requests.filter(req =>
        req.status === "Ongoing" &&
        req.proofStatus === "awaited" &&
        !verificationInProgress.has(req.sessionId)
      );

      if (pending.length === 0) return;

      console.log(`Found ${pending.length} requests needing verification`);

      for (const req of pending) {
        try {
          console.log(`Starting verification for session: ${req.sessionId}`);

          setVerificationInProgress(prev => new Set(prev).add(req.sessionId));

          // Handle proofType as array - verify each proof type
          const proofTypes = Array.isArray(req.proofType) ? req.proofType : [req.proofType];

          for (const proofType of proofTypes) {
            console.log(`Verifying proof type: ${proofType} for session: ${req.sessionId}`);

            const res = await fetch("/api/verify-proof", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cid: req.cid,
                proofType: proofType,
                sessionId: req.sessionId
              })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Proof verification failed");

            console.log(`Verification result for ${proofType}:`, data);

            toast({
              title: "Proof Verified",
              description: `${proofType}: ${data.proofStatus}`,
              variant: data.verified ? "default" : "destructive"
            });
          }

          // Refresh requests after successful verification
          await fetchRequests();

        } catch (err) {
          console.error("Verification error:", err);
          toast({
            title: "Verification Failed",
            description: err.message,
            variant: "destructive"
          });
        } finally {
          setVerificationInProgress(prev => {
            const next = new Set(prev);
            next.delete(req.sessionId);
            return next;
          });
        }
      }
    };

    // Run verification immediately when there are pending requests
    if (requests.length > 0) {
      verifyPendingProofs();
    }
  }, [requests, toast]); // FIXED: Depend on the actual requests array, not just length

  // Filtering and sorting
  const filteredRequests = requests.filter((req) => {
    const userMatch = userFilter.length === 0 || userFilter.includes(req.cid);
    const proofMatch = proofFilter.length === 0 || proofFilter.some(p =>
      Array.isArray(req.proofType) ? req.proofType.includes(p) : req.proofType === p
    );
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(req.status);
    const proofStatusMatch = proofStatusFilter.length === 0 || proofStatusFilter.includes(req.proofStatus);
    return userMatch && proofMatch && statusMatch && proofStatusMatch;
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
      const aProof = Array.isArray(a.proofType) ? a.proofType.join(", ") : a.proofType;
      const bProof = Array.isArray(b.proofType) ? b.proofType.join(", ") : b.proofType;
      return sortDir === "asc"
        ? aProof.localeCompare(bProof)
        : bProof.localeCompare(aProof);
    }
    if (sortBy === "status") {
      return sortDir === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    if (sortBy === "proofStatus") {
      return sortDir === "asc"
        ? (a.proofStatus || "").localeCompare(b.proofStatus || "")
        : (b.proofStatus || "").localeCompare(a.proofStatus || "");
    }
    return 0;
  });

  // FIXED: Improved error handling in handleSendRequest
  const handleSendRequest = async () => {
    if (!selectedUser || selectedProofs.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a user and at least one proof type",
        variant: "destructive"
      });
      return;
    }

    if (!selectedUser.cid) {
      toast({
        title: "Validation Error",
        description: "Selected user does not have a valid credential ID",
        variant: "destructive"
      });
      return;
    }

    if (!selectedUser.walletAddress) {
      toast({
        title: "Validation Error",
        description: "Selected user does not have a valid wallet address",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      console.log(`Sending request to user: ${selectedUser.name} (${selectedUser.cid})`);

      const requestedFields = selectedProofs.map((proof) =>
        proof === "age" ? "dob" : proof === "location" ? "location" : proof
      );

      const providerRequest = {
        cid: selectedUser.cid,
        provider: {
          name: "Provider Admin",
          description: `Proof requested: ${selectedProofs.join(", ")}`,
          providerId: `provider_admin_${selectedUser.cid}`,
          sessionDuration: 120000,
          category: "Admin"
        },
        requestedFields,
        proofType: selectedProofs
      };

      const response = await fetch("/api/request-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providerRequest),
      });

      // FIXED: Better error handling for non-JSON responses
      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.provider || !data.provider.requestMetadata || !data.provider.requestMetadata.sessionId) {
        throw new Error("Invalid response format - missing session ID");
      }

      // Refresh requests after successful send
      await fetchRequests();

      setShowModal(false);
      setSelectedProofs([]);
      toast({
        title: "Request Sent",
        description: `Request sent to ${selectedUser.name}`
      });
      console.log(`Request sent successfully. Session ID: ${data.provider.requestMetadata.sessionId}`);

    } catch (error) {
      console.error("Error sending request:", error);
      toast({
        title: "Error",
        description: `Failed to send request: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // FIXED: Simplified session update handler without resign modal
  const handleSessionUpdate = async (req, status) => {
    try {
      console.log(`Updating session for request ${req.sessionId} to status: ${status}`);

      const updateData = {
        sessionId: req.sessionId,
        status: status === "completed" ? "Completed" : "Revoked"
      };

      const response = await fetch("/api/provider/update-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      await fetchRequests(); // Refresh the requests list

      toast({
        title: "Session Updated",
        description: `Request ${status === "completed" ? "completed" : "revoked"} successfully`,
        variant: "default"
      });

    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: `Failed to update session: ${error.message}`,
        variant: "destructive"
      });
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
            {isLoadingUsers ? (
              <div className="text-zinc-400">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-zinc-400">No users found in database</div>
            ) : (
              <>
                <Select value={selectedUser?.cid} onValueChange={val => setSelectedUser(users.find(u => u.cid === val))}>
                  <SelectTrigger className="w-full max-w-xs bg-zinc-800 text-white border-zinc-700">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                    {users.map(user => (
                      <SelectItem key={user.cid} value={user.cid} className="text-white">
                        {user.name} ({formatCid(user.cid)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="mt-4" onClick={() => setShowModal(true)} disabled={!selectedUser}>
                  Send Request <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h3 className="text-white text-lg font-semibold">Requests</h3>
              <Button variant="outline" size="sm" onClick={fetchRequests}>
                Refresh
              </Button>
              <MultipleSelector
                options={users.map(u => ({ value: u.cid, label: u.name }))}
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
              <MultipleSelector
                options={PROOF_STATUS_OPTIONS}
                value={proofStatusFilter}
                onChange={setProofStatusFilter}
                placeholder="Filter by proof status"
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
                  <TableHead onClick={() => handleSort("proofStatus")} className="cursor-pointer">Proof Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-400">No requests yet.</TableCell>
                  </TableRow>
                ) : (
                  sortedRequests.map((req) => (
                    <TableRow key={req.sessionId}>
                      <TableCell>
                        <div className="font-medium text-white">{req.user.name}</div>
                        <div className="text-xs text-zinc-400">{formatCid(req.cid)}</div>
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
                      </TableCell>
                      <TableCell className="text-white">
                        {req.proofStatus === "awaited" && <span className="text-yellow-400">Awaited</span>}
                        {req.proofStatus === "Valid" && <span className="text-green-400">Valid</span>}
                        {req.proofStatus === "Invalid" && <span className="text-red-400">Invalid</span>}
                        {!req.proofStatus && <span className="text-zinc-400">-</span>}
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
              <div className="text-xs text-zinc-400">{selectedUser?.cid}</div>
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
    </div>
  );
}