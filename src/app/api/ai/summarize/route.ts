/**
 * AI Summarization API Route
 *
 * Clinical document summarization endpoint
 *
 * @route POST /api/ai/summarize
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getGPTClient } from '@/lib/ai/gpt/client';
import { getSummarizer } from '@/lib/ai/nlp/summarizer';

/**
 * Request schema
 */
const SummarizeRequestSchema = z.object({
  documents: z.union([z.string(), z.array(z.string())]),
  type: z.enum(['brief', 'detailed', 'executive', 'patient_friendly']).default('brief'),
  maxLength: z.number().min(50).max(1000).default(250),
  focusAreas: z.array(z.string()).optional(),
  excludeAreas: z.array(z.string()).optional(),
  includeTimeline: z.boolean().default(false),
  includeKeyFindings: z.boolean().default(true),
});

type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;

/**
 * POST /api/ai/summarize
 *
 * Summarize clinical documents
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validatedRequest = SummarizeRequestSchema.parse(body);

    // Get AI client and summarizer
    const client = getGPTClient();
    const summarizer = getSummarizer(client);

    // Generate summary
    const result = await summarizer.summarize(validatedRequest.documents, {
      type: validatedRequest.type,
      maxLength: validatedRequest.maxLength,
      focusAreas: validatedRequest.focusAreas,
      excludeAreas: validatedRequest.excludeAreas,
      includeTimeline: validatedRequest.includeTimeline,
      includeKeyFindings: validatedRequest.includeKeyFindings,
    });

    // Log usage
    console.log('[AI Summarize] Usage:', {
      userId: session.user.id,
      documentCount: result.metadata.documentsProcessed,
      summaryType: result.metadata.summaryType,
    });

    return NextResponse.json({
      summary: result.summary,
      keyFindings: result.keyFindings,
      timeline: result.timeline,
      confidence: result.confidence,
      wordCount: result.wordCount,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[AI Summarize] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/summarize
 */
export async function GET() {
  return NextResponse.json({
    service: 'Clinical Document Summarization',
    version: '1.0.0',
    supportedTypes: ['brief', 'detailed', 'executive', 'patient_friendly'],
  });
}
