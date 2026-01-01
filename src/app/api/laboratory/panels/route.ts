import { NextRequest, NextResponse } from 'next/server';
import { LabPanel } from '@/types/laboratory';

// Mock database
let panels: LabPanel[] = [
  {
    id: '1',
    code: 'CBC',
    name: 'Complete Blood Count',
    description: 'Comprehensive evaluation of blood cells including WBC, RBC, hemoglobin, hematocrit, and platelets',
    tests: ['6690-2', '789-8', '718-7', '4544-3', '777-3'],
    category: 'Hematology',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    code: 'BMP',
    name: 'Basic Metabolic Panel',
    description: 'Panel of blood tests measuring glucose, electrolytes, and kidney function',
    tests: ['2345-7', '3094-0', '2160-0', '2951-2', '2823-3', '2075-0', '2028-9'],
    category: 'Chemistry',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    code: 'LIPID',
    name: 'Lipid Panel',
    description: 'Cholesterol and triglyceride testing',
    tests: ['2093-3', '2085-9', '2089-1', '2571-8'],
    category: 'Chemistry',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    code: 'LFT',
    name: 'Liver Function Tests',
    description: 'Panel assessing liver health and function',
    tests: ['1742-6', '1920-8', '1975-2', '1751-7', '6768-6'],
    category: 'Chemistry',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    let filteredPanels = [...panels];

    if (category) {
      filteredPanels = filteredPanels.filter(p => p.category === category);
    }

    if (isActive !== null) {
      const active = isActive === 'true';
      filteredPanels = filteredPanels.filter(p => p.isActive === active);
    }

    return NextResponse.json(filteredPanels);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch panels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newPanel: LabPanel = {
      id: `${panels.length + 1}`,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    panels.push(newPanel);

    return NextResponse.json(newPanel, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create panel' },
      { status: 500 }
    );
  }
}
