import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";
import { getFieldInfo } from "@/lib/schemas/fieldMapping";

export default function ConsentModal({ isOpen, onClose, onApprove, onReject, providerData }) {
  const [consentData, setConsentData] = useState({});

  // Initialize consent data based on provider's requested fields
  useEffect(() => {
    if (providerData?.requestedFields) {
      const initialData = {};
      providerData.requestedFields.forEach(field => {
        initialData[field] = false;
      });
      setConsentData(initialData);
    }
  }, [providerData]);

  const handleApprove = () => {
    const approvedFields = Object.keys(consentData).filter(key => consentData[key]);
    
    if (approvedFields.length > 0) {
      onApprove({
        ...providerData,
        approvedFields: approvedFields,
      });
    }
  };

  const handleReject = () => {
    onReject();
  };

  const canApprove = Object.values(consentData).some(value => value === true);

  // Reset consent data when modal opens with new provider
  const handleOpenChange = (open) => {
    if (open && providerData?.requestedFields) {
      const initialData = {};
      providerData.requestedFields.forEach(field => {
        initialData[field] = false;
      });
      setConsentData(initialData);
    }
    onClose();
  };

  if (!providerData) {
    return null;
  }

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border border-zinc-800 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-zinc-400" />
            Data Sharing Consent
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {providerData.name} is requesting access to your data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
            <h4 className="font-medium mb-2 text-white">{providerData.name}</h4>
            <p className="text-sm text-zinc-400">{providerData.description}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-white">Requested Data:</h4>
            
            <div className="space-y-3">
              {providerData.requestedFields?.map((field) => {
                const fieldInfo = getFieldInfo(field);
                const IconComponent = fieldInfo.icon;
                
                return (
                  <div key={field} className="flex items-start space-x-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                    <Checkbox
                      id={field}
                      checked={consentData[field] || false}
                      onCheckedChange={(checked) =>
                        setConsentData(prev => ({ ...prev, [field]: checked }))
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={field}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-white cursor-pointer"
                      >
                        <IconComponent className="w-4 h-4 text-zinc-400" />
                        {fieldInfo.label}
                      </label>
                      <p className="text-xs text-zinc-400 mt-1">
                        {fieldInfo.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-950/50 border border-zinc-700 p-3 rounded-lg">
            <p className="text-sm text-zinc-300">
              <strong>Session Duration:</strong> {formatDuration(providerData.sessionDuration)}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Your data will only be accessible during this time period. You can revoke access at any time.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!canApprove}
            className="bg-white text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 