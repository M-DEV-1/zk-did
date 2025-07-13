import * as snarkjs from "snarkjs";
import dbConnect from "@/utils/db/db";
import Models from "@/utils/db/models";
import { pinata } from "@/utils/config";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { cid, proofType, sessionId } = await req.json();
    console.log("Verification Proof CID: " + cid);
    console.log("Proof Type: " + proofType);
    console.log("Session ID: " + sessionId);
    
    // Validate required fields
    if (!cid || !proofType || !sessionId) {
      return new NextResponse("Missing cid, proofType, or sessionId", { status: 400 });
    }

    await dbConnect();
    console.log("Connected to DB");

    // FIXED: First check if the request exists and get its details
    const requestDoc = await Models.Requests.findOne({ sessionId });
    if (!requestDoc) {
      console.error(`Request not found for sessionId: ${sessionId}`);
      return NextResponse.json({
        error: "Request not found",
        verified: false,
        proofStatus: "Invalid"
      }, { status: 404 });
    }

    console.log("Found request:", {
      sessionId: requestDoc.sessionId,
      status: requestDoc.status,
      proofStatus: requestDoc.proofStatus,
      cid: requestDoc.cid
    });

    // Fetch VC JSON from IPFS with error handling
    const { data, contentType } = await pinata.gateways.private.get(cid);
    console.log("Data:", data);
    console.log("Content-Type:", contentType);
    try {
      if (!data) {
        throw new Error(`Failed to fetch VC from IPFS. Status: ${data.status}`);
      }
    } catch (ipfsError) {
      console.error("IPFS fetch error:", ipfsError);
      throw new Error(`Failed to retrieve or parse VC data: ${ipfsError.message}`);
    }

    let vcData = data;

    const zk = vcData.content.zkProof;
    console.log("ZERO KNOWLEDGE: " + JSON.stringify(zk));

    // Validate zkProof structure
    if (!zk || !zk.pi_a || !zk.pi_b || !zk.pi_c || !zk.publicSignals) {
      throw new Error("Missing required zkProof fields: pi_a, pi_b, pi_c, publicSignals");
    }

    console.log("proof-type: "+proofType);
    // Get verification key from DB
    const record = await Models.VerificationKey.findOne({ circuitName: proofType });
    if (!record) {
      throw new Error(`Verification key not found for circuit: ${proofType}`);
    }

    // Find user and get userId
    const userDoc = await Models.User.findOne({ cid });
    if (!userDoc) {
      throw new Error("User not found in database");
    }
    const userId = userDoc._id;

    // Format proof for snarkjs verification
    let proof, publicSignals;
    try {
      proof = {
        pi_a: zk.pi_a.map(BigInt),
        pi_b: zk.pi_b.map(pair => pair.map(BigInt)),
        pi_c: zk.pi_c.map(BigInt),
      };
      publicSignals = zk.publicSignals.map(BigInt);
    } catch (formatError) {
      throw new Error("Failed to format proof data for verification");
    }

    // Verify the proof using snarkjs
    let verified;
    try {
      verified = await snarkjs.groth16.verify(record.key, publicSignals, proof);
    } catch (verifyError) {
      console.error("Verification error:", verifyError);
      throw new Error("Proof verification failed");
    }

    console.log(`Proof verification result: ${verified}`);

    // FIXED: Update the request status in DB - now matches the stored structure
    const updatedRequest = await Models.Requests.findOneAndUpdate(
      {
        sessionId,
        // Optional: Add additional safety checks
        proofStatus: "awaited" // Only update if still awaited
      },
      {
        proofStatus: verified ? "Valid" : "Invalid",
        status: verified ? "Completed" : "Ongoing", // Keep ongoing if invalid
        verificationTime: new Date(),
        // Store proof verification details
        verificationDetails: {
          proofType,
          verified,
          verifiedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedRequest) {
      console.warn(`No request found for sessionId: ${sessionId}`);
    } else {
      console.log(`Request updated successfully: ${updatedRequest.sessionId}`);
    }

    console.log(`Verification complete. Result: ${verified ? "Valid" : "Invalid"}`);

    return NextResponse.json({
      verified,
      proofStatus: verified ? "Valid" : "Invalid",
      message: verified ? "Proof verified successfully" : "Proof verification failed",
      updatedRequest: !!updatedRequest
    });

  } catch (err) {
    console.error("verify-proof error:", err);
    return NextResponse.json({
      error: err.message,
      proofStatus: "Failed to Verify",
      verified: false
    }, { status: 500 });
  }
}