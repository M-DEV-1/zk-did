import { Calendar, MapPin, User, CreditCard, FileText, LucideIcon } from "lucide-react";

interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  type?: string;
  required?: string[];
  format?: string;
}

interface FieldInfo {
  label: string;
  icon: LucideIcon;
  description: string;
  placeholder: string;
  type: string;
  validation?: FieldValidation;
}

type FieldMappingType = {
  [key: string]: FieldInfo;
};

// Field mapping configuration for dynamic consent UI
// Only includes fields that actually exist in vcSchema.js
export const FIELD_MAPPING: FieldMappingType = {
  cid: {
    label: "Verifiable Credential ID",
    icon: CreditCard,
    description: "Your unique credential identifier on IPFS",
    placeholder: "IPFS CID",
    type: "text",
    validation: {
      minLength: 10,
      maxLength: 100
    }
  },
  name: {
    label: "Full Name",
    icon: User,
    description: "Your legal name as it appears on official documents",
    placeholder: "e.g. Manoj Kumar",
    type: "text",
    validation: {
      minLength: 3,
      maxLength: 64
    }
  },
  dob: {
    label: "Date of Birth",
    icon: Calendar,
    description: "Your birth date for age verification",
    placeholder: "YYYY-MM-DD",
    type: "date",
    validation: {
      format: "date"
    }
  },
  location: {
    label: "Current Location",
    icon: MapPin,
    description: "Your current GPS coordinates (latitude and longitude)",
    placeholder: "Auto-detected",
    type: "location",
    validation: {
      type: "object",
      required: ["latitude", "longitude"]
    }
  }
};

// Get field display info
export const getFieldInfo = (fieldName: string): FieldInfo => {
  return FIELD_MAPPING[fieldName] || {
    label: fieldName,
    icon: FileText,
    description: `Access to your ${fieldName}`,
    placeholder: "",
    type: "text"
  };
};

// Get all available fields from the schema
export const getAvailableFields = (): string[] => {
  return Object.keys(FIELD_MAPPING);
};

interface ValidationResult {
  isValid: boolean;
  invalidFields: string[];
  validFields: string[];
}

// Validate field names against schema
export const validateFields = (requestedFields: string[]): ValidationResult => {
  const availableFields = getAvailableFields();
  const invalidFields = requestedFields.filter(field => !availableFields.includes(field));
  
  return {
    isValid: invalidFields.length === 0,
    invalidFields,
    validFields: requestedFields.filter(field => availableFields.includes(field))
  };
};

// Get schema fields for validation
export const getSchemaFields = (): Record<string, string> => {
  return {
    walletAddress: "Wallet Address (auto-filled)",
    cid: "Verifiable Credential ID",
    name: "Full Name", 
    dob: "Date of Birth",
    location: "Location Coordinates",
    signature: "Signature (auto-generated)"
  };
}; 