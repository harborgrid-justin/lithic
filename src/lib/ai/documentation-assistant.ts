/**
 * Clinical Documentation AI Assistant
 * Real-time documentation assistance and suggestions
 *
 * HIPAA Compliant: Secure processing of clinical documentation
 */

import { LLMService } from './llm-service';
import {
  DocumentationRequest,
  DocumentationResponse,
  DocumentationSuggestion,
  AIServiceError,
} from '@/types/ai';
import {
  SOAP_NOTE_GENERATION,
  HPI_GENERATOR,
  DOCUMENTATION_ENHANCEMENT,
  fillPromptTemplate,
} from './prompts/clinical-prompts';

export class DocumentationAssistant {
  constructor(private llmService: LLMService) {}

  async getSuggestions(
    request: DocumentationRequest,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DocumentationResponse> {
    try {
      const {
        context,
        existingText = '',
        chiefComplaint = '',
        vitalSigns = {},
        symptoms = [],
        findings = [],
        userInput = '',
      } = request;

      const suggestions: DocumentationSuggestion[] = [];
      const warnings: string[] = [];

      // Generate context-specific suggestions
      switch (context) {
        case 'soap':
          const soapSuggestions = await this.generateSOAPSuggestions(
            existingText,
            chiefComplaint,
            symptoms,
            findings,
            vitalSigns,
            auditContext
          );
          suggestions.push(...soapSuggestions);
          break;

        case 'history':
          const hpiSuggestion = await this.generateHPI(
            chiefComplaint,
            symptoms,
            auditContext
          );
          if (hpiSuggestion) suggestions.push(hpiSuggestion);
          break;

        case 'assessment':
          const assessmentSuggestions = await this.generateAssessmentSuggestions(
            existingText,
            symptoms,
            findings,
            auditContext
          );
          suggestions.push(...assessmentSuggestions);
          break;

        case 'plan':
          const planSuggestions = await this.generatePlanSuggestions(
            existingText,
            chiefComplaint,
            findings,
            auditContext
          );
          suggestions.push(...planSuggestions);
          break;

        case 'physical':
          const physicalSuggestions = await this.generatePhysicalExamSuggestions(
            chiefComplaint,
            findings,
            auditContext
          );
          suggestions.push(...physicalSuggestions);
          break;
      }

      // If user provided specific input, generate completion suggestions
      if (userInput) {
        const completionSuggestion = await this.generateCompletion(
          userInput,
          context,
          existingText,
          auditContext
        );
        if (completionSuggestion) {
          suggestions.unshift(completionSuggestion); // Add at beginning
        }
      }

      // Check for documentation quality warnings
      if (existingText) {
        const qualityWarnings = this.checkDocumentationQuality(
          existingText,
          context
        );
        warnings.push(...qualityWarnings);
      }

      return {
        suggestions,
        warnings: warnings.length > 0 ? warnings : undefined,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new AIServiceError(
        `Failed to generate documentation suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DOCUMENTATION_ASSISTANCE_FAILED',
        undefined,
        undefined,
        { originalError: error }
      );
    }
  }

  private async generateSOAPSuggestions(
    existingText: string,
    chiefComplaint: string,
    symptoms: string[],
    findings: string[],
    vitalSigns: Record<string, string | number>,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DocumentationSuggestion[]> {
    try {
      const clinicalInfo = `
Chief Complaint: ${chiefComplaint}
Symptoms: ${symptoms.join(', ')}
Vital Signs: ${JSON.stringify(vitalSigns)}
Findings: ${findings.join(', ')}
Current Documentation: ${existingText}
      `.trim();

      const prompt = fillPromptTemplate(SOAP_NOTE_GENERATION, {
        clinicalInfo,
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation assistant. Generate structured SOAP note suggestions.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          maxTokens: 1500,
        },
        auditContext
      );

      // Parse SOAP sections
      const sections = this.parseSOAPSections(response.content);

      return Object.entries(sections).map(([section, content]) => ({
        section: section.toUpperCase(),
        content,
        type: 'template' as const,
        confidence: 0.8,
        reasoning: `Generated ${section} section based on provided clinical information`,
      }));
    } catch (error) {
      console.error('Failed to generate SOAP suggestions:', error);
      return [];
    }
  }

  private async generateHPI(
    chiefComplaint: string,
    symptoms: string[],
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DocumentationSuggestion | null> {
    try {
      const prompt = fillPromptTemplate(HPI_GENERATOR, {
        chiefComplaint,
        patientInfo: 'Patient presents with chief complaint',
        symptoms: symptoms.join(', '),
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation specialist. Generate comprehensive HPI documentation.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          maxTokens: 800,
        },
        auditContext
      );

      return {
        section: 'History of Present Illness',
        content: response.content.trim(),
        type: 'template',
        confidence: 0.85,
        reasoning: 'Generated comprehensive HPI from clinical data',
      };
    } catch (error) {
      console.error('Failed to generate HPI:', error);
      return null;
    }
  }

  private async generateAssessmentSuggestions(
    existingText: string,
    symptoms: string[],
    findings: string[],
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DocumentationSuggestion[]> {
    try {
      const prompt = `Based on the following clinical information, suggest an assessment section for the clinical note.

Symptoms: ${symptoms.join(', ')}
Findings: ${findings.join(', ')}
Current Assessment: ${existingText || 'None documented'}

Provide a clinical assessment that includes:
1. Primary diagnosis or working diagnosis
2. Differential diagnoses to consider
3. Relevant clinical reasoning
4. Severity/acuity level

Format as a professional assessment section.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation assistant. Generate evidence-based assessment documentation.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          maxTokens: 600,
        },
        auditContext
      );

      return [
        {
          section: 'Assessment',
          content: response.content.trim(),
          type: 'enhancement',
          confidence: 0.75,
          reasoning: 'Generated based on clinical symptoms and findings',
        },
      ];
    } catch (error) {
      console.error('Failed to generate assessment suggestions:', error);
      return [];
    }
  }

  private async generatePlanSuggestions(
    existingText: string,
    chiefComplaint: string,
    findings: string[],
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DocumentationSuggestion[]> {
    try {
      const prompt = `Based on the clinical presentation, suggest a treatment plan section.

Chief Complaint: ${chiefComplaint}
Clinical Findings: ${findings.join(', ')}
Current Plan: ${existingText || 'None documented'}

Suggest a comprehensive plan including:
1. Medications/treatments
2. Diagnostic tests or imaging
3. Follow-up timing
4. Patient education topics
5. Specialist referrals if needed
6. Return precautions

Format as a structured plan section.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation assistant. Generate comprehensive treatment plans.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          maxTokens: 700,
        },
        auditContext
      );

      return [
        {
          section: 'Plan',
          content: response.content.trim(),
          type: 'enhancement',
          confidence: 0.75,
          reasoning: 'Generated evidence-based treatment plan',
        },
      ];
    } catch (error) {
      console.error('Failed to generate plan suggestions:', error);
      return [];
    }
  }

  private async generatePhysicalExamSuggestions(
    chiefComplaint: string,
    findings: string[],
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DocumentationSuggestion[]> {
    try {
      const prompt = `Based on the chief complaint, suggest relevant physical exam documentation.

Chief Complaint: ${chiefComplaint}
Current Findings: ${findings.join(', ')}

Suggest:
1. Relevant physical exam systems to document
2. Key findings to look for
3. Standard documentation format

Focus on exam elements pertinent to the chief complaint.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation assistant. Suggest relevant physical exam documentation.',
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

      return [
        {
          section: 'Physical Exam',
          content: response.content.trim(),
          type: 'template',
          confidence: 0.8,
          reasoning: 'Suggested exam elements based on chief complaint',
        },
      ];
    } catch (error) {
      console.error('Failed to generate physical exam suggestions:', error);
      return [];
    }
  }

  private async generateCompletion(
    userInput: string,
    context: string,
    existingText: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<DocumentationSuggestion | null> {
    try {
      const prompt = `The user is documenting the ${context} section and has typed: "${userInput}"

Existing documentation: ${existingText || 'None'}

Provide a brief, professional completion suggestion (1-2 sentences) that:
1. Continues naturally from the user's input
2. Uses appropriate medical terminology
3. Is clinically relevant
4. Follows standard documentation practices

Provide only the completion text, no explanations.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation assistant. Provide natural, professional documentation completions.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          maxTokens: 150,
        },
        auditContext
      );

      return {
        section: context,
        content: response.content.trim(),
        type: 'completion',
        confidence: 0.7,
      };
    } catch (error) {
      console.error('Failed to generate completion:', error);
      return null;
    }
  }

  private parseSOAPSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const sectionPattern = /\*\*([A-Z]+(?:\s+[A-Z]+)?):\*\*\s*\n([\s\S]*?)(?=\n\*\*[A-Z]+|\n*$)/g;

    let match;
    while ((match = sectionPattern.exec(content)) !== null) {
      const sectionName = match[1].toLowerCase().replace(/\s+/g, '_');
      const sectionContent = match[2].trim();
      if (sectionContent) {
        sections[sectionName] = sectionContent;
      }
    }

    return sections;
  }

  private checkDocumentationQuality(
    text: string,
    context: string
  ): string[] {
    const warnings: string[] = [];

    // Check length
    if (text.length < 50) {
      warnings.push('Documentation may be too brief for complete clinical record');
    }

    // Check for vague language
    const vagueTerms = ['some', 'few', 'several', 'unremarkable', 'wnl'];
    const lowerText = text.toLowerCase();
    const foundVague = vagueTerms.filter(term => lowerText.includes(term));
    if (foundVague.length > 2) {
      warnings.push('Consider using more specific language to improve documentation clarity');
    }

    // Context-specific checks
    if (context === 'assessment' && !lowerText.includes('diagnosis')) {
      warnings.push('Assessment should include diagnosis or working diagnosis');
    }

    if (context === 'plan' && !lowerText.includes('follow')) {
      warnings.push('Plan should include follow-up instructions');
    }

    return warnings;
  }

  async enhanceDocumentation(
    currentDoc: string,
    context: string,
    auditContext?: {
      userId: string;
      userRole: string;
      patientId?: string;
      encounterId?: string;
    }
  ): Promise<{
    enhancedText: string;
    suggestions: string[];
  }> {
    try {
      const prompt = fillPromptTemplate(DOCUMENTATION_ENHANCEMENT, {
        currentDoc,
        context,
      });

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation improvement specialist. Enhance documentation quality while maintaining accuracy.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          maxTokens: 1000,
        },
        auditContext
      );

      // Parse suggestions from response
      const suggestions = response.content
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .map(line => line.replace(/^[-*•]\s*|\d+\.\s*/, '').trim())
        .filter(line => line.length > 10);

      return {
        enhancedText: currentDoc, // Keep original unless explicitly replacing
        suggestions: suggestions.slice(0, 5),
      };
    } catch (error) {
      console.error('Failed to enhance documentation:', error);
      return {
        enhancedText: currentDoc,
        suggestions: [],
      };
    }
  }
}

// Factory function
export function createDocumentationAssistant(
  llmService: LLMService
): DocumentationAssistant {
  return new DocumentationAssistant(llmService);
}
