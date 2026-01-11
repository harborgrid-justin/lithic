/**
 * Medical Coding AI Assistant
 * AI-powered ICD-10 and CPT code suggestions
 *
 * Compliance: Assistant tool only - requires human review
 */

import { LLMService } from './llm-service';
import {
  CodingRequest,
  CodingResponse,
  CodingSuggestion,
  AIServiceError,
} from '@/types/ai';
import {
  ICD10_SUGGESTION,
  CPT_SUGGESTION,
  fillPromptTemplate,
} from './prompts/coding-prompts';

export class CodingAssistant {
  constructor(private llmService: LLMService) {}

  async suggestCodes(
    request: CodingRequest,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<CodingResponse> {
    try {
      const {
        clinicalText,
        encounterType = '',
        chiefComplaint = '',
        existingCodes = [],
        codingType = 'both',
      } = request;

      const icd10Suggestions: CodingSuggestion[] = [];
      const cptSuggestions: CodingSuggestion[] = [];

      // Get ICD-10 suggestions if requested
      if (codingType === 'icd10' || codingType === 'both') {
        const icd10 = await this.suggestICD10Codes(
          clinicalText,
          encounterType,
          chiefComplaint,
          auditContext
        );
        icd10Suggestions.push(...icd10);
      }

      // Get CPT suggestions if requested
      if (codingType === 'cpt' || codingType === 'both') {
        const cpt = await this.suggestCPTCodes(
          clinicalText,
          encounterType,
          auditContext
        );
        cptSuggestions.push(...cpt);
      }

      // Generate documentation recommendations
      const documentation = await this.generateDocumentationRecommendations(
        clinicalText,
        [...icd10Suggestions, ...cptSuggestions],
        auditContext
      );

      // Calculate overall confidence
      const allSuggestions = [...icd10Suggestions, ...cptSuggestions];
      const confidenceScore =
        allSuggestions.length > 0
          ? allSuggestions.reduce((sum, s) => sum + s.confidence, 0) /
            allSuggestions.length
          : 0;

      return {
        icd10Suggestions,
        cptSuggestions,
        documentation,
        confidenceScore,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new AIServiceError(
        `Failed to suggest codes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CODING_SUGGESTION_FAILED',
        undefined,
        undefined,
        { originalError: error }
      );
    }
  }

  private async suggestICD10Codes(
    clinicalText: string,
    encounterType: string,
    chiefComplaint: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<CodingSuggestion[]> {
    try {
      const prompt = fillPromptTemplate(ICD10_SUGGESTION, {
        clinicalText,
        encounterType,
        chiefComplaint,
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are an expert medical coder specializing in ICD-10-CM. Provide accurate, specific code suggestions based on clinical documentation. Always code to the highest level of specificity supported by documentation.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2, // Low temperature for consistent coding
          maxTokens: 2000,
        },
        auditContext
      );

      return this.parseICD10Response(response.content);
    } catch (error) {
      console.error('Failed to suggest ICD-10 codes:', error);
      return [];
    }
  }

  private async suggestCPTCodes(
    clinicalText: string,
    encounterType: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<CodingSuggestion[]> {
    try {
      const prompt = fillPromptTemplate(CPT_SUGGESTION, {
        clinicalText,
        encounterType,
        procedures: '[Extracted from clinical text]',
        timeSpent: '[If documented in clinical text]',
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are an expert medical coder specializing in CPT coding. Provide accurate procedure code suggestions based on clinical documentation. Consider E&M levels, procedures, and time-based coding as appropriate.',
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

      return this.parseCPTResponse(response.content);
    } catch (error) {
      console.error('Failed to suggest CPT codes:', error);
      return [];
    }
  }

  private async generateDocumentationRecommendations(
    clinicalText: string,
    suggestions: CodingSuggestion[],
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<string[]> {
    try {
      const codes = suggestions.map(s => `${s.code}: ${s.description}`).join('\n');

      const prompt = `Based on the following clinical documentation and suggested codes, identify key documentation elements that should be present to support these codes.

Clinical Text:
${clinicalText}

Suggested Codes:
${codes}

List 3-5 specific documentation elements that:
1. Support the suggested codes
2. May be missing or could be more specific
3. Would improve coding accuracy and compliance

Format as brief, actionable recommendations.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation improvement specialist. Provide specific, actionable documentation recommendations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          maxTokens: 500,
        },
        auditContext
      );

      return response.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-*•]\d+\.\s*/, ''))
        .filter(line => line.length > 10)
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to generate documentation recommendations:', error);
      return [];
    }
  }

  private parseICD10Response(content: string): CodingSuggestion[] {
    const suggestions: CodingSuggestion[] = [];
    const codePattern = /([A-Z]\d{2}\.?\d*)/g;
    const lines = content.split('\n');

    let currentSuggestion: Partial<CodingSuggestion> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for code patterns
      const codeMatch = trimmed.match(/^(?:Code:|ICD-10:|)\s*([A-Z]\d{2}\.?\d*)/i);
      if (codeMatch) {
        // Save previous suggestion
        if (currentSuggestion?.code) {
          suggestions.push(this.completeCodingSuggestion(currentSuggestion, 'icd10'));
        }

        currentSuggestion = {
          type: 'icd10',
          code: codeMatch[1],
          supportingEvidence: [],
        };
        continue;
      }

      if (currentSuggestion) {
        // Look for description
        if (
          trimmed.match(/^(?:Description:|Desc:)/i) &&
          !currentSuggestion.description
        ) {
          currentSuggestion.description = trimmed
            .replace(/^(?:Description:|Desc:)\s*/i, '')
            .trim();
        }

        // Look for confidence
        if (trimmed.match(/^(?:Confidence:|Conf:)/i) && !currentSuggestion.confidence) {
          const confMatch = trimmed.match(/(high|moderate|low)/i);
          if (confMatch) {
            currentSuggestion.confidence =
              confMatch[1].toLowerCase() === 'high' ? 0.9 :
              confMatch[1].toLowerCase() === 'moderate' ? 0.7 :
              0.5;
          }
        }

        // Look for reasoning
        if (
          trimmed.match(/^(?:Reasoning:|Rationale:|Supporting Evidence:)/i) &&
          !currentSuggestion.reasoning
        ) {
          currentSuggestion.reasoning = trimmed
            .replace(/^(?:Reasoning:|Rationale:|Supporting Evidence:)\s*/i, '')
            .trim();
        }
      }
    }

    // Save last suggestion
    if (currentSuggestion?.code) {
      suggestions.push(this.completeCodingSuggestion(currentSuggestion, 'icd10'));
    }

    return suggestions;
  }

  private parseCPTResponse(content: string): CodingSuggestion[] {
    const suggestions: CodingSuggestion[] = [];
    const lines = content.split('\n');

    let currentSuggestion: Partial<CodingSuggestion> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for CPT code patterns (5-digit codes)
      const codeMatch = trimmed.match(/^(?:Code:|CPT:|)\s*(\d{5})/i);
      if (codeMatch) {
        // Save previous suggestion
        if (currentSuggestion?.code) {
          suggestions.push(this.completeCodingSuggestion(currentSuggestion, 'cpt'));
        }

        currentSuggestion = {
          type: 'cpt',
          code: codeMatch[1],
          supportingEvidence: [],
        };
        continue;
      }

      if (currentSuggestion) {
        // Look for description
        if (
          trimmed.match(/^(?:Description:|Desc:)/i) &&
          !currentSuggestion.description
        ) {
          currentSuggestion.description = trimmed
            .replace(/^(?:Description:|Desc:)\s*/i, '')
            .trim();
        }

        // Look for confidence
        if (trimmed.match(/^(?:Confidence:|Conf:)/i) && !currentSuggestion.confidence) {
          const confMatch = trimmed.match(/(high|moderate|low)/i);
          if (confMatch) {
            currentSuggestion.confidence =
              confMatch[1].toLowerCase() === 'high' ? 0.9 :
              confMatch[1].toLowerCase() === 'moderate' ? 0.7 :
              0.5;
          }
        }

        // Look for reasoning
        if (
          trimmed.match(/^(?:Reasoning:|Rationale:|Supporting Evidence:)/i) &&
          !currentSuggestion.reasoning
        ) {
          currentSuggestion.reasoning = trimmed
            .replace(/^(?:Reasoning:|Rationale:|Supporting Evidence:)\s*/i, '')
            .trim();
        }
      }
    }

    // Save last suggestion
    if (currentSuggestion?.code) {
      suggestions.push(this.completeCodingSuggestion(currentSuggestion, 'cpt'));
    }

    return suggestions;
  }

  private completeCodingSuggestion(
    partial: Partial<CodingSuggestion>,
    type: 'icd10' | 'cpt'
  ): CodingSuggestion {
    return {
      type,
      code: partial.code || '',
      description: partial.description || 'Description not provided',
      confidence: partial.confidence || 0.7,
      reasoning: partial.reasoning || 'Based on clinical documentation',
      supportingEvidence: partial.supportingEvidence || [],
      alternatives: partial.alternatives,
    };
  }

  async validateCodes(
    codes: string[],
    clinicalText: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<
    Array<{
      code: string;
      supported: boolean;
      confidence: number;
      reasoning: string;
    }>
  > {
    try {
      const prompt = `Validate the following medical codes against the clinical documentation.

Clinical Documentation:
${clinicalText}

Codes to Validate:
${codes.join(', ')}

For each code, determine:
1. Is it supported by the documentation? (Yes/No)
2. Confidence level (0.0 to 1.0)
3. Brief reasoning

Format as: CODE | Supported: Yes/No | Confidence: X.X | Reasoning: [text]`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a medical coding validator. Assess whether codes are supported by documentation.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          maxTokens: 1000,
        },
        auditContext
      );

      // Parse validation results
      return codes.map(code => {
        const codeLine = response.content
          .split('\n')
          .find(line => line.includes(code));

        if (!codeLine) {
          return {
            code,
            supported: false,
            confidence: 0.5,
            reasoning: 'Unable to validate',
          };
        }

        const supported = /supported:\s*yes/i.test(codeLine);
        const confMatch = codeLine.match(/confidence:\s*([\d.]+)/i);
        const confidence = confMatch ? parseFloat(confMatch[1]) : 0.5;
        const reasonMatch = codeLine.match(/reasoning:\s*(.+?)(?:\||$)/i);
        const reasoning = reasonMatch ? reasonMatch[1].trim() : 'No reasoning provided';

        return {
          code,
          supported,
          confidence,
          reasoning,
        };
      });
    } catch (error) {
      console.error('Failed to validate codes:', error);
      return codes.map(code => ({
        code,
        supported: false,
        confidence: 0,
        reasoning: 'Validation failed',
      }));
    }
  }
}

// Factory function
export function createCodingAssistant(llmService: LLMService): CodingAssistant {
  return new CodingAssistant(llmService);
}
