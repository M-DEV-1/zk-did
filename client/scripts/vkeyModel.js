const mongoose = require("mongoose");

const VerificationKeySchema = new mongoose.Schema({
  circuitName: { type: String, required: true, unique: true },
  key: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now },
});

const VerificationKeyModel = mongoose.models.VerificationKey || mongoose.model("VerificationKey", VerificationKeySchema);

module.exports = {
  VerificationKey: VerificationKeyModel,
};
