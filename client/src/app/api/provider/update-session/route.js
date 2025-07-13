import { NextResponse } from "next/server";
import dbConnect from "@/utils/db/db";
import Models from "@/utils/db/models";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { sessionId, status } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    console.log(`Updating session ${sessionId} to status: ${status}`);

    const updated = await Models.Requests.findOneAndUpdate(
      { sessionId },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    console.log("Updated Request:", updated);

    return NextResponse.json({
      success: true,
      request: updated
    });
  } catch (e) {
    console.error("Error updating provider session:", e);
    return NextResponse.json(
      { error: "Failed to update provider session" },
      { status: 500 }
    );
  }
} 