/**
 * Medication Reconciliation AI Assistant
 * AI-powered medication safety and reconciliation
 *
 * Patient Safety: Identifies discrepancies, interactions, and contraindications
 */

import { LLMService } from './llm-service';
import {
  Medication,
  MedicationReconciliationRequest,
  MedicationReconciliationResponse,
  MedicationDiscrepancy,
  AIServiceError,
} from '@/types/ai';
import {
  MEDICATION_RECONCILIATION,
  fillPromptTemplate,
} from './prompts/clinical-prompts';

export class MedicationReconciliationAssistant {
  constructor(private llmService: LLMService) {}

  async reconcileMedications(
    request: MedicationReconciliationRequest,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<MedicationReconciliationResponse> {
    try {
      const {
        patientMedications,
        ehrMedications,
        allergies = [],
        conditions = [],
        labs = {},
      } = request;

      // Perform reconciliation
      const discrepancies = await this.identifyDiscrepancies(
        patientMedications,
        ehrMedications,
        allergies,
        conditions,
        auditContext
      );

      // Generate reconciled list
      const reconciledList = this.generateReconciledList(
        patientMedications,
        ehrMedications,
        discrepancies
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        discrepancies,
        reconciledList
      );

      // Identify critical alerts
      const criticalAlerts = discrepancies
        .filter(d => d.severity === 'critical' || d.severity === 'high')
        .map(d => `${d.type.toUpperCase()}: ${d.description}`);

      // Calculate confidence
      const confidence = this.calculateConfidence(discrepancies, reconciledList);

      return {
        discrepancies,
        reconciledList,
        recommendations,
        criticalAlerts,
        confidence,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new AIServiceError(
        `Failed to reconcile medications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MED_RECONCILIATION_FAILED',
        undefined,
        undefined,
        { originalError: error }
      );
    }
  }

  private async identifyDiscrepancies(
    patientMeds: Medication[],
    ehrMeds: Medication[],
    allergies: string[],
    conditions: string[],
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<MedicationDiscrepancy[]> {
    try {
      const patientMedsText = patientMeds
        .map(m => this.formatMedication(m))
        .join('\n');
      const ehrMedsText = ehrMeds.map(m => this.formatMedication(m)).join('\n');

      const prompt = fillPromptTemplate(MEDICATION_RECONCILIATION, {
        patientMedications: patientMedsText || 'None reported',
        ehrMedications: ehrMedsText || 'None in EHR',
        allergies: allergies.join(', ') || 'None',
        conditions: conditions.join(', ') || 'None documented',
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a medication safety specialist. Identify all medication discrepancies, interactions, and safety concerns. Prioritize patient safety.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1, // Very low for safety-critical task
          maxTokens: 2000,
        },
        auditContext
      );

      return this.parseDiscrepancies(response.content);
    } catch (error) {
      console.error('Failed to identify discrepancies:', error);
      return [];
    }
  }

  private formatMedication(med: Medication): string {
    return `${med.name} ${med.dosage} ${med.frequency} ${med.route}${med.indication ? ` (for ${med.indication})` : ''}`;
  }

  private parseDiscrepancies(content: string): MedicationDiscrepancy[] {
    const discrepancies: MedicationDiscrepancy[] = [];
    const lines = content.split('\n');

    let currentDiscrepancy: Partial<MedicationDiscrepancy> | null = null;
    let currentField: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for discrepancy type headers
      if (
        trimmed.match(
          /^(?:\d+\.\s*)?(?:type|discrepancy type|issue|problem):/i
        )
      ) {
        // Save previous discrepancy
        if (currentDiscrepancy?.type) {
          discrepancies.push(this.completeDiscrepancy(currentDiscrepancy));
        }

        const typeMatch = trimmed.match(
          /(duplication|interaction|contraindication|dose_issue|missing)/i
        );
        currentDiscrepancy = {
          type: (typeMatch?.[1].toLowerCase() as any) || 'missing',
          medications: [],
          evidence: [],
        };
        currentField = null;
        continue;
      }

      if (currentDiscrepancy) {
        if (trimmed.match(/^severity:/i)) {
          const sevMatch = trimmed.match(/(critical|high|moderate|low)/i);
          if (sevMatch) {
            currentDiscrepancy.severity = sevMatch[1].toLowerCase() as any;
          }
        } else if (trimmed.match(/^description:/i)) {
          currentDiscrepancy.description = trimmed.replace(/^description:\s*/i, '');
          currentField = 'description';
        } else if (trimmed.match(/^medications?:/i)) {
          const medText = trimmed.replace(/^medications?:\s*/i, '');
          currentDiscrepancy.medications = medText
            .split(/,|;/)
            .map(m => m.trim())
            .filter(m => m.length > 0);
          currentField = null;
        } else if (trimmed.match(/^recommendation:/i)) {
          currentDiscrepancy.recommendation = trimmed.replace(
            /^recommendation:\s*/i,
            ''
          );
          currentField = 'recommendation';
        } else if (trimmed.match(/^evidence:/i)) {
          currentField = 'evidence';
        } else if (currentField === 'description' && trimmed && !trimmed.match(/^[a-z]+:/i)) {
          currentDiscrepancy.description += ' ' + trimmed;
        } else if (currentField === 'recommendation' && trimmed && !trimmed.match(/^[a-z]+:/i)) {
          currentDiscrepancy.recommendation += ' ' + trimmed;
        } else if (currentField === 'evidence' && trimmed.startsWith('-')) {
          currentDiscrepancy.evidence!.push(trimmed.replace(/^[-*•]\s*/, ''));
        }
      }
    }

    // Save last discrepancy
    if (currentDiscrepancy?.type) {
      discrepancies.push(this.completeDiscrepancy(currentDiscrepancy));
    }

    return discrepancies;
  }

  private completeDiscrepancy(
    partial: Partial<MedicationDiscrepancy>
  ): MedicationDiscrepancy {
    return {
      type: partial.type || 'missing',
      severity: partial.severity || 'moderate',
      description: partial.description || 'Medication discrepancy identified',
      medications: partial.medications || [],
      recommendation: partial.recommendation || 'Review with patient and provider',
      evidence: partial.evidence || [],
    };
  }

  private generateReconciledList(
    patientMeds: Medication[],
    ehrMeds: Medication[],
    discrepancies: MedicationDiscrepancy[]
  ): Medication[] {
    const reconciled: Medication[] = [];
    const processed = new Set<string>();

    // Add EHR medications as base
    for (const med of ehrMeds) {
      const key = this.getMedicationKey(med);
      if (!processed.has(key)) {
        reconciled.push({ ...med, source: 'ehr' });
        processed.add(key);
      }
    }

    // Add patient-reported medications not in EHR
    for (const med of patientMeds) {
      const key = this.getMedicationKey(med);
      if (!processed.has(key)) {
        reconciled.push({ ...med, source: 'patient_reported' });
        processed.add(key);
      }
    }

    // Sort by medication name
    return reconciled.sort((a, b) => a.name.localeCompare(b.name));
  }

  private getMedicationKey(med: Medication): string {
    // Normalize medication name for comparison
    return med.name.toLowerCase().replace(/\s+/g, '');
  }

  private generateRecommendations(
    discrepancies: MedicationDiscrepancy[],
    reconciledList: Medication[]
  ): string[] {
    const recommendations: string[] = [];

    // Critical discrepancies first
    const critical = discrepancies.filter(d => d.severity === 'critical');
    if (critical.length > 0) {
      recommendations.push(
        'URGENT: Address critical medication safety issues immediately'
      );
    }

    // High severity discrepancies
    const high = discrepancies.filter(d => d.severity === 'high');
    if (high.length > 0) {
      recommendations.push(
        `Review ${high.length} high-priority medication safety concern(s)`
      );
    }

    // Specific recommendations based on discrepancy types
    const interactions = discrepancies.filter(d => d.type === 'interaction');
    if (interactions.length > 0) {
      recommendations.push(
        `Review drug interactions: ${interactions.length} potential interaction(s) identified`
      );
    }

    const duplicates = discrepancies.filter(d => d.type === 'duplication');
    if (duplicates.length > 0) {
      recommendations.push('Eliminate duplicate therapy to prevent adverse events');
    }

    const contraindications = discrepancies.filter(
      d => d.type === 'contraindication'
    );
    if (contraindications.length > 0) {
      recommendations.push('Address contraindicated medications immediately');
    }

    // General recommendations
    if (discrepancies.length > 0) {
      recommendations.push(
        'Discuss medication changes with patient and update medication list'
      );
      recommendations.push('Document reconciliation in medical record');
    } else {
      recommendations.push('Medication list appears accurate - verify with patient');
    }

    return recommendations.slice(0, 6);
  }

  private calculateConfidence(
    discrepancies: MedicationDiscrepancy[],
    reconciledList: Medication[]
  ): number {
    // Higher confidence when:
    // - Fewer critical discrepancies
    // - More medications successfully reconciled
    // - Clear medication sources

    let confidence = 0.8;

    // Reduce confidence for critical issues
    const critical = discrepancies.filter(d => d.severity === 'critical').length;
    confidence -= critical * 0.15;

    // Reduce confidence for many discrepancies
    confidence -= Math.min(discrepancies.length * 0.05, 0.3);

    // Increase confidence if medications have clear sources
    const withSource = reconciledList.filter(m => m.source).length;
    const sourceRatio = withSource / Math.max(reconciledList.length, 1);
    confidence += sourceRatio * 0.1;

    return Math.max(0.3, Math.min(confidence, 0.95));
  }

  async checkDrugInteractions(
    medications: Medication[],
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<MedicationDiscrepancy[]> {
    try {
      const medList = medications.map(m => this.formatMedication(m)).join('\n');

      const prompt = `Analyze the following medication list for drug-drug interactions.

Medications:
${medList}

Identify:
1. Major interactions (avoid combination)
2. Moderate interactions (monitor closely)
3. Minor interactions (be aware)

For each interaction, provide:
- Medications involved
- Severity (critical/high/moderate/low)
- Description of interaction
- Clinical recommendation
- Supporting evidence

Focus on clinically significant interactions.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical pharmacist. Identify clinically significant drug interactions.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          maxTokens: 1500,
        },
        auditContext
      );

      return this.parseDiscrepancies(response.content);
    } catch (error) {
      console.error('Failed to check drug interactions:', error);
      return [];
    }
  }
}

// Factory function
export function createMedicationReconciliationAssistant(
  llmService: LLMService
): MedicationReconciliationAssistant {
  return new MedicationReconciliationAssistant(llmService);
}
