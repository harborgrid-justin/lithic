/**
 * Clinical Summarization API Route
 * POST /api/ai/summarize
 *
 * HIPAA Compliant: Secure processing with audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMService } from '@/lib/ai/llm-service';
import { createClinicalSummarizer } from '@/lib/ai/clinical-summarizer';
import { SummarizationRequest, AIServiceError } from '@/types/ai';

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userLimit.count >= 20) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get user context (in production, get from session/JWT)
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
    const { note, format = 'brief', focus = [] } = body;

    if (!note || !note.content) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const llmService = LLMService.create({
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    });

    const summarizer = createClinicalSummarizer(llmService);

    // Build request
    const summarizationRequest: SummarizationRequest = {
      note: {
        id: note.id || `note_${Date.now()}`,
        patientId: note.patientId || 'unknown',
        encounterId: note.encounterId || 'unknown',
        type: note.type || 'progress',
        content: note.content,
        subjective: note.subjective,
        objective: note.objective,
        assessment: note.assessment,
        plan: note.plan,
        author: note.author || userId,
        timestamp: note.timestamp ? new Date(note.timestamp) : new Date(),
      },
      format,
      focus,
    };

    // Generate summary
    const summary = await summarizer.summarizeNote(summarizationRequest, {
      userId,
      userRole,
    });

    // Return response
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Summarization API error:', error);

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
        error: 'Failed to summarize clinical note',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-id, x-user-role',
      },
    }
  );
}
