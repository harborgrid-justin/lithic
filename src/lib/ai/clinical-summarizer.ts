/**
 * Clinical Note Summarization Service
 * AI-powered summarization of clinical documentation
 *
 * HIPAA Compliant: PHI handling with audit trail
 */

import { LLMService } from './llm-service';
import {
  ClinicalNote,
  ClinicalSummary,
  SummarizationRequest,
  AIServiceError,
} from '@/types/ai';
import {
  CLINICAL_SUMMARY_BRIEF,
  CLINICAL_SUMMARY_DETAILED,
  fillPromptTemplate,
} from './prompts/clinical-prompts';

export class ClinicalSummarizer {
  constructor(private llmService: LLMService) {}

  async summarizeNote(
    request: SummarizationRequest,
    auditContext?: {
      userId: string;
      userRole: string;
    }
  ): Promise<ClinicalSummary> {
    try {
      const { note, format = 'brief', focus = [] } = request;

      // Select appropriate prompt template
      const template =
        format === 'detailed'
          ? CLINICAL_SUMMARY_DETAILED
          : CLINICAL_SUMMARY_BRIEF;

      // Build the prompt
      const userPrompt = fillPromptTemplate(template, {
        noteContent: this.formatNoteContent(note),
      });

      // Add focus areas if specified
      const focusAddendum = focus.length > 0
        ? `\n\nPay special attention to these areas: ${focus.join(', ')}`
        : '';

      // Generate summary
      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical documentation specialist with expertise in medical summarization. Provide accurate, concise summaries while maintaining clinical accuracy.',
            },
            {
              role: 'user',
              content: userPrompt + focusAddendum,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent output
          maxTokens: format === 'detailed' ? 1000 : 300,
        },
        auditContext
          ? {
              ...auditContext,
              patientId: note.patientId,
              encounterId: note.encounterId,
            }
          : undefined
      );

      // Parse the response to extract structured information
      const summary = this.parseSummaryResponse(
        response.content,
        note,
        format
      );

      return {
        ...summary,
        generatedAt: new Date(),
        model: response.model,
      };
    } catch (error) {
      throw new AIServiceError(
        `Failed to summarize clinical note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SUMMARIZATION_FAILED',
        undefined,
        undefined,
        { originalError: error }
      );
    }
  }

  async extractKeyFindings(
    note: ClinicalNote,
    auditContext?: {
      userId: string;
      userRole: string;
    }
  ): Promise<string[]> {
    try {
      const prompt = `Extract the key clinical findings from this note. List only the most important findings (maximum 5).

Clinical Note:
${this.formatNoteContent(note)}

Provide findings as a simple bullet list, one finding per line, without numbers or markdown.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical assistant. Extract key findings accurately and concisely.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          maxTokens: 300,
        },
        auditContext
          ? {
              ...auditContext,
              patientId: note.patientId,
              encounterId: note.encounterId,
            }
          : undefined
      );

      // Parse bullet points
      return response.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-*•]\s*/, ''))
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to extract key findings:', error);
      return [];
    }
  }

  async identifyCriticalAlerts(
    note: ClinicalNote,
    auditContext?: {
      userId: string;
      userRole: string;
    }
  ): Promise<string[]> {
    try {
      const prompt = `Identify any critical findings or safety alerts in this clinical note that require immediate attention.

Clinical Note:
${this.formatNoteContent(note)}

List only CRITICAL findings that require immediate action. If none, respond with "None".
Format as bullet points.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical safety system. Identify only truly critical findings requiring immediate attention.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1, // Very low temperature for safety-critical task
          maxTokens: 200,
        },
        auditContext
          ? {
              ...auditContext,
              patientId: note.patientId,
              encounterId: note.encounterId,
            }
          : undefined
      );

      if (
        response.content.toLowerCase().includes('none') ||
        response.content.toLowerCase().includes('no critical')
      ) {
        return [];
      }

      return response.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-*•]\s*/, ''));
    } catch (error) {
      console.error('Failed to identify critical alerts:', error);
      return [];
    }
  }

  async generateActionItems(
    note: ClinicalNote,
    auditContext?: {
      userId: string;
      userRole: string;
    }
  ): Promise<string[]> {
    try {
      const prompt = `Based on this clinical note, list the action items and follow-up tasks (maximum 5).

Clinical Note:
${this.formatNoteContent(note)}

Focus on:
- Follow-up appointments
- Tests/procedures to schedule
- Medication changes to implement
- Patient education needed
- Referrals to make

Format as concise action items, one per line.`;

      const response = await this.llmService.generateResponse(
        {
          messages: [
            {
              role: 'system',
              content:
                'You are a clinical care coordinator. Extract actionable next steps from clinical notes.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          maxTokens: 300,
        },
        auditContext
          ? {
              ...auditContext,
              patientId: note.patientId,
              encounterId: note.encounterId,
            }
          : undefined
      );

      return response.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-*•]\s*/, ''))
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to generate action items:', error);
      return [];
    }
  }

  private formatNoteContent(note: ClinicalNote): string {
    let content = '';

    if (note.type === 'soap') {
      content += note.subjective ? `Subjective: ${note.subjective}\n\n` : '';
      content += note.objective ? `Objective: ${note.objective}\n\n` : '';
      content += note.assessment ? `Assessment: ${note.assessment}\n\n` : '';
      content += note.plan ? `Plan: ${note.plan}\n\n` : '';
    }

    content += note.content;

    return content;
  }

  private parseSummaryResponse(
    content: string,
    note: ClinicalNote,
    format: string
  ): Omit<ClinicalSummary, 'generatedAt' | 'model'> {
    // For brief format, the entire response is the summary
    if (format === 'brief') {
      return {
        noteId: note.id,
        summary: content.trim(),
        keyFindings: [],
        actionItems: [],
        criticalAlerts: [],
        confidence: 0.85,
      };
    }

    // For detailed format, try to parse structured sections
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = 'summary';
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for section headers
      if (trimmed.match(/^\*\*(.+?):\*\*$/)) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = trimmed
          .replace(/\*\*/g, '')
          .replace(':', '')
          .toLowerCase()
          .replace(/\s+/g, '_');
        currentContent = [];
      } else if (trimmed) {
        currentContent.push(trimmed);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return {
      noteId: note.id,
      summary: sections.summary || content,
      keyFindings: this.extractBulletPoints(
        sections.key_findings || sections.findings || ''
      ),
      actionItems: this.extractBulletPoints(sections.plan || ''),
      criticalAlerts: this.extractBulletPoints(
        sections.critical_alerts || sections.alerts || ''
      ),
      confidence: 0.85,
    };
  }

  private extractBulletPoints(text: string): string[] {
    if (!text) return [];

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-*•]\s*/, ''))
      .filter(line => line.length > 3); // Filter out very short items
  }
}

// Factory function
export function createClinicalSummarizer(
  llmService: LLMService
): ClinicalSummarizer {
  return new ClinicalSummarizer(llmService);
}
