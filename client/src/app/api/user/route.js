// app/api/users/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/db";
import UserModel from "@/lib/db/models/user.model";

export async function GET() {
  try {
    await dbConnect();
    console.log("Connected to database");
    
    const users = await UserModel.find({}).sort({ createdAt: -1 });
    
    if (!users || users.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const transformedUsers = users.map(user => ({
      walletAddress: user.walletAddress,
      name: user.name,
      cid: user.cid,
      createdAt: user.createdAt
    }));

    return NextResponse.json({ users: transformedUsers }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ 
      error: "Failed to fetch users", 
      details: error.message 
    }, { status: 500 });
  }
}