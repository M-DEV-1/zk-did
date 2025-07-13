import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const { filename } = await params;
  const filePath = path.resolve(process.cwd(), `../contracts/circuits/build/snark/${filename}`);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
