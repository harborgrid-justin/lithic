"use strict";
/**
 * Reference Ranges for Laboratory Tests
 * Age and gender-specific normal ranges
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFERENCE_RANGES = void 0;
exports.getReferenceRange = getReferenceRange;
exports.isCritical = isCritical;
exports.isAbnormal = isAbnormal;
exports.getAbnormalityFlag = getAbnormalityFlag;
exports.REFERENCE_RANGES = [
    // CHEMISTRY
    {
        loincCode: '2345-7',
        testName: 'Glucose',
        minValue: 70,
        maxValue: 100,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 50,
        criticalHigh: 400,
        description: 'Fasting glucose'
    },
    {
        loincCode: '2160-0',
        testName: 'Creatinine',
        minValue: 0.6,
        maxValue: 1.2,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'male',
        criticalHigh: 5.0
    },
    {
        loincCode: '2160-0',
        testName: 'Creatinine',
        minValue: 0.5,
        maxValue: 1.1,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'female',
        criticalHigh: 5.0
    },
    {
        loincCode: '2951-2',
        testName: 'Sodium',
        minValue: 136,
        maxValue: 145,
        unit: 'mmol/L',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 120,
        criticalHigh: 160
    },
    {
        loincCode: '2823-3',
        testName: 'Potassium',
        minValue: 3.5,
        maxValue: 5.1,
        unit: 'mmol/L',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 2.5,
        criticalHigh: 6.5
    },
    {
        loincCode: '2075-0',
        testName: 'Chloride',
        minValue: 98,
        maxValue: 107,
        unit: 'mmol/L',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 80,
        criticalHigh: 120
    },
    {
        loincCode: '2028-9',
        testName: 'CO2',
        minValue: 23,
        maxValue: 29,
        unit: 'mmol/L',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 15,
        criticalHigh: 40
    },
    {
        loincCode: '3094-0',
        testName: 'BUN',
        minValue: 7,
        maxValue: 20,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 100
    },
    {
        loincCode: '1742-6',
        testName: 'ALT',
        minValue: 7,
        maxValue: 56,
        unit: 'U/L',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 1000
    },
    {
        loincCode: '1920-8',
        testName: 'AST',
        minValue: 10,
        maxValue: 40,
        unit: 'U/L',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 1000
    },
    {
        loincCode: '1975-2',
        testName: 'Total Bilirubin',
        minValue: 0.1,
        maxValue: 1.2,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 15
    },
    {
        loincCode: '17861-6',
        testName: 'Calcium',
        minValue: 8.5,
        maxValue: 10.5,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 6.0,
        criticalHigh: 13.0
    },
    // HEMATOLOGY
    {
        loincCode: '6690-2',
        testName: 'WBC',
        minValue: 4.5,
        maxValue: 11.0,
        unit: '10*3/uL',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 2.0,
        criticalHigh: 30.0
    },
    {
        loincCode: '789-8',
        testName: 'RBC',
        minValue: 4.5,
        maxValue: 5.9,
        unit: '10*6/uL',
        ageGroup: 'adult',
        gender: 'male',
        criticalLow: 2.0
    },
    {
        loincCode: '789-8',
        testName: 'RBC',
        minValue: 4.1,
        maxValue: 5.1,
        unit: '10*6/uL',
        ageGroup: 'adult',
        gender: 'female',
        criticalLow: 2.0
    },
    {
        loincCode: '718-7',
        testName: 'Hemoglobin',
        minValue: 13.5,
        maxValue: 17.5,
        unit: 'g/dL',
        ageGroup: 'adult',
        gender: 'male',
        criticalLow: 7.0,
        criticalHigh: 20.0
    },
    {
        loincCode: '718-7',
        testName: 'Hemoglobin',
        minValue: 12.0,
        maxValue: 15.5,
        unit: 'g/dL',
        ageGroup: 'adult',
        gender: 'female',
        criticalLow: 7.0,
        criticalHigh: 20.0
    },
    {
        loincCode: '4544-3',
        testName: 'Hematocrit',
        minValue: 38.8,
        maxValue: 50.0,
        unit: '%',
        ageGroup: 'adult',
        gender: 'male',
        criticalLow: 20.0,
        criticalHigh: 60.0
    },
    {
        loincCode: '4544-3',
        testName: 'Hematocrit',
        minValue: 34.9,
        maxValue: 44.5,
        unit: '%',
        ageGroup: 'adult',
        gender: 'female',
        criticalLow: 20.0,
        criticalHigh: 60.0
    },
    {
        loincCode: '787-2',
        testName: 'MCV',
        minValue: 80,
        maxValue: 100,
        unit: 'fL',
        ageGroup: 'adult',
        gender: 'all'
    },
    {
        loincCode: '785-6',
        testName: 'MCH',
        minValue: 27,
        maxValue: 33,
        unit: 'pg',
        ageGroup: 'adult',
        gender: 'all'
    },
    {
        loincCode: '786-4',
        testName: 'MCHC',
        minValue: 32,
        maxValue: 36,
        unit: 'g/dL',
        ageGroup: 'adult',
        gender: 'all'
    },
    {
        loincCode: '777-3',
        testName: 'Platelets',
        minValue: 150,
        maxValue: 400,
        unit: '10*3/uL',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 50,
        criticalHigh: 1000
    },
    // COAGULATION
    {
        loincCode: '5902-2',
        testName: 'PT',
        minValue: 11,
        maxValue: 13.5,
        unit: 'sec',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 30
    },
    {
        loincCode: '6301-6',
        testName: 'INR',
        minValue: 0.8,
        maxValue: 1.2,
        unit: '{INR}',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 5.0
    },
    {
        loincCode: '3173-2',
        testName: 'aPTT',
        minValue: 25,
        maxValue: 35,
        unit: 'sec',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 70
    },
    // ENDOCRINOLOGY
    {
        loincCode: '4548-4',
        testName: 'HbA1c',
        minValue: 4.0,
        maxValue: 5.6,
        unit: '%',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 14.0,
        description: 'Normal range; 5.7-6.4% = prediabetes; ≥6.5% = diabetes'
    },
    {
        loincCode: '3016-3',
        testName: 'TSH',
        minValue: 0.4,
        maxValue: 4.0,
        unit: 'uIU/mL',
        ageGroup: 'adult',
        gender: 'all',
        criticalLow: 0.1,
        criticalHigh: 20.0
    },
    {
        loincCode: '3051-0',
        testName: 'Free T4',
        minValue: 0.8,
        maxValue: 1.8,
        unit: 'ng/dL',
        ageGroup: 'adult',
        gender: 'all'
    },
    // LIPID PANEL
    {
        loincCode: '2093-3',
        testName: 'Total Cholesterol',
        maxValue: 200,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'all',
        description: 'Desirable <200 mg/dL'
    },
    {
        loincCode: '2571-8',
        testName: 'Triglycerides',
        maxValue: 150,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 1000,
        description: 'Normal <150 mg/dL'
    },
    {
        loincCode: '2085-9',
        testName: 'HDL Cholesterol',
        minValue: 40,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'male',
        description: 'Higher is better; ≥60 mg/dL protective'
    },
    {
        loincCode: '2085-9',
        testName: 'HDL Cholesterol',
        minValue: 50,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'female',
        description: 'Higher is better; ≥60 mg/dL protective'
    },
    {
        loincCode: '13457-7',
        testName: 'LDL Cholesterol',
        maxValue: 100,
        unit: 'mg/dL',
        ageGroup: 'adult',
        gender: 'all',
        description: 'Optimal <100 mg/dL'
    },
    // IMMUNOLOGY
    {
        loincCode: '1988-5',
        testName: 'CRP',
        maxValue: 3.0,
        unit: 'mg/L',
        ageGroup: 'adult',
        gender: 'all',
        criticalHigh: 200,
        description: 'Low risk <1.0, Average 1.0-3.0, High >3.0 mg/L'
    }
];
function getReferenceRange(loincCode, age, gender) {
    const ageGroup = age < 1 ? 'infant' : age < 18 ? 'pediatric' : 'adult';
    return exports.REFERENCE_RANGES.find(range => range.loincCode === loincCode &&
        (range.ageGroup === ageGroup || range.ageGroup === 'all') &&
        (range.gender === gender || range.gender === 'all'));
}
function isCritical(loincCode, value, age, gender) {
    const range = getReferenceRange(loincCode, age, gender);
    if (!range)
        return false;
    if (range.criticalLow !== undefined && value < range.criticalLow)
        return true;
    if (range.criticalHigh !== undefined && value > range.criticalHigh)
        return true;
    return false;
}
function isAbnormal(loincCode, value, age, gender) {
    const range = getReferenceRange(loincCode, age, gender);
    if (!range)
        return false;
    if (range.minValue !== undefined && value < range.minValue)
        return true;
    if (range.maxValue !== undefined && value > range.maxValue)
        return true;
    return false;
}
function getAbnormalityFlag(loincCode, value, age, gender) {
    if (isCritical(loincCode, value, age, gender)) {
        const range = getReferenceRange(loincCode, age, gender);
        if (range?.criticalLow !== undefined && value < range.criticalLow)
            return 'LL';
        if (range?.criticalHigh !== undefined && value > range.criticalHigh)
            return 'HH';
    }
    if (isAbnormal(loincCode, value, age, gender)) {
        const range = getReferenceRange(loincCode, age, gender);
        if (range?.minValue !== undefined && value < range.minValue)
            return 'L';
        if (range?.maxValue !== undefined && value > range.maxValue)
            return 'H';
    }
    return 'N';
}
//# sourceMappingURL=reference-ranges.js.map