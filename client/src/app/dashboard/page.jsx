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
    </div>
  );
}