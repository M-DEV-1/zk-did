import { NextResponse } from "next/server";
import { pinata } from "@/utils/config";

let cid;

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log("Received formData:", formData);

    if (!formData.walletAddress) {
      console.log("Missing walletAddress");
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    const upload = await pinata.upload.private.json({
      content: formData,
      name: `aadhaar-vc-${formData.walletAddress}.json`,
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
        } catch (err) {
          console.error("Error fetching CID:", err);
        }
      }

      run();
    } catch (e) {
      console.error("failed to fetch stuff from ipfs cloud");
    }
    return NextResponse.json({ cid: upload.cid }, { status: 200 });
  } catch (e) {
    console.error("Pinata upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}