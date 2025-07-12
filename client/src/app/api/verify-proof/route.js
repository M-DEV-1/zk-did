import * as snarkjs from "snarkjs";
import dbConnect from "@/utils/db/db";
import Models from "@/utils/db/models";
import { pinata } from "@/utils/config";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { cid, proofType } = await req.json();
    if (!cid || !proofType) {
      return new NextResponse("Missing cid or proofType", { status: 400 });
    }

    await dbConnect();
    console.log("Connected to DB");

    // Fetch VC JSON from IPFS
    const data = await pinata.gateways.private.get(cid);
    if (!data.ok) throw new Error("Failed to fetch VC from IPFS");
    const vcData = await data.json();
    const zk = vcData.zkProof;

    console.log("ZERO KNOWLEDGE: "+zk);

    if (!zk || !zk.pi_a || !zk.pi_b || !zk.pi_c || !zk.publicSignals) {
      throw new Error("Missing zkProof fields");
    }

    // Get vKey from DB
    const record = await Models.VerificationKey.findOne({ circuitName: `${proofType}-verification` });
    if (!record) throw new Error("Verification key not found in DB");

    // Lookup user by Aadhaar hash (cid is actually Aadhaar in this context)
    const userDoc = await Models.User.findOne({ aadhaarHash: cid });
    if (!userDoc) {
      throw new Error("User not found in database");
    }

    // Format proof
    const proof = {
      pi_a: zk.pi_a.map(BigInt),
      pi_b: zk.pi_b.map(pair => pair.map(BigInt)),
      pi_c: zk.pi_c.map(BigInt),
    };
    const publicSignals = zk.publicSignals.map(BigInt);

    // Call snarkjs.verify
    const verified = await snarkjs.groth16.verify(record.key, publicSignals, proof);

    // Update the request status in DB
    await Models.Requests.findOneAndUpdate(
      { sessionId: req.sessionId },
      { proofStatus: verified ? "Valid" : "Invalid", status: "Completed" },
      { new: true }
    );

    return NextResponse.json({
      verified,
      proofStatus: verified ? "Valid" : "Invalid"
    });
  } catch (err) {
    console.error("verify-proof error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
