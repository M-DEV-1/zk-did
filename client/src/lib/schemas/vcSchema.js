/*
  Aadhaar Verifiable-Credential (demo)
  – version 0.2 –
  Adds:  session, locationHistory[], proofs
*/

export const AadhaarVCSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    $id: "https://example.com/vc/aadhaar-v0.2.json", // placeholder for now
    title: "Aadhaar Verifiable Credential",
    type: "object",

    required: [
        //"context", "type", "issuer", "issuanceDate",
        "walletAddress", "aadhaarId", "name", "dob", "location",
        //"signatures", "proof" 
    ],

    properties: {
        /** === W3C VC envelope bits (minimal) =========================== **/
        context: { type: "array", items: { type: "string" } },
        type: { type: "array", items: { type: "string" } },
        issuer: { type: "string" },
        issuanceDate: { type: "string", format: "date-time" },

        /** === Subject claims =========================================== **/
        walletAddress: {
            type: "string",
            title: "Wallet Address",
            pattern: "^0x[a-fA-F0-9]{40}$",
            minLength: 42, maxLength: 42
        },
        aadhaarId: {
            type: "string",
            title: "Aadhaar Number",
            pattern: "^[0-9]{12}$",
            minLength: 12, maxLength: 12
        },
        name: {
            type: "string",
            title: "Full Name",
            minLength: 3, maxLength: 64
        },
        dob: {
            type: "string",
            title: "Date of Birth",
            format: "date"
        },
        location: {
            title: "Location",
            type: "object",
            required: ["latitude", "longitude"],
            properties: {
                latitude: { title: "Latitude", type: "number", minimum: -90, maximum: 90 },
                longitude: { title: "Longitude", type: "number", minimum: -180, maximum: 180 }
            }
        },
        challenge: {
            type: "string",
            title: "Challenge",
        },
        referenceYear: {
            type: "number",
            title: "Reference Year",
            minimum: 1900, maximum: 2100
        },

        /** === Extra, mutable =========================================== **/

        locationHistory: {
            type: "array",
            items: {
                type: "object",
                required: ["latitude", "longitude", "session"],
                properties: {
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    session: {
                        type: "object",
                        required: ["id", "createdAt", "expiresAt", "status"],
                        properties: {
                            id: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                            expiresAt: { type: "string", format: "date-time" },
                            status: { type: "string", enum: ["ongoing", "revoked", "completed"] }
                        }
                    },
                }
            }
        },

        /** === Signatures ============================================== **/
        signatures: {
            type: "array",
            items: {
                type: "object",
                required: ["stage", "value", "timestamp"],
                properties: {
                    stage: {
                        type: "string",
                        enum: ["issue", "consent", "revoke", "complete"]
                    },
                    value: { type: "string" },
                    timestamp: { type: "string", format: "date-time" }
                }
            },
            // minItems: 1
        },

        /** === zk-SNARK Proof ========================================== **/
        proof: {
            type: "object",
            // required: ["protocol", "curve", "pi_a", "pi_b", "pi_c", "publicSignals"],
            properties: {
                protocol: { type: "string", enum: ["groth16"] },
                curve: { type: "string", enum: ["bn128", "bls12_381"] },
                pi_a: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3, maxItems: 3
                },
                pi_b: {
                    type: "array",
                    items: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 2, maxItems: 2
                    },
                    minItems: 3, maxItems: 3
                },
                pi_c: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3, maxItems: 3
                },
                publicSignals: {
                    type: "array",
                    items: { type: "string" }
                }
            }
        }
    }
};

export const AadhaarVCUISchema = {
    "ui:title": false,
    context: {
        "ui:widget": "hidden"
    },
    type: {
        "ui:widget": "hidden"
    },
    issuer: {
        "ui:widget": "hidden"
    },
    issuanceDate: {
        "ui:widget": "hidden"
    },
    locationHistory: {
        "ui:widget": "hidden"
    },
    signatures: {
        "ui:widget": "hidden"
    },
    proof: {
        "ui:widget": "hidden"
    },
    challenge: {
        "ui:widget": "hidden"
    },
    referenceYear: {
        "ui:widget": "hidden"
    },
    walletAddress: {
        "ui:readonly": true,
        "ui:disabled": true
    },
    dob: {
        "ui:options": {
            "inputType": "date",
        }
    },

    location: {
        "ui:title": false,
        latitude: { "ui:readonly": true, "ui:disabled": true, "ui:placeholder": "28.6139" },
        longitude: { "ui:readonly": true, "ui:disabled": true, "ui:placeholder": "77.2090" }
    }
};
