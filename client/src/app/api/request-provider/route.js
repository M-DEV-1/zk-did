import { NextResponse } from 'next/server';
import { getAvailableFields, validateFields } from '@/lib/schemas/fieldMapping';
import { SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';

// will create seperate secret for each provider
const JWT_SECRET = new TextEncoder().encode('super-secret-key');

export async function POST(request) {
  try {
    const { walletAddress, provider, requestedFields } = await request.json();

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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

    // 5 minutes challenge
    const now = Math.floor(Date.now() / 1000);
    const challengePayload = {
      sub: walletAddress,
      providerId: provider.providerId,
      sessionId,
      nonce: uuidv4(),
      iat: now,
      exp: now + 300 // 5 minutes
    };
    const challenge = await new SignJWT(challengePayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(JWT_SECRET);

    // In a real application, you might:
    // 1. Validate the provider against a registry
    // 2. Check rate limits
    // 3. Store the pending request in a database
    // 4. Send a notification to the user (WebSocket, push notification, etc.)
    // 5. Generate a unique request ID for tracking

    // For now, we'll return the provider data to be handled by the frontend
    return NextResponse.json({
      success: true,
      message: 'Provider request initiated',
      provider: {
        name: provider.name,
        description: provider.description,
        requestedFields: fieldValidation.validFields, // Only valid fields
        sessionDuration: provider.sessionDuration || 30000, // 30 seconds default
        providerId: provider.providerId,
        requestId: sessionId, // Use UUID as request/session ID
        challenge, // Verifiable JWT challenge
        category: provider.category,
        // Additional metadata
        timestamp: new Date().toISOString(),
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