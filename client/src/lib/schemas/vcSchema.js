/*
  Aadhaar Verifiable-Credential (demo)
  – version 0.3 –
  Adds:  proof, zkProof, challenge, referenceYear
*/

export const AadhaarVCSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "https://example.com/vc/aadhaar-v0.3.json", // placeholder for now
    "title": "Aadhaar Verifiable Credential",
    "type": "object",

    "required": [
        "@context", "type", "issuer", "issuanceDate", "credentialSubject", "zkProof", "proof"
    ],

    "properties": {
        /** === W3C VC envelope bits ============================================ **/
        "@context": { "type": "array", "items": { "type": "string" }, "default": ["https://www.w3.org/2018/credentials/v1"] },
        "type": { "type": "array", "items": { "type": "string" }, "default": ["VerifiableCredential"] },
        "issuer": { "type": "string", "default": "did:example:issuer" },
        "issuanceDate": { "type": "string", "format": "date-time" },
        "challenge": { "type": "string" },
        "referenceYear": { "type": "number", "minimum": 1900, "maximum": 2100 },

        "credentialSubject": {
            "type": "object",
            "title": "Fill the following details",
            "required": ["walletAddress", "aadhaarId", "name", "dob", "location"],
            /** === Subject claims =========================================== **/
            "properties": {
                "walletAddress": {
                    "type": "string",
                    "title": "Wallet Address",
                    "pattern": "^0x[a-fA-F0-9]{40}$",
                    "minLength": 42, "maxLength": 42
                },
                "aadhaarId": {
                    "type": "string",
                    "title": "Aadhaar Number",
                    "pattern": "^[0-9]{12}$",
                    "minLength": 12, "maxLength": 12
                },
                "name": {
                    "type": "string",
                    "title": "Full Name",
                    "minLength": 3, "maxLength": 64
                },
                "dob": {
                    "type": "string",
                    "title": "Date of Birth",
                    "format": "date"
                },
                "location": {
                    "title": "Location",
                    "type": "object",
                    "required": ["latitude", "longitude"],
                    "properties": {
                        "latitude": { "title": "Latitude", "type": "number", "minimum": -90, "maximum": 90 },
                        "longitude": { "title": "Longitude", "type": "number", "minimum": -180, "maximum": 180 }
                    }
                },
                /** === Extra, mutable =========================================== **/

                "locationHistory": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["latitude", "longitude", "session"],
                        "properties": {
                            "latitude": { "type": "number" },
                            "longitude": { "type": "number" },
                            "session": {
                                "type": "object",
                                "required": ["id", "createdAt", "expiresAt", "status"],
                                "properties": {
                                    "id": { type: "string" },
                                    "createdAt": { type: "string", format: "date-time" },
                                    "expiresAt": { type: "string", format: "date-time" },
                                    "status": { type: "string", enum: ["ongoing", "revoked", "completed"] }
                                }
                            },
                        }
                    }
                },
            },
        },


        /** === Signatures ============================================== **/
        "signatures": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["stage", "value", "timestamp"],
                "properties": {
                    "stage": {
                        "type": "string",
                        "enum": ["issue", "consent", "revoke", "complete"]
                    },
                    "value": { "type": "string" },
                    "timestamp": { "type": "string", "format": "date-time" }
                }
            },
            // minItems: 1 // at least one signature is required
            // if only we can make this check run like a do while;
        },

        /** === zk-SNARK Proof ========================================== **/
        "zkProof": {
            "type": "object",
            "required": ["protocol", "curve", "pi_a", "pi_b", "pi_c", "publicSignals"],
            "properties": {
                "protocol": { type: "string", enum: ["groth16"] },
                "curve": { "type": "string", "enum": ["bn128", "bls12_381"] },
                "pi_a": {
                    "type": "array",
                    "items": { "type": "string" },
                    "minItems": 3, "maxItems": 3
                },
                "pi_b": {
                    "type": "array",
                    "items": {
                        "type": "array",
                        "items": { "type": "string" },
                        "minItems": 2, "maxItems": 2
                    },
                    "minItems": 3, "maxItems": 3
                },
                "pi_c": {
                    "type": "array",
                    "items": { "type": "string" },
                    "minItems": 3, "maxItems": 3
                },
                "publicSignals": {
                    "type": "array",
                    "items": { "type": "string" }
                }
            }
        },

        "proof": {
            "type": "object",
            "required": ["type", "created", "proofPurpose", "verificationMethod", "jws"],
            "properties": {
                "type": { "type": "string" },
                "created": { "type": "string", "format": "date-time" },
                "proofPurpose": { "type": "string" },
                "verificationMethod": { "type": "string" },
                "jws": { "type": "string" }
            }
        }

        /*
            It's a good question to ask "why do we have 2 different proofs?"

            The answer is that the zkProof is the proof that the credential is valid, and the proof is the proof that the credential is valid.
        */
    }
};

export const AadhaarVCUISchema = {
    "ui:title": false,

    "@context": { "ui:widget": "hidden" },
    type: { "ui:widget": "hidden" },
    issuer: { "ui:widget": "hidden" },
    issuanceDate: { "ui:widget": "hidden" },
    challenge: { "ui:widget": "hidden" },
    referenceYear: { "ui:widget": "hidden" },
    zkProof: { "ui:widget": "hidden" },
    proof: { "ui:widget": "hidden" },
    signatures: { "ui:widget": "hidden" },

    credentialSubject: {
        "ui:title": false,
        walletAddress: {
            "ui:readonly": true,
            "ui:disabled": true
        },
        aadhaarId: {
            "ui:placeholder": "Enter your Aadhaar number"
        },
        name: {
            "ui:placeholder": "Enter your full name"
        },
        dob: {
            "ui:options": {
                inputType: "date"
            }
        },
        location: {
            "ui:title": false,
            latitude: {
                "ui:readonly": true,
                "ui:disabled": true,
                "ui:placeholder": "Auto-filled latitude"
            },
            longitude: {
                "ui:readonly": true,
                "ui:disabled": true,
                "ui:placeholder": "Auto-filled longitude"
            }
        },
        locationHistory: {
            "ui:widget": "hidden"
        }
    }
};
