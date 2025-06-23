/*
This is customizable schema for our credentials schema. This is a temporary setup for testing. We can upgrade this to include more fields, and even add more validation checks.
*/

import { RJSFSchema } from '@rjsf/utils';
// how to validate without typescript?

export const AadhaarVCSchema = {
    "type": "object",
    "required": ["walletAddress", "name", "dob", "aadhaarId", "location"],
    "properties": {
        "walletAddress": {
            "type": "string",
            "title": "Wallet Address",
            "pattern": "^0x[a-fA-F0-9]{40}$",
            "minLength": 42,
            "maxLength": 42
        },
        "aadhaarId": {
            "type": "string",
            "title": "Aadhaar Number",
            "pattern": "^[0-9]{12}$",
            "minLength": 12,
            "maxLength": 12
        },
        "name": {
            "type": "string",
            "title": "Full Name",
            "minLength": 3,
            "maxLength": 64
        },
        "dob": {
            "type": "string",
            "title": "Date of Birth",
            "format": "date"
        },
        "location": {
            "type": "object",
            "title": "Location Coordinates",
            "required": ["latitude", "longitude"],
            "properties": {
                "latitude": {
                    "type": "number",
                    "title": "Latitude",
                    "minimum": -90,
                    "maximum": 90
                },
                "longitude": {
                    "type": "number",
                    "title": "Longitude",
                    "minimum": -180,
                    "maximum": 180
                }
                // TODO: explore dynamic location - further
            }
        },
    }
};


export const AadhaarVCUISchema = {
    "walletAddress": {
        "ui:readonly": true,
        "ui:disabled": true,
        "ui:widget": "text",
        // "ui:help": "Auto-filled from connected wallet"
    },
    "aadhaarId": {
        "ui:placeholder": "12-digit Aadhaar number",
        "ui:options": {
            "inputType": "text",
            "inlineHelp": true,
        },
        // "ui:help": "Must be exactly 12 numeric digits",
    },
    "name": {
        "ui:placeholder": "e.g. Manoj Kumar",
    },
    "dob": {
        "ui:options": {
            "inputType": "date",
        },
    },
    "location": {
        "ui:options": {
            "label": false,
        },
        "latitude": {
            "ui:placeholder": "e.g. 28.6139",
        },
        "longitude": {
            "ui:placeholder": "e.g. 77.2090",
        },
    },
};



