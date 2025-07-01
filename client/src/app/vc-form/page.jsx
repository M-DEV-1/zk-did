"use client";

import RJSFWrapper, { CustomFieldTemplate } from "@/components/rjsfWrapper";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { Button } from "@/components/ui/button";
import { AadhaarVCSchema, AadhaarVCUISchema } from "@/lib/schemas/vcSchema";
import { Fingerprint, ArrowBigRightDashIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AadhaarVCForm() {
  const { toast } = useToast();
  const { address } = useAccount();
  const { signMessageAsync, data: signature } = useSignMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [signing, setSigning] = useState(false);
  const router = useRouter();

  // temporary function - before "proofs" circuit compilation script is written in 'client'
  const generateEmptyProof = () => ({
    protocol: "groth16",
    curve: "bn128",
    pi_a: ["", "", ""],
    pi_b: [["", ""], ["", ""], ["", ""]],
    pi_c: ["", "", ""],
    publicSignals: []
  });

  // initialize user-facing fields
  const [formData, setFormData] = useState({
    walletAddress: "",
    aadhaarId: "",
    name: "",
    dob: "",
    location: { latitude: 0, longitude: 0 },
    proof: generateEmptyProof()
    // hidden fields are populated before submit
  });

  // Mock data array for pre-fill
  const mockDataArray = [
    {
      aadhaarId: "123456789012",
      name: "Manoj Kumar",
      dob: "1990-01-01",
      location: { latitude: 28.6139, longitude: 77.2090 },
    },
    {
      aadhaarId: "987654321098",
      name: "Priya Sharma",
      dob: "1985-05-15",
      location: { latitude: 19.0760, longitude: 72.8777 },
    },
    {
      aadhaarId: "111122223333",
      name: "Rahul Singh",
      dob: "2000-12-31",
      location: { latitude: 12.9716, longitude: 77.5946 },
    },
  ];

  // temporary helper functions -> remove after session plugin is optional
  const generateSession = () => ({
    id: crypto.randomUUID?.() || `session_${Date.now()}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    status: "ongoing"
  });

  const generateLocationHistory = (currentLocation) => ([
    {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      session: generateSession(),
    }
  ]);

  const handlePrefill = () => {
    const random = Math.floor(Math.random() * mockDataArray.length);
    setFormData((prev) => ({
      ...prev,
      ...mockDataArray[random],
      walletAddress: address,
    }));
  };

  // set wallet address on every switch
  useEffect(() => {
    if (address) {
      setFormData((prev) => ({ ...prev, walletAddress: address }));
    }
  }, [address]);

  // ask for user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
        }));
      },
      (err) => {
        toast({
          title: "Location error",
          description: err.message,
          variant: "destructive",
        });
      }
    );
  }, []);

  const signPayload = async (payload) => {
    try {
      setSigning(true);
      const signature = await signMessageAsync({
        message: JSON.stringify(payload),
      });
      return signature;
    } catch (err) {
      toast({
        title: "Signing error",
        description: err.message || "Failed to sign message",
        variant: "destructive",
      });
      throw err;
    } finally {
      setSigning(false);
    }
  };

  const handleSubmit = useCallback(async ({ formData }) => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const verifiableCredential = {
        context: ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "AadhaarCredential"],
        issuer: "did:example:issuer",
        issuanceDate: now.toISOString(),

        // user-provided data
        walletAddress: formData.walletAddress,
        aadhaarId: formData.aadhaarId,
        name: formData.name,
        dob: formData.dob,
        location: formData.location,

        // system-generated data
        locationHistory: generateLocationHistory(formData.location),
        signatures: [], // populates after signPayload is triggered
        proof: generateEmptyProof() //TODO: replace with compile-proof script function
      };

      const signature = await signPayload(verifiableCredential);

      verifiableCredential.signatures.push({
        stage: "issue",
        value: signature,
        timestamp: new Date().toISOString()
      });

      const res = await fetch("/api/upload-vc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifiableCredential),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Credential uploaded",
          description: `IPFS CID: ${data.cid}`,
        });
        setSubmitted(true);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "Unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [signMessageAsync, toast]);

  return (
    <RJSFWrapper
      title="Issue Aadhaar Verifiable Credential"
      subtitle="Create a signed credential without revealing private data"
      icon={<Fingerprint className="w-5 h-5 text-white" />}
      showBackButton={true}
    >
      <Form
        schema={AadhaarVCSchema}
        uiSchema={AadhaarVCUISchema}
        formData={formData}
        onChange={(e) => setFormData(e.formData)}
        onSubmit={handleSubmit}
        showErrorList={false}
        liveValidate={false}
        validator={validator}
        templates={{ FieldTemplate: CustomFieldTemplate }}
      >
        <div className="pt-2 flex justify-between items-center">
          <Button type="button" variant="secondary" onClick={handlePrefill} className="text-xs px-3 py-1">
            Pre-fill
          </Button>
          <Button type="submit" variant="secondary" className="min-w-[120px]" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                {signing ? "Signing..." : isSubmitting ? "Submitting..." : ""}
              </span>
            ) : (
              "Submit"
            )}
            {/* ATTENTION
            it might be nice to have a pop up here, describing what data is collected, and what the users can do with it. a simple, " I understand what this means " popup which can be accessed by the user's later. */}
          </Button>
          <div>
            <Button
              type="button"
              variant={submitted ? "secondary" : "default"}
              size="lg"
              onClick={submitted ? () => router.push("/dashboard") : undefined}
              className={cn(!submitted && "text-muted-foreground")}
              disabled={!submitted}
            >
              Next <ArrowBigRightDashIcon />
            </Button>
          </div>
        </div>
      </Form>
    </RJSFWrapper>
  );
}
