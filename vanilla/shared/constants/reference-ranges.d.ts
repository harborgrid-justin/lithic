/**
 * Reference Ranges for Laboratory Tests
 * Age and gender-specific normal ranges
 */
export interface ReferenceRange {
    loincCode: string;
    testName: string;
    minValue?: number;
    maxValue?: number;
    unit: string;
    ageGroup: 'adult' | 'pediatric' | 'infant' | 'all';
    gender?: 'male' | 'female' | 'all';
    criticalLow?: number;
    criticalHigh?: number;
    description?: string;
}
export declare const REFERENCE_RANGES: ReferenceRange[];
export declare function getReferenceRange(loincCode: string, age: number, gender: 'male' | 'female'): ReferenceRange | undefined;
export declare function isCritical(loincCode: string, value: number, age: number, gender: 'male' | 'female'): boolean;
export declare function isAbnormal(loincCode: string, value: number, age: number, gender: 'male' | 'female'): boolean;
export declare function getAbnormalityFlag(loincCode: string, value: number, age: number, gender: 'male' | 'female'): 'L' | 'H' | 'LL' | 'HH' | 'N';
//# sourceMappingURL=reference-ranges.d.ts.map