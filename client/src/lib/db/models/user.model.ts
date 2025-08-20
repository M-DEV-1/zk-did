import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  walletAddress: { type: String, required: true },
  cid: { type: String, required: true, unique: true },
  aadhar: { type: String, required: true, unique: true }, // aadhar is the only unique identifier
  createdAt: { type: Date, default: Date.now },
}); // validate input later

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema, "users");

export default UserModel;