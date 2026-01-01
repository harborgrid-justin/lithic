/**
 * Clinical Document Summarizer
 *
 * Advanced summarization for clinical documents:
 * - Multi-document summarization
 * - Key findings extraction
 * - Timeline generation
 * - Abstractive and extractive summarization
 *
 * @module ai/nlp/summarizer
 */

import { GPTClient, ChatMessage } from '../gpt/client';

/**
 * Summary type
 */
export type SummaryType = 'brief' | 'detailed' | 'executive' | 'patient_friendly';

/**
 * Summary options
 */
export interface SummaryOptions {
  type?: SummaryType;
  maxLength?: number; // in words
  focusAreas?: string[]; // specific areas to emphasize
  excludeAreas?: string[]; // areas to exclude
  includeTimeline?: boolean;
  includeKeyFindings?: boolean;
}

/**
 * Summary result
 */
export interface SummaryResult {
  summary: string;
  keyFindings?: string[];
  timeline?: TimelineEvent[];
  confidence: number;
  wordCount: number;
  metadata: {
    documentsProcessed: number;
    summaryType: SummaryType;
    processingTimeMs: number;
  };
}

/**
 * Timeline event
 */
export interface TimelineEvent {
  date: string;
  event: string;
  category: 'diagnosis' | 'procedure' | 'medication' | 'lab' | 'visit' | 'other';
  significance: 'high' | 'medium' | 'low';
}

/**
 * Key finding
 */
export interface KeyFinding {
  finding: string;
  category: 'critical' | 'abnormal' | 'normal' | 'pending';
  source: string;
  date?: string;
}

/**
 * Clinical Document Summarizer
 *
 * Intelligent summarization with context awareness
 */
export class ClinicalSummarizer {
  private client: GPTClient;

  constructor(client: GPTClient) {
    this.client = client;
  }

  /**
   * Summarize clinical document(s)
   *
   * @param documents - Document text or array of documents
   * @param options - Summary options
   * @returns Summary result
   */
  async summarize(
    documents: string | string[],
    options: SummaryOptions = {}
  ): Promise<SummaryResult> {
    const startTime = Date.now();

    const {
      type = 'brief',
      maxLength = 250,
      focusAreas,
      excludeAreas,
      includeTimeline = false,
      includeKeyFindings = true,
    } = options;

    // Combine documents if array
    const fullText = Array.isArray(documents) ? documents.join('\n\n---\n\n') : documents;
    const documentCount = Array.isArray(documents) ? documents.length : 1;

    // Build summary prompt
    const prompt = this.buildSummaryPrompt(
      fullText,
      type,
      maxLength,
      focusAreas,
      excludeAreas
    );

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.getSummarySystemPrompt(type),
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Generate summary
    const { content } = await this.client.createChatCompletion(messages, {
      temperature: 0.5,
      maxTokens: Math.ceil(maxLength * 1.5), // Account for tokens vs words
    });

    // Extract key findings if requested
    let keyFindings: string[] | undefined;
    if (includeKeyFindings) {
      keyFindings = await this.extractKeyFindings(fullText);
    }

    // Generate timeline if requested
    let timeline: TimelineEvent[] | undefined;
    if (includeTimeline) {
      timeline = await this.generateTimeline(fullText);
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      summary: content,
      keyFindings,
      timeline,
      confidence: this.assessSummaryConfidence(content, fullText),
      wordCount: this.countWords(content),
      metadata: {
        documentsProcessed: documentCount,
        summaryType: type,
        processingTimeMs,
      },
    };
  }

  /**
   * Extract key findings from clinical text
   *
   * @param text - Clinical text
   * @returns Array of key findings
   */
  async extractKeyFindings(text: string): Promise<string[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Extract the most important clinical findings from this text.

Return a JSON array of findings (max 7):
["finding1", "finding2", "finding3"]

Focus on:
- Critical or abnormal findings
- New diagnoses
- Significant test results
- Important clinical decisions`,
      },
      {
        role: 'user',
        content: text.slice(0, 3000),
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 400,
      });

      const findings = JSON.parse(content);
      return Array.isArray(findings) ? findings : [];
    } catch {
      return [];
    }
  }

  /**
   * Generate clinical timeline
   *
   * @param text - Clinical text
   * @returns Timeline of events
   */
  async generateTimeline(text: string): Promise<TimelineEvent[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Generate a chronological timeline of clinical events.

Return JSON array:
[
  {
    "date": "YYYY-MM-DD or relative time",
    "event": "event description",
    "category": "diagnosis|procedure|medication|lab|visit|other",
    "significance": "high|medium|low"
  }
]

Order chronologically from earliest to latest.`,
      },
      {
        role: 'user',
        content: text.slice(0, 3000),
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.2,
        maxTokens: 600,
      });

      const timeline = JSON.parse(content);
      return Array.isArray(timeline) ? timeline : [];
    } catch {
      return [];
    }
  }

  /**
   * Summarize for patient (patient-friendly language)
   *
   * @param clinicalText - Clinical documentation
   * @param readingLevel - Target reading level (default: 8th grade)
   * @returns Patient-friendly summary
   */
  async summarizeForPatient(
    clinicalText: string,
    readingLevel: number = 8
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Convert clinical documentation to patient-friendly language.

Guidelines:
- Use simple, everyday words (${readingLevel}th grade reading level)
- Avoid medical jargon; explain terms when necessary
- Be clear and direct
- Use analogies when helpful
- Keep it concise but complete
- Be encouraging and supportive in tone`,
      },
      {
        role: 'user',
        content: `Convert this to patient-friendly language:\n\n${clinicalText}`,
      },
    ];

    const { content } = await this.client.createChatCompletion(messages, {
      temperature: 0.6,
      maxTokens: 800,
    });

    return content;
  }

  /**
   * Create discharge summary
   *
   * @param hospitalCourse - Hospital course text
   * @returns Structured discharge summary
   */
  async createDischargeSummary(hospitalCourse: string): Promise<{
    admissionDiagnosis: string;
    dischargeDiagnosis: string;
    hospitalCourseNarrative: string;
    procedures: string[];
    dischargeMedications: string[];
    followUpPlan: string[];
    patientInstructions: string[];
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Create a structured discharge summary.

Return JSON:
{
  "admissionDiagnosis": "",
  "dischargeDiagnosis": "",
  "hospitalCourseNarrative": "",
  "procedures": [],
  "dischargeMedications": [],
  "followUpPlan": [],
  "patientInstructions": []
}`,
      },
      {
        role: 'user',
        content: hospitalCourse,
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.4,
        maxTokens: 1500,
      });

      return JSON.parse(content);
    } catch {
      return {
        admissionDiagnosis: '',
        dischargeDiagnosis: '',
        hospitalCourseNarrative: '',
        procedures: [],
        dischargeMedications: [],
        followUpPlan: [],
        patientInstructions: [],
      };
    }
  }

  /**
   * Summarize multiple encounters into a patient summary
   *
   * @param encounters - Array of encounter notes
   * @returns Comprehensive patient summary
   */
  async summarizePatientHistory(encounters: string[]): Promise<string> {
    // If too many encounters, summarize in batches
    if (encounters.length > 10) {
      const batches = this.batchDocuments(encounters, 10);
      const batchSummaries = await Promise.all(
        batches.map(batch => this.summarize(batch, { type: 'brief' }))
      );

      // Summarize the summaries
      const combinedSummaries = batchSummaries.map(s => s.summary).join('\n\n');
      const finalSummary = await this.summarize(combinedSummaries, {
        type: 'detailed',
        maxLength: 500,
      });

      return finalSummary.summary;
    }

    const result = await this.summarize(encounters, {
      type: 'detailed',
      maxLength: 500,
      includeTimeline: true,
      includeKeyFindings: true,
    });

    return result.summary;
  }

  /**
   * Extract action items from clinical text
   *
   * @param text - Clinical text
   * @returns List of action items
   */
  async extractActionItems(text: string): Promise<Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    deadline?: string;
    assignedTo?: string;
  }>> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Extract action items from clinical documentation.

Return JSON array:
[
  {
    "action": "description",
    "priority": "high|medium|low",
    "deadline": "timeframe if mentioned",
    "assignedTo": "role or person if mentioned"
  }
]

Look for:
- Orders placed
- Follow-up appointments
- Pending tests
- Specialist referrals
- Patient education needed`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.2,
        maxTokens: 600,
      });

      const actions = JSON.parse(content);
      return Array.isArray(actions) ? actions : [];
    } catch {
      return [];
    }
  }

  /**
   * Build summary prompt based on options
   */
  private buildSummaryPrompt(
    text: string,
    type: SummaryType,
    maxLength: number,
    focusAreas?: string[],
    excludeAreas?: string[]
  ): string {
    let prompt = `Summarize the following clinical documentation in approximately ${maxLength} words.\n\n`;

    if (focusAreas && focusAreas.length > 0) {
      prompt += `Focus particularly on: ${focusAreas.join(', ')}\n\n`;
    }

    if (excludeAreas && excludeAreas.length > 0) {
      prompt += `Exclude: ${excludeAreas.join(', ')}\n\n`;
    }

    // Truncate if too long
    const maxTextLength = 6000;
    if (text.length > maxTextLength) {
      prompt += text.slice(0, maxTextLength) + '\n\n[Text truncated for length]';
    } else {
      prompt += text;
    }

    return prompt;
  }

  /**
   * Get system prompt for summary type
   */
  private getSummarySystemPrompt(type: SummaryType): string {
    const prompts: Record<SummaryType, string> = {
      brief: `You are a clinical summarization system. Create concise, accurate summaries of clinical documents.

Focus on:
- Key diagnoses and problems
- Critical findings
- Current treatment plan
- Pending items

Use clear, professional medical language.`,

      detailed: `You are a clinical summarization system. Create comprehensive summaries of clinical documents.

Include:
- Complete problem list
- All significant findings
- Full medication list
- Treatment plans and rationale
- Follow-up plans
- Pending tests or consults

Organize logically by organ system or chronologically as appropriate.`,

      executive: `You are a clinical summarization system. Create executive summaries for healthcare leaders.

Focus on:
- High-level overview
- Key outcomes
- Resource utilization
- Quality metrics
- Risk factors

Use concise, business-oriented language while maintaining clinical accuracy.`,

      patient_friendly: `You are a clinical summarization system. Create patient-friendly summaries.

Guidelines:
- Use simple language (8th grade reading level)
- Explain medical terms
- Be clear and supportive
- Focus on what the patient needs to know
- Include action items for the patient

Avoid jargon and complex terminology.`,
    };

    return prompts[type];
  }

  /**
   * Assess confidence in summary quality
   */
  private assessSummaryConfidence(summary: string, originalText: string): number {
    let confidence = 100;

    // Penalize very short summaries
    const summaryWords = this.countWords(summary);
    if (summaryWords < 50) {
      confidence -= 20;
    }

    // Penalize if summary is almost as long as original
    const originalWords = this.countWords(originalText);
    if (summaryWords > originalWords * 0.8) {
      confidence -= 30;
    }

    // Check for common error patterns
    if (summary.includes('[INCOMPLETE]') || summary.includes('TODO')) {
      confidence -= 40;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Batch documents into groups
   */
  private batchDocuments(documents: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }
    return batches;
  }
}

/**
 * Create singleton summarizer instance
 */
let summarizerInstance: ClinicalSummarizer | null = null;

export function getSummarizer(client: GPTClient): ClinicalSummarizer {
  if (!summarizerInstance) {
    summarizerInstance = new ClinicalSummarizer(client);
  }
  return summarizerInstance;
}
