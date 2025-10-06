import mongoose, { Schema } from "mongoose";

const VerificationKeySchema = new Schema({
  circuitName: { type: String, required: true, unique: true }, // "age"
  key: { type: Object, required: true }, // the actual verification key JSON
  updatedAt: { type: Date, default: Date.now },
})

const VerificationKeyModel = mongoose.models.VerificationKey || mongoose.model("VerificationKey", VerificationKeySchema, "verificationkeys");

export default VerificationKeyModel;