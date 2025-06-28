import { Calendar, MapPin, User, CreditCard, FileText } from "lucide-react";

// Field mapping configuration for dynamic consent UI
// Only includes fields that actually exist in vcSchema.js
export const FIELD_MAPPING = {
  aadhaarId: {
    label: "Aadhaar Number",
    icon: CreditCard,
    description: "Your 12-digit Aadhaar identification number",
    placeholder: "12-digit number",
    type: "text",
    validation: {
      pattern: "^[0-9]{12}$",
      minLength: 12,
      maxLength: 12
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
export const getFieldInfo = (fieldName) => {
  return FIELD_MAPPING[fieldName] || {
    label: fieldName,
    icon: FileText,
    description: `Access to your ${fieldName}`,
    placeholder: "",
    type: "text"
  };
};

// Get all available fields from the schema
export const getAvailableFields = () => {
  return Object.keys(FIELD_MAPPING);
};

// Validate field names against schema
export const validateFields = (requestedFields) => {
  const availableFields = getAvailableFields();
  const invalidFields = requestedFields.filter(field => !availableFields.includes(field));
  
  return {
    isValid: invalidFields.length === 0,
    invalidFields,
    validFields: requestedFields.filter(field => availableFields.includes(field))
  };
};

// Get schema fields for validation
export const getSchemaFields = () => {
  return {
    walletAddress: "Wallet Address (auto-filled)",
    aadhaarId: "Aadhaar Number",
    name: "Full Name", 
    dob: "Date of Birth",
    location: "Location Coordinates",
    signature: "Signature (auto-generated)"
  };
}; 