/**
 * Conversations API Routes
 * Handle conversation management
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Conversation creation schema
const createConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP', 'CHANNEL', 'CLINICAL_TEAM']),
  name: z.string().optional(),
  description: z.string().optional(),
  participantIds: z.array(z.string()).min(1),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/communication/conversations
 * Get user's conversations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'current-user-id';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // In production, fetch from database
    const conversations = [];

    return NextResponse.json({
      conversations,
      total: conversations.length,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communication/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createConversationSchema.parse(body);

    // In production, save to database
    const conversation = {
      id: `conv_${Date.now()}`,
      ...validated,
      participants: validated.participantIds.map((id) => ({
        userId: id,
        userName: 'User',
        joinedAt: new Date().toISOString(),
      })),
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communication/conversations/[id]
 * Update conversation settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, updates } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // In production, update in database
    const updatedConversation = {
      id: conversationId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
