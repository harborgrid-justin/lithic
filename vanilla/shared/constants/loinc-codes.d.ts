/**
 * LOINC (Logical Observation Identifiers Names and Codes)
 * Standard codes for laboratory and clinical observations
 */
export interface LOINCCode {
  code: string;
  component: string;
  property: string;
  timing: string;
  system: string;
  scale: string;
  method: string;
  displayName: string;
  commonName?: string;
  relatedNames?: string[];
  unit?: string;
  category:
    | "chemistry"
    | "hematology"
    | "microbiology"
    | "immunology"
    | "pathology"
    | "molecular"
    | "toxicology"
    | "endocrinology"
    | "coagulation";
}
export declare const LOINC_CODES: Record<string, LOINCCode>;
export declare const COMMON_PANELS: {
  CMP: {
    name: string;
    code: string;
    tests: string[];
  };
  BMP: {
    name: string;
    code: string;
    tests: string[];
  };
  CBC: {
    name: string;
    code: string;
    tests: string[];
  };
  LIPID: {
    name: string;
    code: string;
    tests: string[];
  };
  HEPATIC: {
    name: string;
    code: string;
    tests: string[];
  };
  THYROID: {
    name: string;
    code: string;
    tests: string[];
  };
  COAG: {
    name: string;
    code: string;
    tests: string[];
  };
};
export declare function getLOINCCode(code: string): LOINCCode | undefined;
export declare function getLOINCCodesByCategory(
  category: LOINCCode["category"],
): LOINCCode[];
export declare function searchLOINCCodes(query: string): LOINCCode[];
//# sourceMappingURL=loinc-codes.d.ts.map
