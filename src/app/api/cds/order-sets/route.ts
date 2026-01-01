/**
 * Order Sets API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { orderSetEngine } from '@/lib/algorithms/cds';
import type { OrderContext } from '@/lib/algorithms/cds';

interface GenerateOrderSetRequest {
  templateId: string;
  context: OrderContext;
}

export async function POST(request: NextRequest) {
  try {
    const { templateId, context }: GenerateOrderSetRequest = await request.json();

    if (!templateId || !context) {
      return NextResponse.json(
        { error: 'Template ID and patient context are required' },
        { status: 400 }
      );
    }

    const orderSet = await orderSetEngine.generateOrderSet(templateId, context);

    return NextResponse.json({ orderSet }, { status: 200 });
  } catch (error) {
    console.error('Order Set Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate order set', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const templates = orderSetEngine.getTemplates();
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error('Get Templates Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve order set templates' },
      { status: 500 }
    );
  }
}
