/**
 * Clinical Text Classifier
 *
 * Classification system for clinical notes:
 * - Note type classification (Progress, H&P, Consult, etc.)
 * - Urgency detection
 * - Sentiment analysis for patient feedback
 * - Specialty routing
 * - Completeness scoring
 *
 * @module ai/nlp/text-classifier
 */

import { GPTClient, ChatMessage } from '../gpt/client';

/**
 * Note type classification
 */
export type NoteType =
  | 'progress_note'
  | 'history_and_physical'
  | 'consultation'
  | 'procedure_note'
  | 'discharge_summary'
  | 'operative_note'
  | 'admission_note'
  | 'emergency_note'
  | 'radiology_report'
  | 'pathology_report'
  | 'other';

/**
 * Medical specialty
 */
export type MedicalSpecialty =
  | 'internal_medicine'
  | 'cardiology'
  | 'pulmonology'
  | 'neurology'
  | 'psychiatry'
  | 'surgery'
  | 'orthopedics'
  | 'emergency_medicine'
  | 'pediatrics'
  | 'obstetrics_gynecology'
  | 'radiology'
  | 'pathology'
  | 'anesthesiology'
  | 'general';

/**
 * Urgency level
 */
export type UrgencyLevel = 'routine' | 'urgent' | 'emergent' | 'critical';

/**
 * Classification result
 */
export interface ClassificationResult {
  noteType: NoteType;
  specialty: MedicalSpecialty;
  urgencyLevel: UrgencyLevel;
  confidence: number;
  keywords: string[];
  topics: string[];
  completenessScore: number;
  missingElements: string[];
  sentiment?: {
    score: number; // -1 to 1
    label: 'negative' | 'neutral' | 'positive';
  };
}

/**
 * Clinical Text Classifier
 *
 * Multi-class classifier for clinical documentation
 */
export class ClinicalTextClassifier {
  private client: GPTClient;

  // Keyword patterns for quick classification
  private noteTypeKeywords = {
    progress_note: ['progress', 'follow-up', 'interval', 'visit'],
    history_and_physical: ['history and physical', 'h&p', 'admission history'],
    consultation: ['consult', 'consultation', 'recommendations'],
    procedure_note: ['procedure', 'performed', 'complications'],
    discharge_summary: ['discharge', 'hospital course', 'discharge disposition'],
    operative_note: ['operative', 'operation', 'surgery', 'incision', 'closure'],
    admission_note: ['admission', 'admitted', 'chief complaint'],
    emergency_note: ['emergency', 'ed note', 'triage'],
  };

  private urgencyKeywords = {
    critical: ['code blue', 'cardiac arrest', 'unresponsive', 'acute mi', 'stroke'],
    emergent: ['emergent', 'stat', 'immediate', 'urgent', 'critical'],
    urgent: ['concern', 'worrisome', 'requires attention', 'follow up soon'],
  };

  constructor(client: GPTClient) {
    this.client = client;
  }

  /**
   * Classify clinical note
   *
   * @param text - Clinical note text
   * @returns Classification result
   */
  async classifyNote(text: string): Promise<ClassificationResult> {
    // Quick keyword-based pre-classification
    const quickClassification = this.quickClassify(text);

    // Use GPT-4 for comprehensive classification
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a clinical note classification system. Analyze the note and return JSON:

{
  "noteType": "progress_note|history_and_physical|consultation|procedure_note|discharge_summary|operative_note|admission_note|emergency_note|radiology_report|pathology_report|other",
  "specialty": "internal_medicine|cardiology|pulmonology|neurology|psychiatry|surgery|orthopedics|emergency_medicine|pediatrics|obstetrics_gynecology|radiology|pathology|anesthesiology|general",
  "urgencyLevel": "routine|urgent|emergent|critical",
  "confidence": 0.0-1.0,
  "keywords": ["key", "words"],
  "topics": ["main", "topics"],
  "completenessScore": 0-100,
  "missingElements": ["missing", "sections"]
}`,
      },
      {
        role: 'user',
        content: `Classify this clinical note:\n\n${text.slice(0, 2000)}`, // Limit text length
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.2,
        maxTokens: 500,
      });

      const classification = JSON.parse(content);

      return {
        noteType: classification.noteType || quickClassification.noteType,
        specialty: classification.specialty || 'general',
        urgencyLevel: classification.urgencyLevel || quickClassification.urgencyLevel,
        confidence: classification.confidence || 0.5,
        keywords: classification.keywords || [],
        topics: classification.topics || [],
        completenessScore: classification.completenessScore || 0,
        missingElements: classification.missingElements || [],
      };
    } catch {
      // Fallback to quick classification
      return {
        ...quickClassification,
        keywords: [],
        topics: [],
        completenessScore: 0,
        missingElements: [],
      };
    }
  }

  /**
   * Detect urgency level from text
   *
   * @param text - Clinical text
   * @returns Urgency level with confidence
   */
  async detectUrgency(text: string): Promise<{
    level: UrgencyLevel;
    confidence: number;
    reasons: string[];
  }> {
    const lowerText = text.toLowerCase();
    const reasons: string[] = [];

    // Check critical keywords
    for (const keyword of this.urgencyKeywords.critical) {
      if (lowerText.includes(keyword)) {
        reasons.push(`Critical keyword: "${keyword}"`);
        return { level: 'critical', confidence: 0.95, reasons };
      }
    }

    // Check emergent keywords
    for (const keyword of this.urgencyKeywords.emergent) {
      if (lowerText.includes(keyword)) {
        reasons.push(`Emergent keyword: "${keyword}"`);
      }
    }
    if (reasons.length > 0) {
      return { level: 'emergent', confidence: 0.85, reasons };
    }

    // Check urgent keywords
    for (const keyword of this.urgencyKeywords.urgent) {
      if (lowerText.includes(keyword)) {
        reasons.push(`Urgent keyword: "${keyword}"`);
      }
    }
    if (reasons.length > 0) {
      return { level: 'urgent', confidence: 0.7, reasons };
    }

    // Use GPT for nuanced assessment
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Assess the urgency level of this clinical note.

Return JSON:
{
  "level": "routine|urgent|emergent|critical",
  "confidence": 0.0-1.0,
  "reasons": ["reason1", "reason2"]
}

Consider:
- Critical: Life-threatening, immediate intervention needed
- Emergent: Serious condition, intervention within hours
- Urgent: Needs attention within 24-48 hours
- Routine: Standard follow-up`,
      },
      {
        role: 'user',
        content: text.slice(0, 1000),
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.1,
        maxTokens: 200,
      });

      const result = JSON.parse(content);
      return {
        level: result.level || 'routine',
        confidence: result.confidence || 0.5,
        reasons: result.reasons || ['No specific urgency indicators'],
      };
    } catch {
      return {
        level: 'routine',
        confidence: 0.5,
        reasons: ['Unable to assess urgency'],
      };
    }
  }

  /**
   * Analyze sentiment (useful for patient feedback)
   *
   * @param text - Text to analyze
   * @returns Sentiment analysis
   */
  async analyzeSentiment(text: string): Promise<{
    score: number;
    label: 'negative' | 'neutral' | 'positive';
    aspects: Array<{ aspect: string; sentiment: string }>;
  }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Analyze sentiment of patient feedback or clinical communication.

Return JSON:
{
  "score": -1.0 to 1.0,
  "label": "negative|neutral|positive",
  "aspects": [
    {"aspect": "aspect name", "sentiment": "description"}
  ]
}`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 300,
      });

      const result = JSON.parse(content);
      return {
        score: result.score || 0,
        label: result.label || 'neutral',
        aspects: result.aspects || [],
      };
    } catch {
      return {
        score: 0,
        label: 'neutral',
        aspects: [],
      };
    }
  }

  /**
   * Extract key topics from clinical text
   *
   * @param text - Clinical text
   * @param maxTopics - Maximum number of topics to return
   * @returns List of topics
   */
  async extractTopics(text: string, maxTopics: number = 5): Promise<string[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Extract the main clinical topics from this text.

Return a JSON array of topics (max ${maxTopics}):
["topic1", "topic2", "topic3"]

Topics should be:
- Clinical conditions or symptoms
- Procedures or interventions
- Medications or treatments
- Diagnostic findings`,
      },
      {
        role: 'user',
        content: text.slice(0, 1500),
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.2,
        maxTokens: 200,
      });

      const topics = JSON.parse(content);
      return Array.isArray(topics) ? topics.slice(0, maxTopics) : [];
    } catch {
      return [];
    }
  }

  /**
   * Assess note completeness
   *
   * @param text - Clinical note
   * @param noteType - Type of note
   * @returns Completeness score and missing elements
   */
  async assessCompleteness(
    text: string,
    noteType: NoteType
  ): Promise<{
    score: number;
    missingElements: string[];
    requiredElements: string[];
  }> {
    const requiredElements = this.getRequiredElements(noteType);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Assess completeness of this ${noteType} note.

Required elements: ${requiredElements.join(', ')}

Return JSON:
{
  "score": 0-100,
  "missingElements": ["element1", "element2"],
  "requiredElements": ["all", "required", "elements"]
}`,
      },
      {
        role: 'user',
        content: text,
      },
    ];

    try {
      const { content } = await this.client.createChatCompletion(messages, {
        temperature: 0.1,
        maxTokens: 300,
      });

      const result = JSON.parse(content);
      return {
        score: result.score || 0,
        missingElements: result.missingElements || [],
        requiredElements: requiredElements,
      };
    } catch {
      return {
        score: 0,
        missingElements: requiredElements,
        requiredElements,
      };
    }
  }

  /**
   * Quick classification using keyword matching
   */
  private quickClassify(text: string): {
    noteType: NoteType;
    urgencyLevel: UrgencyLevel;
    confidence: number;
  } {
    const lowerText = text.toLowerCase();

    // Determine note type
    let noteType: NoteType = 'other';
    let maxScore = 0;

    Object.entries(this.noteTypeKeywords).forEach(([type, keywords]) => {
      const score = keywords.filter(kw => lowerText.includes(kw)).length;
      if (score > maxScore) {
        maxScore = score;
        noteType = type as NoteType;
      }
    });

    // Determine urgency
    let urgencyLevel: UrgencyLevel = 'routine';

    if (this.urgencyKeywords.critical.some(kw => lowerText.includes(kw))) {
      urgencyLevel = 'critical';
    } else if (this.urgencyKeywords.emergent.some(kw => lowerText.includes(kw))) {
      urgencyLevel = 'emergent';
    } else if (this.urgencyKeywords.urgent.some(kw => lowerText.includes(kw))) {
      urgencyLevel = 'urgent';
    }

    return {
      noteType,
      urgencyLevel,
      confidence: maxScore > 0 ? 0.7 : 0.3,
    };
  }

  /**
   * Get required elements for note type
   */
  private getRequiredElements(noteType: NoteType): string[] {
    const elements: Record<NoteType, string[]> = {
      progress_note: [
        'Subjective',
        'Objective',
        'Assessment',
        'Plan',
        'Provider signature',
      ],
      history_and_physical: [
        'Chief complaint',
        'History of present illness',
        'Past medical history',
        'Medications',
        'Allergies',
        'Social history',
        'Physical exam',
        'Assessment and plan',
      ],
      consultation: [
        'Reason for consultation',
        'History',
        'Physical exam',
        'Recommendations',
      ],
      procedure_note: [
        'Procedure performed',
        'Indication',
        'Technique',
        'Findings',
        'Complications',
      ],
      discharge_summary: [
        'Admission date',
        'Discharge date',
        'Admission diagnosis',
        'Discharge diagnosis',
        'Hospital course',
        'Discharge medications',
        'Follow-up plan',
      ],
      operative_note: [
        'Pre-operative diagnosis',
        'Post-operative diagnosis',
        'Procedure',
        'Surgeon',
        'Findings',
        'Complications',
      ],
      admission_note: [
        'Chief complaint',
        'History',
        'Physical exam',
        'Assessment',
        'Admission orders',
      ],
      emergency_note: [
        'Chief complaint',
        'Triage level',
        'History',
        'Exam',
        'Workup',
        'Disposition',
      ],
      radiology_report: ['Indication', 'Technique', 'Findings', 'Impression'],
      pathology_report: ['Specimen', 'Gross description', 'Microscopic', 'Diagnosis'],
      other: ['Content'],
    };

    return elements[noteType] || [];
  }
}

/**
 * Create singleton classifier instance
 */
let classifierInstance: ClinicalTextClassifier | null = null;

export function getTextClassifier(client: GPTClient): ClinicalTextClassifier {
  if (!classifierInstance) {
    classifierInstance = new ClinicalTextClassifier(client);
  }
  return classifierInstance;
}
