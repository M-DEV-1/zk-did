import { NextResponse } from "next/server";
import dbConnect from "@/utils/db/db";
import Models from "@/utils/db/models";

export async function GET() {
  try {
    await dbConnect();

    const allRequests = await Models.Requests.find({})
      .sort({ requestTime: -1 }) // latest first
      .lean(); // return plain JS objects

    return NextResponse.json({ requests: allRequests });
  } catch (err) {
    console.error("Error fetching provider requests:", err);
    return NextResponse.json(
      { error: "Failed to fetch provider requests" },
      { status: 500 }
    );
  }
}
