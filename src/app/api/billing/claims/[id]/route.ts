import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/billing/claims/[id] - Get a specific claim
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claim = await db.claims.findById(params.id);

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error('Error fetching claim:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim' },
      { status: 500 }
    );
  }
}

// PUT /api/billing/claims/[id] - Update a claim
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Recalculate total if codes are updated
    if (body.codes && body.codes.length > 0) {
      body.totalAmount = body.codes.reduce(
        (sum: number, code: any) => sum + code.totalPrice,
        0
      );
    }

    const claim = await db.claims.update(params.id, body);

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    );
  }
}

// DELETE /api/billing/claims/[id] - Delete a claim
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await db.claims.delete(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting claim:', error);
    return NextResponse.json(
      { error: 'Failed to delete claim' },
      { status: 500 }
    );
  }
}
