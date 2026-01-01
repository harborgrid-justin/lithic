// Reference ranges for common laboratory tests
import { ReferenceRange } from '@/types/laboratory';

export const REFERENCE_RANGES: ReferenceRange[] = [
  // Complete Blood Count
  {
    id: 'ref_wbc',
    loincCode: '6690-2',
    testName: 'WBC',
    low: 4.5,
    high: 11.0,
    criticalLow: 2.0,
    criticalHigh: 30.0,
    unit: '10^9/L',
  },
  {
    id: 'ref_rbc_male',
    loincCode: '789-8',
    testName: 'RBC',
    low: 4.5,
    high: 5.9,
    unit: '10^12/L',
    gender: 'M',
  },
  {
    id: 'ref_rbc_female',
    loincCode: '789-8',
    testName: 'RBC',
    low: 4.0,
    high: 5.2,
    unit: '10^12/L',
    gender: 'F',
  },
  {
    id: 'ref_hgb_male',
    loincCode: '718-7',
    testName: 'Hemoglobin',
    low: 13.5,
    high: 17.5,
    criticalLow: 7.0,
    criticalHigh: 20.0,
    unit: 'g/dL',
    gender: 'M',
  },
  {
    id: 'ref_hgb_female',
    loincCode: '718-7',
    testName: 'Hemoglobin',
    low: 12.0,
    high: 15.5,
    criticalLow: 7.0,
    criticalHigh: 20.0,
    unit: 'g/dL',
    gender: 'F',
  },
  {
    id: 'ref_hct_male',
    loincCode: '4544-3',
    testName: 'Hematocrit',
    low: 38.8,
    high: 50.0,
    unit: '%',
    gender: 'M',
  },
  {
    id: 'ref_hct_female',
    loincCode: '4544-3',
    testName: 'Hematocrit',
    low: 34.9,
    high: 44.5,
    unit: '%',
    gender: 'F',
  },
  {
    id: 'ref_plt',
    loincCode: '777-3',
    testName: 'Platelets',
    low: 150,
    high: 400,
    criticalLow: 50,
    criticalHigh: 1000,
    unit: '10^9/L',
  },

  // Basic Metabolic Panel
  {
    id: 'ref_glucose',
    loincCode: '2345-7',
    testName: 'Glucose',
    low: 70,
    high: 100,
    criticalLow: 40,
    criticalHigh: 400,
    unit: 'mg/dL',
  },
  {
    id: 'ref_bun',
    loincCode: '3094-0',
    testName: 'BUN',
    low: 7,
    high: 20,
    criticalHigh: 100,
    unit: 'mg/dL',
  },
  {
    id: 'ref_creatinine_male',
    loincCode: '2160-0',
    testName: 'Creatinine',
    low: 0.7,
    high: 1.3,
    criticalHigh: 10.0,
    unit: 'mg/dL',
    gender: 'M',
  },
  {
    id: 'ref_creatinine_female',
    loincCode: '2160-0',
    testName: 'Creatinine',
    low: 0.6,
    high: 1.1,
    criticalHigh: 10.0,
    unit: 'mg/dL',
    gender: 'F',
  },
  {
    id: 'ref_sodium',
    loincCode: '2951-2',
    testName: 'Sodium',
    low: 136,
    high: 145,
    criticalLow: 120,
    criticalHigh: 160,
    unit: 'mmol/L',
  },
  {
    id: 'ref_potassium',
    loincCode: '2823-3',
    testName: 'Potassium',
    low: 3.5,
    high: 5.1,
    criticalLow: 2.5,
    criticalHigh: 6.5,
    unit: 'mmol/L',
  },
  {
    id: 'ref_chloride',
    loincCode: '2075-0',
    testName: 'Chloride',
    low: 98,
    high: 107,
    unit: 'mmol/L',
  },
  {
    id: 'ref_co2',
    loincCode: '2028-9',
    testName: 'CO2',
    low: 23,
    high: 29,
    unit: 'mmol/L',
  },

  // Liver Function Tests
  {
    id: 'ref_alt',
    loincCode: '1742-6',
    testName: 'ALT',
    low: 7,
    high: 56,
    unit: 'U/L',
  },
  {
    id: 'ref_ast',
    loincCode: '1920-8',
    testName: 'AST',
    low: 10,
    high: 40,
    unit: 'U/L',
  },
  {
    id: 'ref_bilirubin',
    loincCode: '1975-2',
    testName: 'Bilirubin Total',
    low: 0.1,
    high: 1.2,
    criticalHigh: 15.0,
    unit: 'mg/dL',
  },
  {
    id: 'ref_albumin',
    loincCode: '1751-7',
    testName: 'Albumin',
    low: 3.5,
    high: 5.5,
    unit: 'g/dL',
  },
  {
    id: 'ref_alp',
    loincCode: '6768-6',
    testName: 'Alkaline Phosphatase',
    low: 44,
    high: 147,
    unit: 'U/L',
  },

  // Lipid Panel
  {
    id: 'ref_cholesterol',
    loincCode: '2093-3',
    testName: 'Total Cholesterol',
    high: 200,
    unit: 'mg/dL',
    text: 'Desirable: <200 mg/dL',
  },
  {
    id: 'ref_hdl_male',
    loincCode: '2085-9',
    testName: 'HDL Cholesterol',
    low: 40,
    unit: 'mg/dL',
    gender: 'M',
  },
  {
    id: 'ref_hdl_female',
    loincCode: '2085-9',
    testName: 'HDL Cholesterol',
    low: 50,
    unit: 'mg/dL',
    gender: 'F',
  },
  {
    id: 'ref_ldl',
    loincCode: '2089-1',
    testName: 'LDL Cholesterol',
    high: 100,
    unit: 'mg/dL',
    text: 'Optimal: <100 mg/dL',
  },
  {
    id: 'ref_triglycerides',
    loincCode: '2571-8',
    testName: 'Triglycerides',
    high: 150,
    unit: 'mg/dL',
  },

  // Thyroid
  {
    id: 'ref_tsh',
    loincCode: '3016-3',
    testName: 'TSH',
    low: 0.4,
    high: 4.0,
    unit: 'mIU/L',
  },
  {
    id: 'ref_t4',
    loincCode: '3026-2',
    testName: 'T4',
    low: 4.5,
    high: 12.0,
    unit: 'mcg/dL',
  },

  // Cardiac Markers
  {
    id: 'ref_troponin',
    loincCode: '6598-7',
    testName: 'Troponin I',
    high: 0.04,
    criticalHigh: 0.10,
    unit: 'ng/mL',
  },

  // Coagulation
  {
    id: 'ref_pt',
    loincCode: '5902-2',
    testName: 'PT',
    low: 11,
    high: 13.5,
    unit: 'seconds',
  },
  {
    id: 'ref_inr',
    loincCode: '6301-6',
    testName: 'INR',
    low: 0.8,
    high: 1.1,
    unit: '',
  },
  {
    id: 'ref_aptt',
    loincCode: '3173-2',
    testName: 'aPTT',
    low: 25,
    high: 35,
    unit: 'seconds',
  },

  // HbA1c
  {
    id: 'ref_hba1c',
    loincCode: '4548-4',
    testName: 'Hemoglobin A1c',
    high: 5.7,
    unit: '%',
    text: 'Normal: <5.7%, Prediabetes: 5.7-6.4%, Diabetes: ≥6.5%',
  },
];

export function getReferenceRange(
  loincCode: string,
  gender?: 'M' | 'F' | 'O' | 'U',
  age?: number
): ReferenceRange | undefined {
  const ranges = REFERENCE_RANGES.filter(r => r.loincCode === loincCode);
  
  if (ranges.length === 0) return undefined;
  
  // Filter by gender if specified
  let filteredRanges = ranges;
  if (gender) {
    const genderSpecific = ranges.filter(r => r.gender === gender);
    if (genderSpecific.length > 0) {
      filteredRanges = genderSpecific;
    }
  }
  
  // Filter by age if specified
  if (age !== undefined) {
    const ageSpecific = filteredRanges.filter(r => {
      const matchesMin = r.ageMin === undefined || age >= r.ageMin;
      const matchesMax = r.ageMax === undefined || age <= r.ageMax;
      return matchesMin && matchesMax;
    });
    if (ageSpecific.length > 0) {
      return ageSpecific[0];
    }
  }
  
  // Return first match or most general range
  return filteredRanges.find(r => !r.gender && !r.ageMin && !r.ageMax) || filteredRanges[0];
}

export function evaluateResult(
  value: number,
  referenceRange: ReferenceRange
): 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH' {
  if (referenceRange.criticalLow && value < referenceRange.criticalLow) {
    return 'CRITICAL_LOW';
  }
  if (referenceRange.criticalHigh && value > referenceRange.criticalHigh) {
    return 'CRITICAL_HIGH';
  }
  if (referenceRange.low && value < referenceRange.low) {
    return 'LOW';
  }
  if (referenceRange.high && value > referenceRange.high) {
    return 'HIGH';
  }
  return 'NORMAL';
}
