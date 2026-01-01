/**
 * Webhooks API
 * Manage webhook subscriptions and deliveries
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { webhookManager } from '@/lib/webhooks/manager';
import {
  WebhookRegistrationSchema,
  WebhookUpdateSchema,
  generateWebhookSecret,
  testWebhookEndpoint,
  webhookRateLimiter,
} from '@/lib/webhooks/validators';

/**
 * GET /api/webhooks
 * List all webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const webhookId = searchParams.get('id');

    if (webhookId) {
      const webhook = webhookManager.get(webhookId);
      if (!webhook) {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(webhook);
    }

    const webhooks = webhookManager.list();
    return NextResponse.json({
      webhooks,
      total: webhooks.length,
    });
  } catch (error) {
    console.error('GET /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Register a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = WebhookRegistrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { url, events, secret, headers, retryPolicy } = validation.data;

    // Generate secret if not provided
    const webhookSecret = secret || generateWebhookSecret();

    // Register webhook
    const webhook = webhookManager.register({
      url,
      events,
      secret: webhookSecret,
      headers,
      retryPolicy,
      active: true,
    });

    return NextResponse.json(
      {
        webhook,
        message: 'Webhook registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/webhooks/:id
 * Update webhook configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = WebhookUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Update webhook
    const updated = webhookManager.update(webhookId, validation.data);

    if (!updated) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      webhook: updated,
      message: 'Webhook updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const deleted = webhookManager.unregister(webhookId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/webhooks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/test
 * Test a webhook endpoint
 */
export async function testWebhook(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      webhookId: z.string().optional(),
      url: z.string().url().optional(),
      secret: z.string().optional(),
    });

    const { webhookId, url, secret } = schema.parse(body);

    let testUrl: string;
    let testSecret: string;

    if (webhookId) {
      const webhook = webhookManager.get(webhookId);
      if (!webhook) {
        return NextResponse.json(
          { error: 'Webhook not found' },
          { status: 404 }
        );
      }
      testUrl = webhook.url;
      testSecret = webhook.secret;
    } else if (url && secret) {
      testUrl = url;
      testSecret = secret;
    } else {
      return NextResponse.json(
        { error: 'Either webhookId or (url and secret) must be provided' },
        { status: 400 }
      );
    }

    const result = await testWebhookEndpoint({
      url: testUrl,
      secret: testSecret,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/webhooks/test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/deliveries
 * Get webhook deliveries
 */
export async function getDeliveries(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const webhookId = searchParams.get('webhookId');
    const deliveryId = searchParams.get('deliveryId');

    if (deliveryId) {
      const delivery = webhookManager.getDelivery(deliveryId);
      if (!delivery) {
        return NextResponse.json(
          { error: 'Delivery not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(delivery);
    }

    if (webhookId) {
      const deliveries = webhookManager.getDeliveries(webhookId);
      return NextResponse.json({
        deliveries,
        total: deliveries.length,
      });
    }

    return NextResponse.json(
      { error: 'Either webhookId or deliveryId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/webhooks/deliveries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/deliveries/:id/retry
 * Retry a failed delivery
 */
export async function retryDelivery(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const deliveryId = searchParams.get('deliveryId');

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Delivery ID is required' },
        { status: 400 }
      );
    }

    const success = await webhookManager.retryDelivery(deliveryId);

    if (!success) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Delivery retry scheduled',
    });
  } catch (error) {
    console.error('POST /api/webhooks/deliveries/retry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/rate-limit
 * Check rate limit status for a webhook
 */
export async function getRateLimit(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const webhookId = searchParams.get('webhookId');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    const remaining = webhookRateLimiter.getRemaining(webhookId);
    const canSend = webhookRateLimiter.canSend(webhookId);

    return NextResponse.json({
      webhookId,
      remaining,
      canSend,
      limit: 100, // Default limit
      window: 60000, // 1 minute window
    });
  } catch (error) {
    console.error('GET /api/webhooks/rate-limit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/emit
 * Emit an event (for testing/manual triggers)
 */
export async function emitEvent(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      type: z.string(),
      data: z.any(),
      metadata: z.record(z.any()).optional(),
    });

    const event = schema.parse(body);

    const eventId = await webhookManager.emit(event);

    return NextResponse.json({
      eventId,
      message: 'Event emitted successfully',
    });
  } catch (error) {
    console.error('POST /api/webhooks/emit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
