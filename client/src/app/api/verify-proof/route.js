import * as snarkjs from "snarkjs";
import dbConnect from "@/utils/db/db";
import Models from "@/utils/db/models";
import { pinata } from "@/utils/config";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { cid, proofType, sessionId } = await req.json();
    
    // Validate required fields
    if (!cid || !proofType || !sessionId) {
      return new NextResponse("Missing cid, proofType, or sessionId", { status: 400 });
    }

    await dbConnect();
    console.log("Connected to DB");

    // Fetch VC JSON from IPFS with error handling
    let data, vcData;
    try {
      data = await pinata.gateways.private.get(cid);
      if (!data.ok) {
        throw new Error(`Failed to fetch VC from IPFS. Status: ${data.status}`);
      }
      vcData = await data.json();
    } catch (ipfsError) {
      console.error("IPFS fetch error:", ipfsError);
      throw new Error(`Failed to retrieve or parse VC data: ${ipfsError.message}`);
    }

    const zk = vcData.zkProof;
    console.log("ZERO KNOWLEDGE: " + JSON.stringify(zk));

    // Validate zkProof structure
    if (!zk || !zk.pi_a || !zk.pi_b || !zk.pi_c || !zk.publicSignals) {
      throw new Error("Missing required zkProof fields: pi_a, pi_b, pi_c, publicSignals");
    }

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

    // FIXED: Update the request status in DB - now matches the stored structure
    const updatedRequest = await Models.Requests.findOneAndUpdate(
      { 
        userId, // Now matches the stored userId field
        sessionId,
        // Optional: Add additional safety checks
        "user.cid": cid, // Ensure CID matches
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
      console.warn(`No request found for userId: ${userId}, sessionId: ${sessionId}, cid: ${cid}`);
      
      // Try alternative query to debug
      const debugRequest = await Models.Requests.findOne({ 
        sessionId,
        "user.cid": cid 
      });
      
      if (debugRequest) {
        console.log("Found request but userId mismatch:", {
          storedUserId: debugRequest.userId,
          providedUserId: userId
        });
      } else {
        console.log("No request found with sessionId and cid");
      }
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
      verified: false,
      proofStatus: "Invalid"
    }, { status: 500 });
  }
}