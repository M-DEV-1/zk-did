import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/db";

import RequestModel from "@/lib/db/models/requests.model";

export async function GET() {
  try {
    await dbConnect();

    const allRequests = await RequestModel.find({})
      .sort({ requestTime: -1 }) // latest first

    return NextResponse.json({ requests: allRequests });
  } catch (err) {
    console.error("Error fetching provider requests:", err);
    return NextResponse.json(
      { error: "Failed to fetch provider requests" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { sessionId, ...updates } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const updated = await RequestModel.findOneAndUpdate(
      { sessionId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // console.log("Updated Request:", updated);

    return NextResponse.json({
      success: true,
      request: updated
    });
  } catch (e) {
    console.error("Error updating provider request:", e);
    return NextResponse.json(
      { error: "Failed to update provider request" },
      { status: 500 }
    );
  }
}