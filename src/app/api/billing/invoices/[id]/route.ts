import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/billing/invoices/[id] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await db.invoices.findById(params.id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Fetch related payments
    const payments = await db.payments.findAll();
    const invoicePayments = payments.filter(p => p.invoiceId === params.id);
    invoice.payments = invoicePayments;

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PUT /api/billing/invoices/[id] - Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Recalculate totals if items are updated
    if (body.items) {
      const subtotal = body.items.reduce(
        (sum: number, item: any) => sum + item.total,
        0
      );
      const tax = body.tax || 0;
      const total = subtotal + tax;
      const paidAmount = body.paidAmount || 0;

      body.subtotal = subtotal;
      body.total = total;
      body.balance = total - paidAmount;
    }

    const invoice = await db.invoices.update(params.id, body);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
