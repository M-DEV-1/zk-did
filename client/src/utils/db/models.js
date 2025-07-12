import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true },
  cid: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
}); // validate input later

const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");

export default User;