import { NextRequest, NextResponse } from 'next/server';
import { REFERENCE_RANGES } from '@/lib/reference-ranges';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const loincCode = searchParams.get('loincCode');
    const testName = searchParams.get('testName');

    let filteredRanges = [...REFERENCE_RANGES];

    if (loincCode) {
      filteredRanges = filteredRanges.filter(r => r.loincCode === loincCode);
    }

    if (testName) {
      filteredRanges = filteredRanges.filter(r => 
        r.testName.toLowerCase().includes(testName.toLowerCase())
      );
    }

    return NextResponse.json(filteredRanges);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reference ranges' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In a real application, this would save to a database
    const newRange = {
      id: `ref_${Date.now()}`,
      ...body,
    };

    return NextResponse.json(newRange, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create reference range' },
      { status: 500 }
    );
  }
}
