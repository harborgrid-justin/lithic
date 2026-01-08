/**
 * Clinical Quality Measure Gap Detection
 * AI-powered identification of quality measure gaps
 *
 * Value-Based Care: Supports HEDIS, CMS, and other quality programs
 */

import { LLMService } from './llm-service';
import {
  QualityGapRequest,
  QualityGapResponse,
  CareGap,
  AIServiceError,
} from '@/types/ai';
import {
  QUALITY_GAP_ANALYSIS,
  fillPromptTemplate,
} from './prompts/clinical-prompts';

export class QualityGapDetector {
  constructor(private llmService: LLMService) {}

  async detectGaps(
    request: QualityGapRequest,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
    }
  ): Promise<QualityGapResponse> {
    try {
      const {
        patientId,
        demographics,
        conditions,
        medications,
        recentVisits,
        labs = {},
        immunizations = [],
        screenings = [],
      } = request;

      // Analyze for quality gaps
      const gaps = await this.analyzeQualityGaps(
        demographics,
        conditions,
        medications,
        labs,
        immunizations,
        screenings,
        auditContext
      );

      // Identify compliant measures
      const compliantMeasures = this.identifyCompliantMeasures(
        gaps,
        demographics,
        conditions
      );

      // Generate priority actions
      const priorityActions = this.generatePriorityActions(gaps);

      // Calculate overall quality score
      const overallScore = this.calculateQualityScore(gaps, compliantMeasures);

      return {
        gaps,
        compliantMeasures,
        priorityActions,
        overallScore,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new AIServiceError(
        `Failed to detect quality gaps: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'QUALITY_GAP_DETECTION_FAILED',
        undefined,
        undefined,
        { originalError: error }
      );
    }
  }

  private async analyzeQualityGaps(
    demographics: { age: number; sex: string },
    conditions: string[],
    medications: Array<{ name: string; dosage: string; frequency: string }>,
    labs: Record<string, Array<{ value: number; date: Date }>>,
    immunizations: Array<{ name: string; date: Date }>,
    screenings: Array<{ type: string; result: string; date: Date }>,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
    }
  ): Promise<CareGap[]> {
    try {
      const medsText = medications
        .map(m => `${m.name} ${m.dosage} ${m.frequency}`)
        .join(', ');

      const labsText = Object.entries(labs)
        .map(([test, values]) => {
          const recent = values[0];
          return recent
            ? `${test}: ${recent.value} on ${recent.date.toLocaleDateString()}`
            : '';
        })
        .filter(Boolean)
        .join(', ');

      const immunizationsText = immunizations
        .map(i => `${i.name} on ${i.date.toLocaleDateString()}`)
        .join(', ');

      const screeningsText = screenings
        .map(s => `${s.type}: ${s.result} on ${s.date.toLocaleDateString()}`)
        .join(', ');

      const prompt = fillPromptTemplate(QUALITY_GAP_ANALYSIS, {
        age: demographics.age.toString(),
        sex: demographics.sex,
        conditions: conditions.join(', ') || 'None documented',
        medications: medsText || 'None',
        labs: labsText || 'None',
        screenings: screeningsText || 'None',
        immunizations: immunizationsText || 'None',
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical quality analyst specializing in HEDIS and CMS quality measures. Identify care gaps that impact quality scores and patient outcomes.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2, // Low temperature for consistent analysis
          maxTokens: 2000,
        },
        auditContext
      );

      return this.parseCareGaps(response.content);
    } catch (error) {
      console.error('Failed to analyze quality gaps:', error);
      return [];
    }
  }

  private parseCareGaps(content: string): CareGap[] {
    const gaps: CareGap[] = [];
    const lines = content.split('\n');

    let currentGap: Partial<CareGap> | null = null;
    let currentField: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for measure name/ID
      if (trimmed.match(/^(?:\d+\.\s*)?(?:measure|gap|care gap):/i)) {
        // Save previous gap
        if (currentGap?.measureName) {
          gaps.push(this.completeCareGap(currentGap));
        }

        const measureText = trimmed.replace(/^(?:\d+\.\s*)?(?:measure|gap|care gap):\s*/i, '');
        currentGap = {
          measureId: this.generateMeasureId(measureText),
          measureName: measureText,
          recommendations: [],
          supportingData: {},
        };
        currentField = null;
        continue;
      }

      if (currentGap) {
        if (trimmed.match(/^category:/i)) {
          const catMatch = trimmed.match(
            /(diabetes|hypertension|preventive|chronic_disease|other)/i
          );
          currentGap.category = catMatch?.[1].toLowerCase() || 'other';
        } else if (trimmed.match(/^severity:/i)) {
          const sevMatch = trimmed.match(/(high|medium|low)/i);
          currentGap.severity = (sevMatch?.[1].toLowerCase() as any) || 'medium';
        } else if (trimmed.match(/^description:/i)) {
          currentGap.description = trimmed.replace(/^description:\s*/i, '');
          currentField = 'description';
        } else if (trimmed.match(/^due date:/i)) {
          const dateMatch = trimmed.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
          if (dateMatch) {
            currentGap.dueDate = new Date(dateMatch[0]);
          }
        } else if (trimmed.match(/^recommendations?:/i)) {
          currentField = 'recommendations';
        } else if (trimmed.match(/^reasoning:/i)) {
          currentGap.reasoning = trimmed.replace(/^reasoning:\s*/i, '');
          currentField = 'reasoning';
        } else if (currentField === 'description' && trimmed && !trimmed.match(/^[a-z]+:/i)) {
          currentGap.description += ' ' + trimmed;
        } else if (currentField === 'reasoning' && trimmed && !trimmed.match(/^[a-z]+:/i)) {
          currentGap.reasoning += ' ' + trimmed;
        } else if (currentField === 'recommendations' && trimmed.startsWith('-')) {
          currentGap.recommendations!.push(trimmed.replace(/^[-*•]\s*/, ''));
        }
      }
    }

    // Save last gap
    if (currentGap?.measureName) {
      gaps.push(this.completeCareGap(currentGap));
    }

    return gaps;
  }

  private completeCareGap(partial: Partial<CareGap>): CareGap {
    return {
      measureId: partial.measureId || 'UNKNOWN',
      measureName: partial.measureName || 'Unknown Measure',
      category: partial.category || 'other',
      severity: partial.severity || 'medium',
      description: partial.description || 'Care gap identified',
      dueDate: partial.dueDate,
      recommendations: partial.recommendations || ['Consult with provider'],
      reasoning: partial.reasoning || 'Based on quality measure criteria',
      supportingData: partial.supportingData || {},
    };
  }

  private generateMeasureId(measureName: string): string {
    // Generate a simple ID from measure name
    return measureName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 20);
  }

  private identifyCompliantMeasures(
    gaps: CareGap[],
    demographics: { age: number; sex: string },
    conditions: string[]
  ): string[] {
    const compliant: string[] = [];

    // Common quality measures by age and conditions
    const applicableMeasures = this.getApplicableMeasures(demographics, conditions);

    // Measures not in gaps are compliant
    const gapMeasures = new Set(gaps.map(g => g.measureName.toLowerCase()));

    for (const measure of applicableMeasures) {
      if (!gapMeasures.has(measure.toLowerCase())) {
        compliant.push(measure);
      }
    }

    return compliant;
  }

  private getApplicableMeasures(
    demographics: { age: number; sex: string },
    conditions: string[]
  ): string[] {
    const measures: string[] = [];

    // Age-based preventive measures
    if (demographics.age >= 50) {
      measures.push('Colorectal Cancer Screening');
    }
    if (demographics.age >= 65) {
      measures.push('Pneumococcal Vaccination');
      measures.push('Influenza Vaccination');
    }
    if (demographics.sex === 'female' && demographics.age >= 50 && demographics.age <= 74) {
      measures.push('Breast Cancer Screening');
    }
    if (demographics.sex === 'female' && demographics.age >= 21 && demographics.age <= 65) {
      measures.push('Cervical Cancer Screening');
    }

    // Condition-based measures
    const lowerConditions = conditions.map(c => c.toLowerCase());

    if (lowerConditions.some(c => c.includes('diabetes'))) {
      measures.push('Diabetes HbA1c Control');
      measures.push('Diabetes Eye Exam');
      measures.push('Diabetes Kidney Screening');
    }

    if (lowerConditions.some(c => c.includes('hypertension') || c.includes('high blood pressure'))) {
      measures.push('Blood Pressure Control');
    }

    if (lowerConditions.some(c => c.includes('asthma') || c.includes('copd'))) {
      measures.push('Appropriate Asthma/COPD Medications');
    }

    return measures;
  }

  private generatePriorityActions(gaps: CareGap[]): string[] {
    const actions: string[] = [];

    // High severity gaps first
    const highSeverity = gaps.filter(g => g.severity === 'high');
    if (highSeverity.length > 0) {
      for (const gap of highSeverity.slice(0, 2)) {
        actions.push(`Priority: ${gap.measureName} - ${gap.recommendations[0]}`);
      }
    }

    // Overdue gaps
    const now = new Date();
    const overdue = gaps.filter(g => g.dueDate && g.dueDate < now);
    if (overdue.length > 0) {
      actions.push(`${overdue.length} overdue quality measure(s) - schedule appointments`);
    }

    // Category-specific actions
    const categories = new Set(gaps.map(g => g.category));
    if (categories.has('diabetes')) {
      actions.push('Schedule comprehensive diabetes management visit');
    }
    if (categories.has('preventive')) {
      actions.push('Review and schedule preventive care services');
    }

    // General action if gaps exist
    if (gaps.length > 0 && actions.length === 0) {
      actions.push('Review care gaps with patient during next visit');
      actions.push('Schedule needed screenings and follow-up appointments');
    }

    return actions.slice(0, 5);
  }

  private calculateQualityScore(
    gaps: CareGap[],
    compliantMeasures: string[]
  ): number {
    const total = gaps.length + compliantMeasures.length;
    if (total === 0) return 0.85; // Default good score if no applicable measures

    const compliantCount = compliantMeasures.length;

    // Weight by severity of gaps
    const severityWeights = { high: 2, medium: 1, low: 0.5 };
    const gapWeight = gaps.reduce(
      (sum, gap) => sum + (severityWeights[gap.severity] || 1),
      0
    );

    // Calculate score (0-1 scale)
    const score = compliantCount / (compliantCount + gapWeight);

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  async generateQualityReport(
    response: QualityGapResponse,
    patientName: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
    }
  ): Promise<string> {
    try {
      const gapsText = response.gaps
        .map(g => `- ${g.measureName}: ${g.description} (${g.severity} priority)`)
        .join('\n');

      const prompt = `Generate a patient-friendly quality care summary.

Patient: ${patientName}
Overall Quality Score: ${(response.overallScore * 100).toFixed(0)}%

Care Gaps Identified:
${gapsText || 'None'}

Compliant Measures:
${response.compliantMeasures.map(m => `- ${m}`).join('\n') || 'None assessed'}

Create a brief, encouraging summary that:
1. Acknowledges what's going well
2. Explains care gaps in simple terms
3. Provides clear next steps
4. Maintains positive, supportive tone

Keep it under 200 words and use patient-friendly language.`;

      const llmResponse = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a patient care coordinator. Create clear, supportive quality care summaries.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          maxTokens: 400,
        },
        auditContext
      );

      return llmResponse.content.trim();
    } catch (error) {
      console.error('Failed to generate quality report:', error);
      return `Quality Score: ${(response.overallScore * 100).toFixed(0)}%\n\nCare gaps identified: ${response.gaps.length}\nCompliant measures: ${response.compliantMeasures.length}`;
    }
  }

  async getGapClosureGuidance(
    gap: CareGap,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
    }
  ): Promise<{
    steps: string[];
    documentation: string[];
    billing: string[];
  }> {
    try {
      const prompt = `Provide detailed guidance for closing this quality measure gap:

Measure: ${gap.measureName}
Description: ${gap.description}
Category: ${gap.category}

Provide:
1. Clinical steps to close the gap
2. Documentation requirements
3. Billing/coding considerations

Be specific and actionable.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a quality improvement specialist. Provide practical guidance for closing care gaps.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          maxTokens: 800,
        },
        auditContext
      );

      // Parse the response into categories
      const lines = response.content.split('\n').map(l => l.trim());

      const steps: string[] = [];
      const documentation: string[] = [];
      const billing: string[] = [];

      let currentCategory: string[] = steps;

      for (const line of lines) {
        if (line.match(/documentation/i)) {
          currentCategory = documentation;
        } else if (line.match(/billing|coding/i)) {
          currentCategory = billing;
        } else if (line.match(/steps|clinical/i)) {
          currentCategory = steps;
        } else if (line.startsWith('-') || line.match(/^\d+\./)) {
          const cleaned = line.replace(/^[-*•]\s*|\d+\.\s*/, '');
          if (cleaned.length > 5) {
            currentCategory.push(cleaned);
          }
        }
      }

      return {
        steps: steps.slice(0, 5),
        documentation: documentation.slice(0, 3),
        billing: billing.slice(0, 3),
      };
    } catch (error) {
      console.error('Failed to get gap closure guidance:', error);
      return {
        steps: gap.recommendations,
        documentation: ['Document all relevant clinical information'],
        billing: ['Use appropriate codes for services provided'],
      };
    }
  }
}

// Factory function
export function createQualityGapDetector(
  llmService: LLMService
): QualityGapDetector {
  return new QualityGapDetector(llmService);
}
