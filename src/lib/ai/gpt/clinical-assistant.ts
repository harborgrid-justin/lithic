/**
 * Clinical AI Assistant
 *
 * Main clinical AI assistant class providing:
 * - Context-aware documentation help
 * - Differential diagnosis suggestions
 * - Treatment plan recommendations
 * - Clinical decision support
 *
 * @module ai/gpt/clinical-assistant
 */

import { GPTClient, ChatMessage, CompletionOptions } from './client';
import {
  CLINICAL_ASSISTANT_SYSTEM_PROMPT,
  buildClinicalPrompt,
  validatePromptSafety,
  CLINICAL_TEMPLATES,
  ClinicalTemplateType,
} from './prompts';
import { SafetyLayer, SafetyCheckResult } from './safety-layer';

/**
 * Clinical context for AI assistant
 */
export interface ClinicalContext {
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  chiefComplaint?: string;
  activeProblems?: string[];
  currentMedications?: string[];
  allergies?: string[];
  recentLabs?: Record<string, unknown>;
  recentVitals?: Record<string, unknown>;
  specialty?: string;
}

/**
 * Assistant request
 */
export interface AssistantRequest {
  query: string;
  context?: ClinicalContext;
  templateType?: ClinicalTemplateType;
  conversationHistory?: ChatMessage[];
  options?: CompletionOptions;
}

/**
 * Assistant response
 */
export interface AssistantResponse {
  content: string;
  safetyCheck: SafetyCheckResult;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  metadata: {
    model: string;
    timestamp: string;
    processingTimeMs: number;
  };
}

/**
 * SOAP note generation parameters
 */
export interface SOAPNoteParams {
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    reviewOfSystems?: string;
  };
  objective: {
    vitalSigns?: Record<string, string>;
    physicalExam: string;
    labResults?: string;
    imagingResults?: string;
  };
  patientContext?: ClinicalContext;
}

/**
 * Medication reconciliation parameters
 */
export interface MedReconciliationParams {
  previousMedications: Array<{
    name: string;
    dose: string;
    frequency: string;
    route?: string;
  }>;
  currentMedications: Array<{
    name: string;
    dose: string;
    frequency: string;
    route?: string;
  }>;
  patientConditions: string[];
  allergies: string[];
}

/**
 * Differential diagnosis parameters
 */
export interface DifferentialDiagnosisParams {
  chiefComplaint: string;
  history: string;
  examFindings: string;
  diagnosticResults?: string;
  patientContext?: ClinicalContext;
}

/**
 * Clinical AI Assistant
 *
 * Enterprise clinical AI assistant with safety features,
 * context awareness, and specialized medical knowledge.
 */
export class ClinicalAssistant {
  private client: GPTClient;
  private safetyLayer: SafetyLayer;

  constructor(client: GPTClient) {
    this.client = client;
    this.safetyLayer = new SafetyLayer();
  }

  /**
   * Process a general clinical query
   *
   * @param request - Assistant request with query and context
   * @returns Assistant response with safety checks
   */
  async processQuery(request: AssistantRequest): Promise<AssistantResponse> {
    const startTime = Date.now();

    // Validate input safety
    const inputSafety = validatePromptSafety(request.query);
    if (!inputSafety.safe) {
      throw new Error(
        `Input contains potential PHI: ${inputSafety.warnings.join(', ')}`
      );
    }

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: CLINICAL_ASSISTANT_SYSTEM_PROMPT },
    ];

    // Add conversation history if provided
    if (request.conversationHistory) {
      messages.push(...request.conversationHistory);
    }

    // Add context if provided
    if (request.context) {
      const contextMessage = this.buildContextMessage(request.context);
      messages.push({ role: 'system', content: contextMessage });
    }

    // Add user query
    messages.push({ role: 'user', content: request.query });

    // Call GPT API
    const { content, usage } = await this.client.createChatCompletion(
      messages,
      {
        model: request.options?.model || 'gpt-4-turbo',
        temperature: request.options?.temperature || 0.7,
        maxTokens: request.options?.maxTokens || 2000,
      }
    );

    // Run safety checks on output
    const safetyCheck = await this.safetyLayer.checkOutput(content);

    const processingTimeMs = Date.now() - startTime;

    return {
      content,
      safetyCheck,
      usage,
      metadata: {
        model: request.options?.model || 'gpt-4-turbo',
        timestamp: new Date().toISOString(),
        processingTimeMs,
      },
    };
  }

  /**
   * Generate a SOAP note
   *
   * @param params - SOAP note parameters
   * @returns Generated SOAP note
   */
  async generateSOAPNote(params: SOAPNoteParams): Promise<AssistantResponse> {
    const clinicalInfo = this.formatSOAPInfo(params);

    const prompt = buildClinicalPrompt(CLINICAL_TEMPLATES.soapNote, {
      clinical_info: clinicalInfo,
    });

    return this.processQuery({
      query: prompt,
      context: params.patientContext,
      options: { temperature: 0.5 }, // Lower temperature for more consistent formatting
    });
  }

  /**
   * Perform medication reconciliation
   *
   * @param params - Medication reconciliation parameters
   * @returns Reconciliation analysis
   */
  async reconcileMedications(
    params: MedReconciliationParams
  ): Promise<AssistantResponse> {
    const previousMeds = params.previousMedications
      .map(m => `- ${m.name} ${m.dose} ${m.frequency} ${m.route || 'PO'}`)
      .join('\n');

    const currentMeds = params.currentMedications
      .map(m => `- ${m.name} ${m.dose} ${m.frequency} ${m.route || 'PO'}`)
      .join('\n');

    const conditions = params.patientConditions.join(', ');

    const prompt = buildClinicalPrompt(CLINICAL_TEMPLATES.medReconciliation, {
      conditions,
      previous_meds: previousMeds,
      current_meds: currentMeds,
    });

    return this.processQuery({
      query: prompt,
      options: { temperature: 0.3 }, // Very low temperature for accuracy
    });
  }

  /**
   * Generate differential diagnosis
   *
   * @param params - Differential diagnosis parameters
   * @returns Differential diagnosis list
   */
  async generateDifferentialDiagnosis(
    params: DifferentialDiagnosisParams
  ): Promise<AssistantResponse> {
    const prompt = buildClinicalPrompt(CLINICAL_TEMPLATES.differential, {
      chief_complaint: params.chiefComplaint,
      history: params.history,
      exam_findings: params.examFindings,
      diagnostic_results: params.diagnosticResults || 'None available',
    });

    return this.processQuery({
      query: prompt,
      context: params.patientContext,
      options: { temperature: 0.7 },
    });
  }

  /**
   * Generate treatment plan
   *
   * @param condition - Condition to treat
   * @param context - Patient context
   * @returns Treatment plan recommendations
   */
  async generateTreatmentPlan(
    condition: string,
    context: ClinicalContext
  ): Promise<AssistantResponse> {
    const prompt = buildClinicalPrompt(CLINICAL_TEMPLATES.treatmentPlan, {
      condition,
      patient_context: this.formatContext(context),
      current_medications: context.currentMedications?.join(', ') || 'None',
      allergies: context.allergies?.join(', ') || 'NKDA',
    });

    return this.processQuery({
      query: prompt,
      context,
      options: { temperature: 0.6 },
    });
  }

  /**
   * Summarize clinical documents
   *
   * @param documents - Medical records to summarize
   * @param context - Patient context
   * @returns Clinical summary
   */
  async summarizeDocuments(
    documents: string,
    context?: ClinicalContext
  ): Promise<AssistantResponse> {
    const prompt = buildClinicalPrompt(CLINICAL_TEMPLATES.clinicalSummary, {
      medical_records: documents,
    });

    return this.processQuery({
      query: prompt,
      context,
      options: { temperature: 0.5, maxTokens: 1000 },
    });
  }

  /**
   * Extract clinical entities from text
   *
   * @param text - Clinical text to analyze
   * @returns Structured entities
   */
  async extractEntities(text: string): Promise<AssistantResponse> {
    const prompt = buildClinicalPrompt(CLINICAL_TEMPLATES.entityExtraction, {
      clinical_text: text,
    });

    return this.processQuery({
      query: prompt,
      options: { temperature: 0.2 }, // Very low for structured extraction
    });
  }

  /**
   * Answer clinical question
   *
   * @param question - Clinical question
   * @param context - Additional context
   * @returns Evidence-based answer
   */
  async answerClinicalQuestion(
    question: string,
    context?: string
  ): Promise<AssistantResponse> {
    const prompt = buildClinicalPrompt(CLINICAL_TEMPLATES.clinicalQA, {
      question,
      context: context || 'General clinical practice',
    });

    return this.processQuery({
      query: prompt,
      options: { temperature: 0.6 },
    });
  }

  /**
   * Stream responses for real-time UI updates
   *
   * @param request - Assistant request
   * @param onChunk - Callback for each content chunk
   * @returns Complete response with safety checks
   */
  async streamQuery(
    request: AssistantRequest,
    onChunk: (chunk: string) => void
  ): Promise<AssistantResponse> {
    const startTime = Date.now();

    // Validate input
    const inputSafety = validatePromptSafety(request.query);
    if (!inputSafety.safe) {
      throw new Error(
        `Input contains potential PHI: ${inputSafety.warnings.join(', ')}`
      );
    }

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: CLINICAL_ASSISTANT_SYSTEM_PROMPT },
    ];

    if (request.conversationHistory) {
      messages.push(...request.conversationHistory);
    }

    if (request.context) {
      const contextMessage = this.buildContextMessage(request.context);
      messages.push({ role: 'system', content: contextMessage });
    }

    messages.push({ role: 'user', content: request.query });

    // Stream completion
    const { content, usage } = await this.client.createStreamingCompletion(
      messages,
      {
        model: request.options?.model || 'gpt-4-turbo',
        temperature: request.options?.temperature || 0.7,
        maxTokens: request.options?.maxTokens || 2000,
      },
      onChunk
    );

    // Safety check on complete output
    const safetyCheck = await this.safetyLayer.checkOutput(content);

    const processingTimeMs = Date.now() - startTime;

    return {
      content,
      safetyCheck,
      usage,
      metadata: {
        model: request.options?.model || 'gpt-4-turbo',
        timestamp: new Date().toISOString(),
        processingTimeMs,
      },
    };
  }

  /**
   * Build context message from clinical context
   */
  private buildContextMessage(context: ClinicalContext): string {
    const parts: string[] = ['PATIENT CONTEXT (De-identified):'];

    if (context.patientAge) {
      parts.push(`- Age: ${context.patientAge} years`);
    }

    if (context.patientGender) {
      parts.push(`- Gender: ${context.patientGender}`);
    }

    if (context.specialty) {
      parts.push(`- Specialty: ${context.specialty}`);
    }

    if (context.chiefComplaint) {
      parts.push(`- Chief Complaint: ${context.chiefComplaint}`);
    }

    if (context.activeProblems?.length) {
      parts.push(`- Active Problems: ${context.activeProblems.join(', ')}`);
    }

    if (context.currentMedications?.length) {
      parts.push(
        `- Current Medications: ${context.currentMedications.join(', ')}`
      );
    }

    if (context.allergies?.length) {
      parts.push(`- Allergies: ${context.allergies.join(', ')}`);
    } else {
      parts.push('- Allergies: NKDA');
    }

    return parts.join('\n');
  }

  /**
   * Format SOAP note information
   */
  private formatSOAPInfo(params: SOAPNoteParams): string {
    const parts: string[] = [];

    parts.push('SUBJECTIVE:');
    parts.push(`Chief Complaint: ${params.subjective.chiefComplaint}`);
    parts.push(`HPI: ${params.subjective.historyOfPresentIllness}`);
    if (params.subjective.reviewOfSystems) {
      parts.push(`ROS: ${params.subjective.reviewOfSystems}`);
    }
    parts.push('');

    parts.push('OBJECTIVE:');
    if (params.objective.vitalSigns) {
      parts.push('Vital Signs:');
      Object.entries(params.objective.vitalSigns).forEach(([key, value]) => {
        parts.push(`  ${key}: ${value}`);
      });
    }
    parts.push(`Physical Exam: ${params.objective.physicalExam}`);
    if (params.objective.labResults) {
      parts.push(`Lab Results: ${params.objective.labResults}`);
    }
    if (params.objective.imagingResults) {
      parts.push(`Imaging: ${params.objective.imagingResults}`);
    }

    return parts.join('\n');
  }

  /**
   * Format clinical context as string
   */
  private formatContext(context: ClinicalContext): string {
    const parts: string[] = [];

    if (context.patientAge && context.patientGender) {
      parts.push(
        `${context.patientAge}-year-old ${context.patientGender} patient`
      );
    }

    if (context.activeProblems?.length) {
      parts.push(`Active problems: ${context.activeProblems.join(', ')}`);
    }

    return parts.join('. ') || 'No additional context provided';
  }
}

/**
 * Create a singleton clinical assistant instance
 */
let assistantInstance: ClinicalAssistant | null = null;

export function getClinicalAssistant(client: GPTClient): ClinicalAssistant {
  if (!assistantInstance) {
    assistantInstance = new ClinicalAssistant(client);
  }
  return assistantInstance;
}
