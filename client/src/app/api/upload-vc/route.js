import { NextResponse } from "next/server";
import { pinata } from "@/utils/config";
import dbConnect from "@/utils/db/db";
import Models from "@/utils/db/models";
import bcrypt from "bcrypt";

let cid;

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log("Received formData:", formData);

    console.log("Sanitizing VC before upload");

    const cleanVC = JSON.parse(JSON.stringify(formData)); // removes unserializable fields

    if (!formData.credentialSubject.walletAddress) {
      console.log("Missing walletAddress");
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    const upload = await pinata.upload.private.json({
      content: cleanVC,
      name: `aadhaar-vc-${formData.credentialSubject.walletAddress}.json`,
      lang: "json",
    });

    console.log("Upload success:", upload);
    cid = upload.cid;
    try {
      async function run() {
        try {
          const { data, contentType } = await pinata.gateways.private.get(cid);
          console.log("Data:", data);
          console.log("Content-Type:", contentType);
          if (!data || !contentType) throw new Error("Invalid CID. Can't fetch files from IPFS with this CID");
        } catch (err) {
          console.error("Error fetching CID:", err);
        }
      }
      run();
    } catch (e) {
      console.error("failed to fetch stuff from ipfs cloud");
    }

    try {
      await dbConnect();
      await Models.User.create({ 
        name: formData.credentialSubject.name,
        walletAddress: formData.credentialSubject.walletAddress, 
        cid,
        aadhar: await bcrypt.hash(formData.credentialSubject.aadhaarId, 15)});
      console.log("Stored CID in MongoDB");
    } catch (dbErr) {
      console.error("MongoDB store error:", dbErr);
      // Optionally, return error or continue
    }

    return NextResponse.json({ cid: upload.cid }, { status: 200 });
  } catch (e) {
    console.error("Pinata upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}