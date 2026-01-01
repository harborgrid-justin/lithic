import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Invoice } from '@/types/billing';
import { generateInvoiceNumber } from '@/lib/billing-utils';

// GET /api/billing/invoices - List all invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');

    let invoices = await db.invoices.findAll();

    // Apply filters
    if (status) {
      invoices = invoices.filter(i => i.status === status);
    }
    if (patientId) {
      invoices = invoices.filter(i => i.patientId === patientId);
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/billing/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum: number, item: any) => sum + item.total,
      0
    );
    const tax = body.tax || 0;
    const total = subtotal + tax;

    const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNumber: generateInvoiceNumber(),
      patientId: body.patientId,
      patientName: body.patientName,
      dateOfService: body.dateOfService,
      dueDate: body.dueDate,
      status: 'draft',
      subtotal,
      tax,
      total,
      paidAmount: 0,
      balance: total,
      items: body.items,
      payments: [],
    };

    const invoice = await db.invoices.create(invoiceData);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
