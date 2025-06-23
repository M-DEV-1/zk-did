"use client";

import RJSFWrapper, { CustomFieldTemplate } from "@/components/rjsfWrapper";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { Button } from "@/components/ui/button";
import { AadhaarVCSchema, AadhaarVCUISchema } from "@/lib/schemas/vcSchema";
import { Fingerprint } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";

export default function AadhaarVCForm() {
  const { toast } = useToast();
  const { address } = useAccount();
  const [formData, setFormData] = useState({ walletAddress: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData((prev) => ({ ...prev, walletAddress: address }));
    }
  }, [address]);

  const handleSubmit = async ({ formData }) => {
    setIsSubmitting(true);
    try {
      // Simulate async work (e.g., IPFS upload)
      await new Promise((res) => setTimeout(res, 1200));
      console.log("✅ Final VC payload:", formData);
      toast({
        title: "Credential prepared",
        description: "Verifiable Credential payload is ready for IPFS upload.",
      });
      // TODO: Upload to IPFS or sign
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="secondary" className="min-w-[120px]" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </Form>
    </RJSFWrapper>
  );
}
