import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db/db';
import Models from '@/utils/db/models';

export async function GET(request) {
  try {
    await dbConnect();

    // Get wallet address from query params
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching requests for wallet: ${walletAddress}`);

    // Find user by wallet address
    const user = await Models.User.findOne({ walletAddress });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find all requests for this user
    const requests = await Models.Requests.find({ user: user._id })
      .populate('user', 'name cid walletAddress dob location')
      .sort({ requestTime: -1 });

    // Transform requests to match the frontend format
    const transformedRequests = requests.map(req => ({
      id: req.sessionId, // Use sessionId as id for frontend compatibility
      sessionId: req.sessionId,
      name: `Provider ${req.providerId}`, // You might want to store provider name in the request
      description: `Proof requested: ${Array.isArray(req.proofType) ? req.proofType.join(', ') : req.proofType}`,
      providerId: req.providerId,
      requestedFields: req.requestedFields,
      proofType: req.proofType,
      sessionDuration: 60000, // Default session duration
      category: "Admin", // You might want to store category in the request
      user: {
        name: req.user.name,
        cid: req.user.cid,
        walletAddress: req.user.walletAddress,
        dob: req.user.dob,
        location: req.user.location
      },
      status: req.status,
      proofStatus: req.proofStatus,
      requestTime: req.requestTime.getTime(),
      timerEnd: req.timerEnd.getTime(),
      challenge: req.challenge,
      approvedFields: req.approvedFields || [],
      signatures: req.signatures || []
    }));

    return NextResponse.json({
      success: true,
      requests: transformedRequests
    });

  } catch (error) {
    console.error('Error fetching user requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const { sessionId, status, approvedFields, proofStatus } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find and update the request
    const updateData = {};
    if (status) updateData.status = status;
    if (approvedFields) updateData.approvedFields = approvedFields;
    if (proofStatus) updateData.proofStatus = proofStatus;

    const updatedRequest = await Models.Requests.findOneAndUpdate(
      { sessionId },
      updateData,
      { new: true }
    ).populate('user', 'name cid walletAddress dob location');

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest
    });

  } catch (error) {
    console.error('Error updating user request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}