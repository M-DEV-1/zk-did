import { NextResponse } from 'next/server';
import { getAvailableFields, validateFields } from '@/lib/schemas/fieldMapping';
import { SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';

import dbConnect from '@/lib/db/db';
import UserModel from "@/lib/db/models/user.model";
import RequestModel from "@/lib/db/models/requests.model";

const JWT_SECRET = new TextEncoder().encode('super-secret-key');

export async function POST(request) {
  try {
    await dbConnect();

    const { cid, provider, requestedFields, proofType } = await request.json();
    
    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    if (!provider || !provider.name) {
      return NextResponse.json(
        { error: 'Provider information is required' },
        { status: 400 }
      );
    }

    if (!requestedFields || !Array.isArray(requestedFields) || requestedFields.length === 0) {
      return NextResponse.json(
        { error: 'Requested fields array is required' },
        { status: 400 }
      );
    }

    // Validate requested fields against actual schema
    const fieldValidation = validateFields(requestedFields);

    if (!fieldValidation.isValid) {
      return NextResponse.json(
        {
          error: `Invalid fields requested: ${fieldValidation.invalidFields.join(', ')}`,
          availableFields: getAvailableFields(),
          validFields: fieldValidation.validFields
        },
        { status: 400 }
      );
    }

    // generate secure uuid for request/session id
    const sessionId = uuidv4();

    // Fetch user from DB to get name and cid
    const userDoc = await UserModel.findOne({ cid });
    if (!userDoc) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // 5 minutes challenge
    const now = Math.floor(Date.now() / 1000);
    const challengePayload = {
      sub: userDoc.walletAddress,
      providerId: provider.providerId,
      sessionId,
      nonce: uuidv4(),
      iat: now,
      exp: now + 300 // 5 minutes
    };
    const challenge = await new SignJWT(challengePayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(JWT_SECRET);

    // FIXED: Store userId and use proofType from frontend
    await RequestModel.create({
      sessionId,
      user: userDoc._id, // Add userId field for verification lookup
      cid: userDoc.cid,
      proofType: proofType || ["age"], // Use proofType from frontend
      requestedFields: fieldValidation.validFields,
      requestTime: new Date(),
      status: "Pending",
      timerEnd: Date.now() + 120000, // FIXED: Store as timestamp (2 minutes)
      proofStatus: "awaited",
      providerId: provider.providerId,
      challenge: challenge
    });

    // For now, we'll return the provider data to be handled by the frontend
    return NextResponse.json({
      success: true,
      message: 'Provider request initiated',
      provider: {
        name: provider.name,
        description: provider.description,
        requestedFields: fieldValidation.validFields, // Only valid fields
        sessionDuration: 120000, // 30 seconds default
        providerId: provider.providerId,
        requestId: sessionId, // Use UUID as request/session ID
        challenge, // Verifiable JWT challenge
        category: provider.category,
        requestMetadata: {
          totalFields: fieldValidation.validFields.length,
          requestedAt: new Date().toISOString(),
          sessionId // Unique session ID
        }
      }
    });

  } catch (error) {
    console.error('Error in request-provider API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}