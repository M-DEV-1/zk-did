/*
  Aadhaar Verifiable-Credential (demo)
  – version 0.2 –
  Adds:  session, locationHistory[], proofs
*/

export const AadhaarVCSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://example.com/vc/aadhaar-v0.2.json", // placeholder for now
    title: "Aadhaar Verifiable Credential",
    type: "object",

    required: [
        "context", "type", "issuer", "issuanceDate",
        "walletAddress", "aadhaarId", "name", "dob", "location",
        "signatures", "proof" 
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
            type: "object",
            required: ["latitude", "longitude"],
            properties: {
                latitude: { type: "number", minimum: -90, maximum: 90 },
                longitude: { type: "number", minimum: -180, maximum: 180 }
            }
        },

        /** === Extra, mutable =========================================== **/
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

        locationHistory: {
            type: "array",
            items: {
                type: "object",
                required: ["latitude", "longitude", "timestamp"],
                properties: {
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    timestamp: { type: "string", format: "date-time" }
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
            minItems: 1
        },

        /** === zk-SNARK Proof ========================================== **/
        proof: {
            type: "object",
            required: ["protocol", "curve", "pi_a", "pi_b", "pi_c", "publicSignals"],
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
    walletAddress: { "ui:readonly": true, "ui:disabled": true },
    dob: {
        "ui:options": {
            "inputType": "date",
        }
    },
    location: {
        "ui:readonly": true, "ui:disabled": true,
        latitude: { "ui:placeholder": "28.6139" },
        longitude: { "ui:placeholder": "77.2090" }
    },
    // all below, are system-managed
    signatures: { "ui:widget": "hidden" },
    session: { "ui:widget": "hidden" },
    locationHistory: { "ui:widget": "hidden" },
    proof: { "ui:widget": "hidden" }
};
