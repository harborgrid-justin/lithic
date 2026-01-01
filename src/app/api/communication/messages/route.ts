/**
 * Messages API Routes
 * Handle message CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Message validation schema
const createMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO', 'SYSTEM', 'CLINICAL', 'URGENT']).optional(),
  metadata: z.record(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  mentions: z.array(z.string()).optional(),
  replyToId: z.string().optional(),
  threadId: z.string().optional(),
});

/**
 * GET /api/communication/messages
 * Get messages for a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // In production, fetch from database
    // For now, return mock data
    const messages = [];

    return NextResponse.json({
      messages,
      hasMore: false,
      total: messages.length,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communication/messages
 * Create a new message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createMessageSchema.parse(body);

    // In production, save to database and broadcast via WebSocket
    const message = {
      id: `msg_${Date.now()}`,
      ...validated,
      senderId: 'current-user-id', // Get from session
      senderName: 'Current User',
      status: 'SENT',
      encrypted: false,
      createdAt: new Date().toISOString(),
      readBy: [],
      reactions: [],
    };

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communication/messages/[id]
 * Update a message
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'messageId and content are required' },
        { status: 400 }
      );
    }

    // In production, update in database and broadcast via WebSocket
    const updatedMessage = {
      id: messageId,
      content,
      editedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communication/messages/[id]
 * Delete a message
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      );
    }

    // In production, soft delete in database and broadcast via WebSocket
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
