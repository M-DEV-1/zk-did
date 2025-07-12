import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
  name: { type: String, required: true },
  walletAddress: { type: String, required: true },
  cid: { type: String, required: true, unique: true },
  aadhar: { type: String, required: true, unique: true }, // aadhar is the only unique identifier
  createdAt: { type: Date, default: Date.now },
}); // validate input later

UserSchema.pre("save", async (next) => {
  if (this.isModified("aadhar")) {
    await bcrypt.hash(this.aadhar, 10, (err, hashedAadhar) => {
      if (err) return next(err);
      this.aadhar = hashedAadhar;
      next();
    });
  } else {
    next();
  }
})

const VerificationKeySchema = new Schema({
  circuitName: { type: String, required: true, unique: true }, // "age-verification"
  key: { type: Object, required: true }, // the actual verification key JSON
  updatedAt: { type: Date, default: Date.now },
})

const RequestSchema = new Schema({
  sessionId: { type: String, required: true, unique: true },
  user: { type: ObjectId, ref: "User", required: true },
  proofType: [String],
  requestedFields: [String],
  requestTime: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" }, // "Pending", "Ongoing", "Completed", etc.
  timerEnd: Date,
  proofStatus: { type: String, default: "awaited" },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");

const VerificationKey = mongoose.models.VerificationKey || mongoose.model("VerificationKey", VerificationKeySchema, "vkeys");

const Requests = mongoose.models.Request || mongoose.model("Request", RequestSchema, "requests");

export default { User, VerificationKey, Requests };