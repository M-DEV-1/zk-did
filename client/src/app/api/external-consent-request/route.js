import { NextResponse } from 'next/server';
import { getAvailableFields, validateFields } from '@/lib/schemas/fieldMapping';

export async function POST(request) {
  try {
    const { 
      walletAddress, 
      provider, 
      requestedFields, 
      callbackUrl, 
      metadata 
    } = await request.json();

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
    const uniqueRequestId = `ext_${timestamp}_${randomString}_${provider.providerId}`;

    // In a real application, you would:
    // 1. Validate the provider against a registry
    // 2. Check rate limits
    // 3. Store the pending request in a database
    // 4. Send a notification to the user (WebSocket, push notification, etc.)
    // 5. Generate a unique request ID for tracking

    const pendingRequest = {
      requestId: uniqueRequestId,
      walletAddress,
      provider: {
        ...provider,
        providerId: provider.providerId || `provider_${timestamp}`,
      },
      requestedFields: fieldValidation.validFields, // Only valid fields
      callbackUrl,
      metadata,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      sessionId: `${provider.providerId}_${uniqueRequestId}_${timestamp}` // Unique session ID
    };

    // For demo purposes, we'll store in memory (use a database in production)
    if (!global.pendingRequests) {
      global.pendingRequests = new Map();
    }
    global.pendingRequests.set(uniqueRequestId, pendingRequest);

    // In a real app, you would trigger a notification to the user here
    // For now, we'll return the request details
    return NextResponse.json({
      success: true,
      message: 'Consent request created successfully',
      requestId: uniqueRequestId,
      status: 'pending',
      expiresAt: pendingRequest.expiresAt,
      sessionId: pendingRequest.sessionId,
      validFields: fieldValidation.validFields,
      // In a real app, you might return a WebSocket connection URL or push notification endpoint
      notificationUrl: `/api/consent-requests/${uniqueRequestId}`,
    });

  } catch (error) {
    console.error('Error in external-consent-request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check request status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get the pending request
    const pendingRequest = global.pendingRequests?.get(requestId);

    if (!pendingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: pendingRequest,
    });

  } catch (error) {
    console.error('Error in external-consent-request GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 