/**
 * General AI Assistance API Route
 * POST /api/ai/assist
 *
 * Multi-purpose AI endpoint for various clinical assistance tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/lib/ai/llm-service';
import { createClinicalSummarizer } from '@/lib/ai/clinical-summarizer';
import { createCodingAssistant } from '@/lib/ai/coding-assistant';
import { createDocumentationAssistant } from '@/lib/ai/documentation-assistant';
import { createDiagnosisSuggester } from '@/lib/ai/diagnosis-suggester';
import { createMedicationReconciliationAssistant } from '@/lib/ai/med-reconciliation';
import { createQualityGapDetector } from '@/lib/ai/quality-gap-detector';
import {
  AIAssistantRequest,
  AIServiceError,
  DocumentationRequest,
} from '@/types/ai';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userLimit.count >= 30) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Initialize LLM Service (singleton)
let llmService: LLMService | null = null;

function getLLMService(): LLMService {
  if (!llmService) {
    llmService = LLMService.create({
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    });
  }
  return llmService;
}

export async function POST(request: NextRequest) {
  try {
    // Get user context
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userRole = request.headers.get('x-user-role') || 'user';

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { mode, request: modeRequest, query, context } = body;

    // Route to appropriate handler based on mode
    switch (mode) {
      case 'general':
      case 'clinical':
        return await handleGeneralAssistance(
          query || modeRequest?.query,
          context || modeRequest?.context,
          userId,
          userRole
        );

      case 'documentation':
        return await handleDocumentationAssistance(
          modeRequest as DocumentationRequest,
          userId,
          userRole
        );

      case 'coding':
        return await handleCodingAssistance(modeRequest, userId, userRole);

      case 'diagnosis':
        return await handleDiagnosisAssistance(modeRequest, userId, userRole);

      case 'medication':
        return await handleMedicationReconciliation(
          modeRequest,
          userId,
          userRole
        );

      case 'quality':
        return await handleQualityGapDetection(modeRequest, userId, userRole);

      default:
        // Default to general assistance
        return await handleGeneralAssistance(
          query,
          context,
          userId,
          userRole
        );
    }
  } catch (error) {
    console.error('AI Assist API error:', error);

    if (error instanceof AIServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'AI assistance request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleGeneralAssistance(
  query: string,
  context: any,
  userId: string,
  userRole: string
) {
  if (!query) {
    return NextResponse.json(
      { error: 'Query is required' },
      { status: 400 }
    );
  }

  const service = getLLMService();

  // Build system prompt based on context
  const systemPrompt = `You are an AI clinical assistant helping healthcare professionals.
Current context: ${context?.section || 'general clinical assistance'}
Patient ID: ${context?.patientId || 'not specified'}
Encounter ID: ${context?.encounterId || 'not specified'}

Provide accurate, evidence-based clinical information. Always remind users that your suggestions are advisory and require professional clinical judgment.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: query },
  ];

  const response = await service.generateResponse(
    { messages },
    { userId, userRole, patientId: context?.patientId }
  );

  return NextResponse.json({
    success: true,
    response: response.content,
    conversationId: `conv_${Date.now()}`,
    generatedAt: new Date(),
  });
}

async function handleDocumentationAssistance(
  docRequest: DocumentationRequest,
  userId: string,
  userRole: string
) {
  const service = getLLMService();
  const assistant = createDocumentationAssistant(service);

  const suggestions = await assistant.getSuggestions(docRequest, {
    userId,
    userRole,
    patientId: docRequest.chiefComplaint || undefined,
  });

  return NextResponse.json({
    success: true,
    suggestions: suggestions.suggestions,
    warnings: suggestions.warnings,
    generatedAt: suggestions.generatedAt,
  });
}

async function handleCodingAssistance(
  codingRequest: any,
  userId: string,
  userRole: string
) {
  const service = getLLMService();
  const assistant = createCodingAssistant(service);

  const response = await assistant.suggestCodes(codingRequest, {
    userId,
    userRole,
    patientId: codingRequest.patientId,
    encounterId: codingRequest.encounterId,
  });

  return NextResponse.json({
    success: true,
    ...response,
  });
}

async function handleDiagnosisAssistance(
  diagnosisRequest: any,
  userId: string,
  userRole: string
) {
  const service = getLLMService();
  const suggester = createDiagnosisSuggester(service);

  const response = await suggester.generateDifferential(
    diagnosisRequest.presentation || diagnosisRequest,
    {
      userId,
      userRole,
      patientId: diagnosisRequest.patientId,
      encounterId: diagnosisRequest.encounterId,
    }
  );

  return NextResponse.json({
    success: true,
    ...response,
    disclaimer:
      'Differential diagnosis suggestions are advisory. Clinical diagnosis must be made by licensed healthcare provider.',
  });
}

async function handleMedicationReconciliation(
  medRequest: any,
  userId: string,
  userRole: string
) {
  const service = getLLMService();
  const assistant = createMedicationReconciliationAssistant(service);

  const response = await assistant.reconcileMedications(medRequest, {
    userId,
    userRole,
    patientId: medRequest.patientId,
  });

  return NextResponse.json({
    success: true,
    ...response,
  });
}

async function handleQualityGapDetection(
  qualityRequest: any,
  userId: string,
  userRole: string
) {
  const service = getLLMService();
  const detector = createQualityGapDetector(service);

  const response = await detector.detectGaps(qualityRequest, {
    userId,
    userRole,
    patientId: qualityRequest.patientId,
  });

  return NextResponse.json({
    success: true,
    ...response,
  });
}

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id, x-user-role',
      },
    }
  );
}
