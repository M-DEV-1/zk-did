import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, XCircle, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const steps = [
  { key: "proof", label: "Generating ZK Proof" },
  { key: "sign", label: "Signing VC" },
  { key: "upload", label: "Uploading to IPFS" },
];

export default function ProofProgressModal({
  open,
  onClose,
  formData,
  onSuccess,
  signPayload,
  generateAgeProof,
}) {
  const [currentStep, setCurrentStep] = useState("proof");
  const [cid, setCid] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCid(null);
    setError(null);
    setCurrentStep("proof");

    const runSteps = async () => {
      try {
        const zkProof = await generateAgeProof(formData.dob);

        setCurrentStep("sign");
        const now = new Date();
        const vc = {
          context: ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential", "AadhaarCredential"],
          issuer: "did:example:issuer",
          issuanceDate: now.toISOString(),
          ...formData,
          locationHistory: [
            {
              ...formData.location,
              session: { id: crypto.randomUUID(), createdAt: now.toISOString() },
            },
          ],
          signatures: [],
          proof: zkProof,
        };

        const signature = await signPayload(vc);
        vc.signatures.push({
          stage: "issue",
          value: signature,
          timestamp: new Date().toISOString(),
        });

        setCurrentStep("upload");

        const res = await fetch("/api/upload-vc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vc),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");

        setCid(data.cid);
        onSuccess(data.cid);
        setDone(true);
      } catch (err) {
        setError(err.message || "Unexpected error");
      }
    };
    if(!open) return;
    setDone(false);
    runSteps();
  }, [open]);

  const renderStepIcon = (stepKey, index) => {
    const currentIdx = steps.findIndex((s) => s.key === currentStep);
    const isDone = index < currentIdx || (done && index === currentIdx);
    const isActive = index === currentIdx && !done;

    if (error) return <XCircle className="w-5 h-5 text-red-500" />;
    if (isDone) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isActive) return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
    return <div className="w-5 h-5 rounded-full border border-zinc-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 text-white rounded-xl p-6 max-w-md border border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {cid ? "✅ VC Uploaded Successfully" : "Hold on, verifying your credential..."}
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-1">
            {cid ? "Copy your CID or continue." : "This might take a few seconds. Don’t close the window."}
          </p>
        </DialogHeader>

        <Progress
          value={((cid || error) ? 3 : steps.findIndex((s) => s.key === currentStep)) / steps.length * 100}
          className="h-2 bg-white rounded-lg"
        />

        <div className="mt-6 space-y-5">
          <div className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                {renderStepIcon(step.key, i)}
                <span className={cn("text-sm", i === steps.findIndex(s => s.key === currentStep) && "text-white")}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg p-3">
              ❌ <strong>Error:</strong> {error}
            </div>
          )}

          {cid && (
            <div className="text-sm text-green-400 bg-green-950 border border-green-800 rounded-lg p-4 space-y-2">
              <div className="font-semibold text-white">CID</div>
              <div className="flex items-center gap-2 text-white break-all">
                <code className="flex-1">{cid}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(cid);
                    toast({ title: "Copied", description: "CID copied to clipboard" });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
