import { Schema, Model } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  walletAddress: { type: String, required: true },
  cid: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const UserModel = new Model("User", UserSchema);

const User = new UserModel();

export default User;