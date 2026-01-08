/**
 * Medical Coding Suggestions API Route
 * POST /api/ai/suggest-codes
 *
 * Compliance: Advisory tool - requires professional coder review
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/lib/ai/llm-service';
import { createCodingAssistant } from '@/lib/ai/coding-assistant';
import { CodingRequest, AIServiceError } from '@/types/ai';

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userLimit.count >= 15) {
    return false;
  }

  userLimit.count++;
  return true;
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
    const {
      clinicalText,
      encounterType,
      chiefComplaint,
      existingCodes = [],
      codingType = 'both',
    } = body;

    if (!clinicalText || clinicalText.length < 20) {
      return NextResponse.json(
        { error: 'Clinical text must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Initialize services
    const llmService = LLMService.create({
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    });

    const codingAssistant = createCodingAssistant(llmService);

    // Build request
    const codingRequest: CodingRequest = {
      clinicalText,
      encounterType,
      chiefComplaint,
      existingCodes,
      codingType,
    };

    // Get coding suggestions
    const codingResponse = await codingAssistant.suggestCodes(
      codingRequest,
      {
        userId,
        userRole,
        patientId: body.patientId,
        encounterId: body.encounterId,
      }
    );

    // Return response
    return NextResponse.json({
      success: true,
      ...codingResponse,
      disclaimer:
        'AI suggestions are advisory only. Professional coder review required.',
    });
  } catch (error) {
    console.error('Coding suggestion API error:', error);

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
        error: 'Failed to generate coding suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Validation endpoint
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const userRole = request.headers.get('x-user-role') || 'user';

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { codes, clinicalText } = body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: 'Codes array is required' },
        { status: 400 }
      );
    }

    if (!clinicalText) {
      return NextResponse.json(
        { error: 'Clinical text is required' },
        { status: 400 }
      );
    }

    const llmService = LLMService.create({
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    });

    const codingAssistant = createCodingAssistant(llmService);

    const validationResults = await codingAssistant.validateCodes(
      codes,
      clinicalText,
      {
        userId,
        userRole,
        patientId: body.patientId,
        encounterId: body.encounterId,
      }
    );

    return NextResponse.json({
      success: true,
      validations: validationResults,
    });
  } catch (error) {
    console.error('Code validation API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to validate codes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id, x-user-role',
      },
    }
  );
}
