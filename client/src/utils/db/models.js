import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  cid: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
}); // validate input later

const VerificationKeySchema = new Schema({
  circuitName: { type: String, required: true, unique: true }, // "age-verification"
  key: { type: Object, required: true }, // the actual verification key JSON
  updatedAt: { type: Date, default: Date.now },
})

const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");

const VerificationKey = mongoose.models.VerificationKey || mongoose.model("VerificationKey", VerificationKeySchema, "vkeys");

export default { User, VerificationKey };