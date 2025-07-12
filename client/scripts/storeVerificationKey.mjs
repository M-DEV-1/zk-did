import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const dbConnect = require("./dbConnect.js");
const { VerificationKey } = require("./vkeyModel.js");

async function storeVerificationKey() {
  await dbConnect();

  const circuitName = "age-verification";
  const keyPath = "../contracts/circuits/build/snark/age-verification_key.json";
  const keyJson = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

  await VerificationKey.findOneAndUpdate(
    { circuitName },
    { key: keyJson, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  console.log(`✅ Stored/updated verification key for "${circuitName}"`);
  process.exit(0);
}

storeVerificationKey().catch((e) => {
  console.error("❌ Failed to store key:", e);
  process.exit(1);
});
