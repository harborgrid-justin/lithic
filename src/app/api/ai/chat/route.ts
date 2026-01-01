/**
 * AI Chat API Route
 *
 * GPT-4 powered clinical chat endpoint
 *
 * @route POST /api/ai/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getGPTClient } from '@/lib/ai/gpt/client';
import { getClinicalAssistant } from '@/lib/ai/gpt/clinical-assistant';
import type { ChatMessage } from '@/lib/ai/gpt/client';

/**
 * Request schema
 */
const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  context: z
    .object({
      patientAge: z.number().optional(),
      patientGender: z.enum(['male', 'female', 'other']).optional(),
      chiefComplaint: z.string().optional(),
      activeProblems: z.array(z.string()).optional(),
      currentMedications: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      specialty: z.string().optional(),
    })
    .optional(),
  stream: z.boolean().default(false),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(2000),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * POST /api/ai/chat
 *
 * Send message to clinical AI assistant
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
    const validatedRequest = ChatRequestSchema.parse(body);

    // Get AI client and assistant
    const client = getGPTClient();
    const assistant = getClinicalAssistant(client);

    // Extract last user message
    const lastMessage =
      validatedRequest.messages[validatedRequest.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Get conversation history (exclude last message)
    const conversationHistory = validatedRequest.messages.slice(
      0,
      -1
    ) as ChatMessage[];

    // Handle streaming
    if (validatedRequest.stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            await assistant.streamQuery(
              {
                query: lastMessage.content,
                context: validatedRequest.context,
                conversationHistory,
                options: {
                  temperature: validatedRequest.temperature,
                  maxTokens: validatedRequest.maxTokens,
                },
              },
              (chunk: string) => {
                // Send chunk to client
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
                );
              }
            );

            // Send completion signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const response = await assistant.processQuery({
      query: lastMessage.content,
      context: validatedRequest.context,
      conversationHistory,
      options: {
        temperature: validatedRequest.temperature,
        maxTokens: validatedRequest.maxTokens,
      },
    });

    // Log usage for billing/monitoring
    console.log('[AI Chat] Usage:', {
      userId: session.user.id,
      tokens: response.usage.totalTokens,
      cost: response.usage.estimatedCost,
    });

    return NextResponse.json({
      message: response.content,
      usage: response.usage,
      safetyCheck: response.safetyCheck,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('[AI Chat] Error:', error);

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
 * GET /api/ai/chat
 *
 * Get API info (optional)
 */
export async function GET() {
  return NextResponse.json({
    service: 'Clinical AI Chat',
    version: '1.0.0',
    capabilities: ['clinical_documentation', 'differential_diagnosis', 'treatment_plans'],
  });
}
