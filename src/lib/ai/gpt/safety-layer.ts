/**
 * AI Safety Layer
 *
 * Multi-layered safety system for clinical AI:
 * - PHI detection and redaction
 * - Output validation
 * - Hallucination detection
 * - Medical accuracy checks
 * - Harmful content filtering
 *
 * @module ai/gpt/safety-layer
 */

/**
 * Safety check result
 */
export interface SafetyCheckResult {
  safe: boolean;
  warnings: SafetyWarning[];
  criticalIssues: SafetyCriticalIssue[];
  phiDetected: boolean;
  hallucinationRisk: 'low' | 'medium' | 'high';
  confidenceScore: number;
  redactedContent?: string;
}

/**
 * Safety warning (non-critical)
 */
export interface SafetyWarning {
  type: 'phi_detected' | 'uncertain_output' | 'guideline_deviation' | 'incomplete_info';
  message: string;
  severity: 'low' | 'medium';
  location?: string;
}

/**
 * Critical safety issue (blocks output)
 */
export interface SafetyCriticalIssue {
  type: 'dangerous_recommendation' | 'contraindication_ignored' | 'harmful_content';
  message: string;
  evidence: string;
}

/**
 * PHI pattern definitions
 */
const PHI_PATTERNS = {
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN-REDACTED]',
  },
  phone: {
    pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    replacement: '[PHONE-REDACTED]',
  },
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL-REDACTED]',
  },
  mrn: {
    pattern: /\bMRN[:\s]*\d{6,10}\b/gi,
    replacement: '[MRN-REDACTED]',
  },
  dob: {
    pattern: /\b(DOB|Date of Birth)[:\s]*\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi,
    replacement: '[DOB-REDACTED]',
  },
  address: {
    pattern: /\b\d+\s+[A-Za-z\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
    replacement: '[ADDRESS-REDACTED]',
  },
  zipCode: {
    pattern: /\b\d{5}(-\d{4})?\b/g,
    replacement: '[ZIP-REDACTED]',
  },
};

/**
 * Dangerous medication combinations
 */
const DANGEROUS_COMBINATIONS = [
  {
    drugs: ['warfarin', 'aspirin', 'clopidogrel'],
    warning: 'Triple anticoagulation/antiplatelet therapy - high bleeding risk',
  },
  {
    drugs: ['ssri', 'mao inhibitor'],
    warning: 'SSRI + MAO inhibitor - risk of serotonin syndrome',
  },
  {
    drugs: ['metformin', 'contrast'],
    warning: 'Metformin + contrast - risk of lactic acidosis',
  },
  {
    drugs: ['ace inhibitor', 'arb', 'potassium'],
    warning: 'Dual RAAS blockade + potassium - hyperkalemia risk',
  },
];

/**
 * Harmful content patterns
 */
const HARMFUL_PATTERNS = [
  /\b(terminate|end|discontinue)\s+(life|pregnancy)\b/i,
  /\b(ignore|skip|bypass)\s+(safety|protocol|guideline)\b/i,
  /\bno need (for|to)\s+(consult|refer|test)\b/i,
];

/**
 * Hallucination indicators
 */
const HALLUCINATION_INDICATORS = [
  /\b(definitely|certainly|always|never)\s+(diagnos|treat|caus)\w+/i,
  /\b100%\s+(effective|accurate|safe)\b/i,
  /\bguaranteed\s+(cure|recovery|success)\b/i,
  /\b(only|single)\s+(possible|correct)\s+(diagnosis|treatment)\b/i,
];

/**
 * AI Safety Layer
 *
 * Comprehensive safety validation for clinical AI outputs
 */
export class SafetyLayer {
  /**
   * Check output for safety issues
   *
   * @param content - AI-generated content to check
   * @returns Safety check result with warnings and issues
   */
  async checkOutput(content: string): Promise<SafetyCheckResult> {
    const warnings: SafetyWarning[] = [];
    const criticalIssues: SafetyCriticalIssue[] = [];

    // PHI detection
    const { detected, redacted } = this.detectAndRedactPHI(content);
    if (detected) {
      warnings.push({
        type: 'phi_detected',
        message: 'Potential PHI detected in output - content has been redacted',
        severity: 'medium',
      });
    }

    // Harmful content check
    const harmfulContent = this.checkHarmfulContent(content);
    if (harmfulContent.length > 0) {
      criticalIssues.push(...harmfulContent);
    }

    // Hallucination detection
    const hallucinationRisk = this.assessHallucinationRisk(content);
    if (hallucinationRisk !== 'low') {
      warnings.push({
        type: 'uncertain_output',
        message: `${hallucinationRisk} hallucination risk detected - output may be overly certain`,
        severity: hallucinationRisk === 'high' ? 'medium' : 'low',
      });
    }

    // Dangerous medication combination check
    const medWarnings = this.checkMedicationSafety(content);
    warnings.push(...medWarnings);

    // Completeness check
    const completenessWarnings = this.checkCompleteness(content);
    warnings.push(...completenessWarnings);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      content,
      warnings.length,
      criticalIssues.length
    );

    return {
      safe: criticalIssues.length === 0,
      warnings,
      criticalIssues,
      phiDetected: detected,
      hallucinationRisk,
      confidenceScore,
      redactedContent: detected ? redacted : undefined,
    };
  }

  /**
   * Detect and redact PHI from content
   */
  private detectAndRedactPHI(content: string): {
    detected: boolean;
    redacted: string;
  } {
    let redacted = content;
    let detected = false;

    Object.entries(PHI_PATTERNS).forEach(([type, { pattern, replacement }]) => {
      if (pattern.test(content)) {
        detected = true;
        redacted = redacted.replace(pattern, replacement);
      }
    });

    // Check for common names (basic heuristic)
    const namePattern = /\b([A-Z][a-z]+ ){1,2}[A-Z][a-z]+\b/g;
    const possibleNames = content.match(namePattern);
    if (possibleNames && possibleNames.length > 3) {
      // Multiple capitalized names detected
      detected = true;
      redacted = redacted.replace(namePattern, '[NAME-REDACTED]');
    }

    return { detected, redacted };
  }

  /**
   * Check for harmful or dangerous content
   */
  private checkHarmfulContent(content: string): SafetyCriticalIssue[] {
    const issues: SafetyCriticalIssue[] = [];

    HARMFUL_PATTERNS.forEach(pattern => {
      const match = content.match(pattern);
      if (match) {
        issues.push({
          type: 'harmful_content',
          message: 'Output contains potentially harmful recommendation',
          evidence: match[0],
        });
      }
    });

    // Check for recommendation to skip emergency care
    if (
      /\bno need\s+(for|to)\s+(emergency|hospital|911)\b/i.test(content) &&
      /\b(chest pain|difficulty breathing|stroke|seizure)\b/i.test(content)
    ) {
      issues.push({
        type: 'dangerous_recommendation',
        message: 'Output suggests avoiding emergency care for serious symptoms',
        evidence: 'Recommendation to skip emergency evaluation for critical symptoms',
      });
    }

    return issues;
  }

  /**
   * Assess hallucination risk based on certainty language
   */
  private assessHallucinationRisk(
    content: string
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    HALLUCINATION_INDICATORS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        riskScore += matches.length;
      }
    });

    // Check for lack of uncertainty markers
    const uncertaintyMarkers = [
      /\b(may|might|could|possibly|potentially)\b/gi,
      /\b(consider|suggest|recommend)\b/gi,
      /\b(typically|generally|usually)\b/gi,
    ];

    const uncertaintyCount = uncertaintyMarkers.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches?.length || 0);
    }, 0);

    // If content is very certain and lacks uncertainty markers
    if (riskScore >= 3) return 'high';
    if (riskScore >= 1 || uncertaintyCount < 2) return 'medium';
    return 'low';
  }

  /**
   * Check for dangerous medication combinations
   */
  private checkMedicationSafety(content: string): SafetyWarning[] {
    const warnings: SafetyWarning[] = [];
    const lowerContent = content.toLowerCase();

    DANGEROUS_COMBINATIONS.forEach(({ drugs, warning }) => {
      const foundDrugs = drugs.filter(drug => lowerContent.includes(drug));
      if (foundDrugs.length >= 2) {
        warnings.push({
          type: 'guideline_deviation',
          message: warning,
          severity: 'medium',
          location: `Medications: ${foundDrugs.join(', ')}`,
        });
      }
    });

    return warnings;
  }

  /**
   * Check for incomplete clinical information
   */
  private checkCompleteness(content: string): SafetyWarning[] {
    const warnings: SafetyWarning[] = [];

    // Check for incomplete tags
    if (/\[INCOMPLETE\]/i.test(content)) {
      warnings.push({
        type: 'incomplete_info',
        message: 'Output contains incomplete sections',
        severity: 'medium',
      });
    }

    // Check for TODO or placeholder text
    if (/\b(TODO|TBD|PLACEHOLDER)\b/i.test(content)) {
      warnings.push({
        type: 'incomplete_info',
        message: 'Output contains placeholder text',
        severity: 'medium',
      });
    }

    // If discussing diagnosis without mentioning differential
    if (
      /\bdiagnosis\b/i.test(content) &&
      !/\b(differential|alternative|consider|rule out)\b/i.test(content)
    ) {
      warnings.push({
        type: 'guideline_deviation',
        message: 'Single diagnosis mentioned without differential consideration',
        severity: 'low',
      });
    }

    return warnings;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidenceScore(
    content: string,
    warningCount: number,
    criticalIssueCount: number
  ): number {
    let score = 100;

    // Penalize for critical issues
    score -= criticalIssueCount * 50;

    // Penalize for warnings
    score -= warningCount * 10;

    // Bonus for evidence-based language
    const evidenceMarkers = [
      /\b(evidence level|guideline|study|trial|meta-analysis)\b/gi,
      /\b(ACC\/AHA|IDSA|CDC|WHO)\b/gi,
    ];

    evidenceMarkers.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 5;
      }
    });

    // Bonus for appropriate uncertainty
    if (/\b(recommend|suggest|consider)\b/i.test(content)) {
      score += 5;
    }

    // Bonus for safety disclaimers
    if (/\b(provider|physician|clinical judgment)\b/i.test(content)) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Validate medication order safety
   *
   * @param medication - Medication name
   * @param dose - Dose
   * @param route - Route of administration
   * @param patientContext - Patient context
   * @returns Safety validation result
   */
  validateMedicationOrder(
    medication: string,
    dose: string,
    route: string,
    patientContext: {
      age?: number;
      weight?: number;
      allergies?: string[];
      renalFunction?: string;
      hepaticFunction?: string;
    }
  ): {
    safe: boolean;
    warnings: string[];
    criticalAlerts: string[];
  } {
    const warnings: string[] = [];
    const criticalAlerts: string[] = [];

    // Check allergies
    if (patientContext.allergies) {
      const allergyMatch = patientContext.allergies.some(allergy =>
        medication.toLowerCase().includes(allergy.toLowerCase())
      );
      if (allergyMatch) {
        criticalAlerts.push(
          `ALLERGY ALERT: Patient has documented allergy to ${medication}`
        );
      }
    }

    // Check pediatric dosing
    if (patientContext.age && patientContext.age < 18) {
      warnings.push('Pediatric patient - verify dose is age-appropriate');
    }

    // Check geriatric considerations
    if (patientContext.age && patientContext.age >= 65) {
      warnings.push('Geriatric patient - consider dose adjustment and Beers criteria');
    }

    // Check renal dosing
    if (patientContext.renalFunction === 'impaired') {
      const renalDosedMeds = [
        'metformin',
        'gabapentin',
        'enoxaparin',
        'vancomycin',
      ];
      if (
        renalDosedMeds.some(med => medication.toLowerCase().includes(med))
      ) {
        warnings.push('Renal impairment - dose adjustment may be required');
      }
    }

    // Check hepatic dosing
    if (patientContext.hepaticFunction === 'impaired') {
      warnings.push('Hepatic impairment - verify dose appropriateness');
    }

    return {
      safe: criticalAlerts.length === 0,
      warnings,
      criticalAlerts,
    };
  }

  /**
   * Check if clinical recommendation follows evidence-based guidelines
   *
   * @param recommendation - Clinical recommendation
   * @param condition - Medical condition
   * @returns Validation result
   */
  validateClinicalRecommendation(
    recommendation: string,
    condition: string
  ): {
    evidenceBased: boolean;
    guidelineReference?: string;
    concerns: string[];
  } {
    const concerns: string[] = [];
    let evidenceBased = false;
    let guidelineReference: string | undefined;

    // Check for guideline references
    const guidelinePatterns = [
      /\b(ACC\/AHA|American College of Cardiology)\b/i,
      /\b(IDSA|Infectious Diseases Society)\b/i,
      /\b(ADA|American Diabetes Association)\b/i,
      /\b(CHEST|American College of Chest Physicians)\b/i,
      /\b(NCCN|National Comprehensive Cancer Network)\b/i,
    ];

    guidelinePatterns.forEach(pattern => {
      const match = recommendation.match(pattern);
      if (match) {
        evidenceBased = true;
        guidelineReference = match[0];
      }
    });

    // Check for evidence levels
    if (/\b(Level A|Level B|Level C)\b/i.test(recommendation)) {
      evidenceBased = true;
    }

    // Flag if no evidence mentioned
    if (!evidenceBased) {
      concerns.push('No guideline or evidence reference provided');
    }

    return {
      evidenceBased,
      guidelineReference,
      concerns,
    };
  }
}

/**
 * Utility function to sanitize content for logging
 * Removes all potential PHI before logging
 *
 * @param content - Content to sanitize
 * @returns Sanitized content safe for logs
 */
export function sanitizeForLogging(content: string): string {
  let sanitized = content;

  // Redact all PHI patterns
  Object.entries(PHI_PATTERNS).forEach(([, { pattern, replacement }]) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  // Redact any remaining patterns that look like identifiers
  sanitized = sanitized.replace(/\b[A-Z]{2,}\d{6,}\b/g, '[ID-REDACTED]');
  sanitized = sanitized.replace(/\b\d{6,}\b/g, '[NUMBER-REDACTED]');

  return sanitized;
}
