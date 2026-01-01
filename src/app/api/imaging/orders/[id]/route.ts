import { NextRequest, NextResponse } from "next/server";

// Mock database - replace with actual database in production
// This would be shared with the main orders route in production
const orders: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const order = orders.find((o) => o.id === params.id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const orderIndex = orders.findIndex((o) => o.id === params.id);

    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(orders[orderIndex]);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const orderIndex = orders.findIndex((o) => o.id === params.id);

    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update status to CANCELLED instead of deleting
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: "CANCELLED",
      cancellationReason: body.reason,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 },
    );
  }
}
