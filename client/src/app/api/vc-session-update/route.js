import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';

// will create separate secret for each provider
const JWT_SECRET = new TextEncoder().encode('super-secret-key');

export async function POST(request) {
  try {
    const { vc, session, status, location } = await request.json();
    if (!vc || !session || !status || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // update location history
    const sessionEntry = {
      latitude: location.latitude,
      longitude: location.longitude,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        status: status // 'completed' or 'revoked' only
      }
    };
    const updatedLocationHistory = Array.isArray(vc.locationHistory)
      ? [...vc.locationHistory, sessionEntry]
      : [sessionEntry];

    // Generate new session ID and challenge
    const newSessionId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const challengePayload = {
      sub: vc.walletAddress,
      providerId: vc.issuer || 'unknown',
      sessionId: newSessionId,
      nonce: uuidv4(),
      iat: now,
      exp: now + 300 // 5 minutes
    };
    const newChallenge = await new SignJWT(challengePayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(JWT_SECRET);

    // Update the VC
    const updatedVC = {
      ...vc,
      challenge: newChallenge,
      locationHistory: updatedLocationHistory
    };

    return NextResponse.json({
      updatedVC,
      newSessionId,
      newChallenge
    });
  } catch (error) {
    console.error('Error in vc-session-update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 