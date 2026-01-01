import { NextRequest, NextResponse } from 'next/server';
import { CPTCode, ICDCode } from '@/types/billing';

// Mock CPT and ICD code databases
const CPT_CODES: CPTCode[] = [
  {
    code: '99213',
    description: 'Office or other outpatient visit, established patient, 15 minutes',
    category: 'Evaluation and Management',
    price: 125.00,
  },
  {
    code: '99214',
    description: 'Office or other outpatient visit, established patient, 25 minutes',
    category: 'Evaluation and Management',
    price: 185.00,
  },
  {
    code: '99215',
    description: 'Office or other outpatient visit, established patient, 40 minutes',
    category: 'Evaluation and Management',
    price: 250.00,
  },
  {
    code: '99203',
    description: 'Office or other outpatient visit, new patient, 30 minutes',
    category: 'Evaluation and Management',
    price: 150.00,
  },
  {
    code: '99204',
    description: 'Office or other outpatient visit, new patient, 45 minutes',
    category: 'Evaluation and Management',
    price: 225.00,
  },
  {
    code: '80053',
    description: 'Comprehensive metabolic panel',
    category: 'Laboratory',
    price: 45.00,
  },
  {
    code: '93000',
    description: 'Electrocardiogram, routine ECG with interpretation',
    category: 'Cardiovascular',
    price: 85.00,
  },
  {
    code: '85025',
    description: 'Complete blood count (CBC) with differential',
    category: 'Laboratory',
    price: 35.00,
  },
];

const ICD_CODES: ICDCode[] = [
  {
    code: 'I10',
    description: 'Essential (primary) hypertension',
    category: 'Circulatory System',
    version: 'ICD-10',
  },
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    category: 'Endocrine System',
    version: 'ICD-10',
  },
  {
    code: 'E78.5',
    description: 'Hyperlipidemia, unspecified',
    category: 'Endocrine System',
    version: 'ICD-10',
  },
  {
    code: 'J06.9',
    description: 'Acute upper respiratory infection, unspecified',
    category: 'Respiratory System',
    version: 'ICD-10',
  },
  {
    code: 'M79.3',
    description: 'Panniculitis, unspecified',
    category: 'Musculoskeletal System',
    version: 'ICD-10',
  },
  {
    code: 'Z00.00',
    description: 'Encounter for general adult medical examination without abnormal findings',
    category: 'Factors Influencing Health Status',
    version: 'ICD-10',
  },
  {
    code: 'R50.9',
    description: 'Fever, unspecified',
    category: 'Symptoms and Signs',
    version: 'ICD-10',
  },
];

// GET /api/billing/coding - Search CPT and ICD codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type'); // 'cpt' or 'icd'

    if (type === 'cpt') {
      const results = CPT_CODES.filter(
        code =>
          code.code.includes(query.toUpperCase()) ||
          code.description.toLowerCase().includes(query.toLowerCase())
      );
      return NextResponse.json(results);
    } else if (type === 'icd') {
      const results = ICD_CODES.filter(
        code =>
          code.code.toUpperCase().includes(query.toUpperCase()) ||
          code.description.toLowerCase().includes(query.toLowerCase())
      );
      return NextResponse.json(results);
    } else {
      return NextResponse.json(
        { error: 'Type parameter must be "cpt" or "icd"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error searching codes:', error);
    return NextResponse.json(
      { error: 'Failed to search codes' },
      { status: 500 }
    );
  }
}
