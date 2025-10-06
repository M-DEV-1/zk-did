import mongoose, { Schema } from "mongoose";

const RequestSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  provider: {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    requestIpfsUrl: { type: String, required: true },
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestedFields: [{ type: String, required: true }],
  approvedFields: [{ type: String }],
  proofStatus: { type: String, enum: ["pending", "generated", "verified"], default: "pending" },
  vcCid: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // session expiry
});

const RequestModel = mongoose.models.Request || mongoose.model("Request", RequestSchema, "requests");

export default RequestModel;