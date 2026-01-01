import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Payment } from '@/types/billing';

// GET /api/billing/payments - List all payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const claimId = searchParams.get('claimId');

    let payments = await db.payments.findAll();

    // Apply filters
    if (patientId) {
      payments = payments.filter(p => p.patientId === patientId);
    }
    if (claimId) {
      payments = payments.filter(p => p.claimId === claimId);
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/billing/payments - Create a new payment (post payment)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const paymentData: Omit<Payment, 'id' | 'createdAt'> = {
      patientId: body.patientId,
      patientName: body.patientName,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      paymentDate: body.paymentDate || new Date().toISOString(),
      postedBy: body.postedBy || 'system',
      claimId: body.claimId,
      invoiceId: body.invoiceId,
      referenceNumber: body.referenceNumber,
      notes: body.notes,
    };

    const payment = await db.payments.create(paymentData);

    // Update claim or invoice with payment
    if (payment.claimId) {
      const claim = await db.claims.findById(payment.claimId);
      if (claim) {
        const currentPaid = claim.paidAmount || 0;
        const newPaidAmount = currentPaid + payment.amount;
        const totalAmount = claim.totalAmount || 0;

        let newStatus = claim.status;
        if (newPaidAmount >= totalAmount) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partially_paid';
        }

        await db.claims.update(payment.claimId, {
          paidAmount: newPaidAmount,
          status: newStatus,
        });
      }
    }

    if (payment.invoiceId) {
      const invoice = await db.invoices.findById(payment.invoiceId);
      if (invoice) {
        const currentPaid = invoice.paidAmount || 0;
        const newPaidAmount = currentPaid + payment.amount;
        const balance = invoice.total - newPaidAmount;

        let newStatus = invoice.status;
        if (balance === 0) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        await db.invoices.update(payment.invoiceId, {
          paidAmount: newPaidAmount,
          balance: balance,
          status: newStatus,
        });
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
