import { NextResponse } from 'next/server';
import { getAvailableFields, validateFields } from '@/lib/schemas/fieldMapping';

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

    // Generate unique request ID using timestamp + random string + provider ID
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueRequestId = `req_${timestamp}_${randomString}_${provider.providerId}`;

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
        requestId: uniqueRequestId, // Unique request ID
        category: provider.category,
        // Additional metadata
        timestamp: new Date().toISOString(),
        requestMetadata: {
          totalFields: fieldValidation.validFields.length,
          requestedAt: new Date().toISOString(),
          sessionId: `${provider.providerId}_${uniqueRequestId}_${timestamp}` // Unique session ID
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