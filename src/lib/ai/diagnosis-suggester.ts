/**
 * Differential Diagnosis AI Engine
 * AI-powered differential diagnosis suggestions
 *
 * Clinical Decision Support: Advisory tool requiring clinician review
 */

import { LLMService } from './llm-service';
import {
  PatientPresentation,
  DiagnosisCandidate,
  DifferentialDiagnosisResponse,
  AIServiceError,
} from '@/types/ai';
import {
  DIFFERENTIAL_DIAGNOSIS,
  CRITICAL_FINDING_ALERT,
  fillPromptTemplate,
} from './prompts/clinical-prompts';

export class DiagnosisSuggester {
  constructor(private llmService: LLMService) {}

  async generateDifferential(
    presentation: PatientPresentation,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DifferentialDiagnosisResponse> {
    try {
      // Build clinical context
      const clinicalContext = this.buildClinicalContext(presentation);

      // Get differential diagnosis
      const candidates = await this.getDifferentialDiagnoses(
        clinicalContext,
        presentation,
        auditContext
      );

      // Identify critical flags
      const criticalFlags = await this.identifyCriticalFlags(
        clinicalContext,
        auditContext
      );

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(
        candidates,
        criticalFlags
      );

      // Calculate overall confidence
      const confidence =
        candidates.length > 0
          ? candidates.reduce((sum, c) => sum + c.probability, 0) / candidates.length
          : 0;

      return {
        candidates,
        criticalFlags,
        recommendedActions,
        confidence,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new AIServiceError(
        `Failed to generate differential diagnosis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DIAGNOSIS_SUGGESTION_FAILED',
        undefined,
        undefined,
        { originalError: error }
      );
    }
  }

  private buildClinicalContext(presentation: PatientPresentation): string {
    const parts: string[] = [];

    parts.push(`Chief Complaint: ${presentation.chiefComplaint}`);
    parts.push(`Symptoms: ${presentation.symptoms.join(', ')}`);
    parts.push(`Duration: ${presentation.duration}`);
    parts.push(`Severity: ${presentation.severity}`);

    if (presentation.age) {
      parts.push(`Age: ${presentation.age}`);
    }
    if (presentation.sex) {
      parts.push(`Sex: ${presentation.sex}`);
    }

    if (presentation.vitalSigns && Object.keys(presentation.vitalSigns).length > 0) {
      parts.push(
        `Vital Signs: ${Object.entries(presentation.vitalSigns)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')}`
      );
    }

    if (presentation.labs && Object.keys(presentation.labs).length > 0) {
      parts.push(`Labs: ${JSON.stringify(presentation.labs)}`);
    }

    if (presentation.imaging && presentation.imaging.length > 0) {
      parts.push(`Imaging: ${presentation.imaging.join(', ')}`);
    }

    if (presentation.medicalHistory && presentation.medicalHistory.length > 0) {
      parts.push(`Medical History: ${presentation.medicalHistory.join(', ')}`);
    }

    if (presentation.medications && presentation.medications.length > 0) {
      parts.push(`Current Medications: ${presentation.medications.join(', ')}`);
    }

    if (presentation.allergies && presentation.allergies.length > 0) {
      parts.push(`Allergies: ${presentation.allergies.join(', ')}`);
    }

    return parts.join('\n');
  }

  private async getDifferentialDiagnoses(
    clinicalContext: string,
    presentation: PatientPresentation,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DiagnosisCandidate[]> {
    try {
      const prompt = fillPromptTemplate(DIFFERENTIAL_DIAGNOSIS, {
        chiefComplaint: presentation.chiefComplaint,
        symptoms: presentation.symptoms.join(', '),
        duration: presentation.duration,
        vitalSigns: presentation.vitalSigns
          ? JSON.stringify(presentation.vitalSigns)
          : 'Not provided',
        physicalExam: 'See clinical context',
        additionalInfo: clinicalContext,
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical decision support system. Generate evidence-based differential diagnoses ranked by likelihood. Always consider life-threatening conditions. This is an advisory tool - final diagnosis must be made by a licensed clinician.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2, // Low temperature for consistent clinical reasoning
          maxTokens: 2000,
        },
        auditContext
      );

      return this.parseDifferentialResponse(response.content);
    } catch (error) {
      console.error('Failed to generate differential diagnoses:', error);
      return [];
    }
  }

  private async identifyCriticalFlags(
    clinicalContext: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<string[]> {
    try {
      const prompt = fillPromptTemplate(CRITICAL_FINDING_ALERT, {
        clinicalData: clinicalContext,
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical safety alert system. Identify critical findings requiring immediate attention. Err on the side of caution.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1, // Very low for safety-critical task
          maxTokens: 500,
        },
        auditContext
      );

      if (
        response.content.toLowerCase().includes('no critical') ||
        response.content.toLowerCase().includes('none identified')
      ) {
        return [];
      }

      return response.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-*•]\d+\.\s*/, ''))
        .filter(line => line.length > 10)
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to identify critical flags:', error);
      return [];
    }
  }

  private parseDifferentialResponse(content: string): DiagnosisCandidate[] {
    const candidates: DiagnosisCandidate[] = [];
    const lines = content.split('\n');

    let currentCandidate: Partial<DiagnosisCandidate> | null = null;
    let currentField: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for condition name patterns
      if (trimmed.match(/^\d+\.\s+(.+?)(?:\s*\(([A-Z]\d{2}\.?\d*)\))?/)) {
        // Save previous candidate
        if (currentCandidate?.condition) {
          candidates.push(this.completeDiagnosisCandidate(currentCandidate));
        }

        const match = trimmed.match(/^\d+\.\s+(.+?)(?:\s*\(([A-Z]\d{2}\.?\d*)\))?/);
        currentCandidate = {
          condition: match![1].trim(),
          icd10Code: match![2] || '',
          supportingFindings: [],
          contradictingFindings: [],
          recommendedTests: [],
        };
        currentField = null;
        continue;
      }

      if (currentCandidate) {
        // Look for fields
        if (trimmed.match(/^(?:probability|likelihood):/i)) {
          const probMatch = trimmed.match(/(high|moderate|low|[\d.]+)/i);
          if (probMatch) {
            currentCandidate.probability =
              probMatch[1].toLowerCase() === 'high' ? 0.8 :
              probMatch[1].toLowerCase() === 'moderate' ? 0.6 :
              probMatch[1].toLowerCase() === 'low' ? 0.3 :
              parseFloat(probMatch[1]) || 0.6;
          }
          currentField = null;
        } else if (trimmed.match(/^(?:icd-?10|code):/i)) {
          const codeMatch = trimmed.match(/([A-Z]\d{2}\.?\d*)/);
          if (codeMatch) {
            currentCandidate.icd10Code = codeMatch[1];
          }
          currentField = null;
        } else if (trimmed.match(/^reasoning:/i)) {
          currentCandidate.reasoning = trimmed.replace(/^reasoning:\s*/i, '');
          currentField = 'reasoning';
        } else if (trimmed.match(/^supporting/i)) {
          currentField = 'supporting';
        } else if (trimmed.match(/^contradicting/i)) {
          currentField = 'contradicting';
        } else if (trimmed.match(/^recommended tests:/i)) {
          currentField = 'tests';
        } else if (trimmed.match(/^urgency:/i)) {
          const urgMatch = trimmed.match(/(routine|urgent|emergent)/i);
          if (urgMatch) {
            currentCandidate.urgencyLevel = urgMatch[1].toLowerCase() as any;
          }
          currentField = null;
        } else if (currentField && trimmed.startsWith('-')) {
          const item = trimmed.replace(/^[-*•]\s*/, '');
          if (currentField === 'supporting') {
            currentCandidate.supportingFindings!.push(item);
          } else if (currentField === 'contradicting') {
            currentCandidate.contradictingFindings!.push(item);
          } else if (currentField === 'tests') {
            currentCandidate.recommendedTests!.push(item);
          }
        } else if (currentField === 'reasoning' && trimmed) {
          currentCandidate.reasoning += ' ' + trimmed;
        }
      }
    }

    // Save last candidate
    if (currentCandidate?.condition) {
      candidates.push(this.completeDiagnosisCandidate(currentCandidate));
    }

    return candidates.slice(0, 10); // Limit to top 10
  }

  private completeDiagnosisCandidate(
    partial: Partial<DiagnosisCandidate>
  ): DiagnosisCandidate {
    return {
      condition: partial.condition || 'Unknown condition',
      icd10Code: partial.icd10Code || '',
      probability: partial.probability || 0.5,
      reasoning: partial.reasoning || 'Based on clinical presentation',
      supportingFindings: partial.supportingFindings || [],
      contradictingFindings: partial.contradictingFindings || [],
      recommendedTests: partial.recommendedTests || [],
      urgencyLevel: partial.urgencyLevel || 'routine',
    };
  }

  private generateRecommendedActions(
    candidates: DiagnosisCandidate[],
    criticalFlags: string[]
  ): string[] {
    const actions: string[] = [];

    // Add actions based on critical flags
    if (criticalFlags.length > 0) {
      actions.push('Immediate clinical evaluation required for critical findings');
    }

    // Add actions from high-probability diagnoses
    const highProbDiagnoses = candidates.filter(c => c.probability > 0.7);
    if (highProbDiagnoses.length > 0) {
      for (const diagnosis of highProbDiagnoses) {
        if (diagnosis.urgencyLevel === 'emergent') {
          actions.push(
            `Emergent evaluation needed for possible ${diagnosis.condition}`
          );
        }
        if (diagnosis.recommendedTests.length > 0) {
          actions.push(
            `Consider: ${diagnosis.recommendedTests.slice(0, 2).join(', ')} for ${diagnosis.condition}`
          );
        }
      }
    }

    // General recommendations
    if (candidates.length > 0) {
      actions.push('Document detailed history and physical examination');
      actions.push('Consider differential diagnoses in clinical decision-making');
    }

    return actions.slice(0, 5); // Limit to 5 actions
  }

  async refineWithAdditionalData(
    previousResponse: DifferentialDiagnosisResponse,
    additionalData: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DifferentialDiagnosisResponse> {
    try {
      const currentDifferential = previousResponse.candidates
        .map(
          c =>
            `${c.condition} (${c.icd10Code}): ${c.probability.toFixed(2)} probability`
        )
        .join('\n');

      const prompt = `Given the following differential diagnosis and new clinical data, update the differential.

Current Differential:
${currentDifferential}

New Clinical Data:
${additionalData}

Provide an updated differential diagnosis with revised probabilities and reasoning.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical decision support system. Update differential diagnoses based on new information.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          maxTokens: 2000,
        },
        auditContext
      );

      const updatedCandidates = this.parseDifferentialResponse(response.content);

      return {
        ...previousResponse,
        candidates: updatedCandidates,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to refine differential:', error);
      return previousResponse;
    }
  }
}

// Factory function
export function createDiagnosisSuggester(
  llmService: LLMService
): DiagnosisSuggester {
  return new DiagnosisSuggester(llmService);
}
