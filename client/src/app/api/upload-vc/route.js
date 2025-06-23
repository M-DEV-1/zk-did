import { NextResponse } from "next/server";
import { pinata } from "@/utils/config";

export async function POST(request) {
  try {
    const formData = await request.json();

    // customize metadata as you wish
    const upload = await pinata.upload.private.json({
      content: formData,
      name: `aadhaar-vc-${formData.walletAddress}`,
      lang: "json"
    });

    return NextResponse.json({ cid: upload.cid }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}