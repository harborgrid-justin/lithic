/**
 * Webhook Routes
 *
 * RESTful endpoints for webhook management
 */

import { Router, Request, Response } from "express";
import {
  webhookManager,
  WebhookEventType,
} from "../../integrations/webhooks/manager";
import {
  validateWebhookSubscription,
  validateWebhookURL,
  validateWebhookEvents,
  validateWebhookSecret,
  generateWebhookSecret,
  sanitizeWebhookURL,
  ValidationError,
} from "../../integrations/webhooks/validators";
import { logger } from "../../utils/logger";

const router = Router();

/**
 * POST /webhooks/subscriptions
 * Create a new webhook subscription
 */
router.post("/subscriptions", async (req: Request, res: Response) => {
  try {
    const {
      url,
      events,
      secret,
      headers,
      retryAttempts,
      timeout,
      active = true,
    } = req.body;

    // Validate subscription
    const validation = validateWebhookSubscription({
      url,
      events,
      secret,
      headers,
      retryAttempts,
      timeout,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: validation.errors,
      });
    }

    // Create subscription
    const subscription = webhookManager.subscribe({
      url,
      events,
      secret,
      headers,
      retryAttempts,
      timeout,
      active,
    });

    logger.info("Webhook subscription created", {
      id: subscription.id,
      url: sanitizeWebhookURL(url),
      events,
    });

    res.status(201).json({
      success: true,
      data: {
        ...subscription,
        secret: "***", // Hide secret in response
      },
    });
  } catch (error: any) {
    logger.error("Webhook subscription creation error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /webhooks/subscriptions
 * Get all webhook subscriptions
 */
router.get("/subscriptions", async (req: Request, res: Response) => {
  try {
    const subscriptions = webhookManager.getAllSubscriptions();

    // Hide secrets
    const sanitized = subscriptions.map((sub) => ({
      ...sub,
      secret: "***",
      url: sanitizeWebhookURL(sub.url),
    }));

    res.json({
      success: true,
      data: sanitized,
      total: sanitized.length,
    });
  } catch (error: any) {
    logger.error("Webhook subscriptions list error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /webhooks/subscriptions/:id
 * Get a specific webhook subscription
 */
router.get("/subscriptions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = webhookManager.getSubscription(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...subscription,
        secret: "***",
        url: sanitizeWebhookURL(subscription.url),
      },
    });
  } catch (error: any) {
    logger.error("Webhook subscription get error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * PATCH /webhooks/subscriptions/:id
 * Update a webhook subscription
 */
router.patch("/subscriptions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate updates if provided
    if (updates.url) {
      const urlValidation = validateWebhookURL(updates.url);
      if (!urlValidation.valid) {
        return res.status(400).json({
          success: false,
          error: "Invalid URL",
          errors: urlValidation.errors,
        });
      }
    }

    if (updates.events) {
      const eventsValidation = validateWebhookEvents(updates.events);
      if (!eventsValidation.valid) {
        return res.status(400).json({
          success: false,
          error: "Invalid events",
          errors: eventsValidation.errors,
        });
      }
    }

    if (updates.secret) {
      const secretValidation = validateWebhookSecret(updates.secret);
      if (!secretValidation.valid) {
        return res.status(400).json({
          success: false,
          error: "Invalid secret",
          errors: secretValidation.errors,
        });
      }
    }

    const subscription = webhookManager.updateSubscription(id, updates);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    logger.info("Webhook subscription updated", {
      id,
      updates: Object.keys(updates),
    });

    res.json({
      success: true,
      data: {
        ...subscription,
        secret: "***",
        url: sanitizeWebhookURL(subscription.url),
      },
    });
  } catch (error: any) {
    logger.error("Webhook subscription update error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * DELETE /webhooks/subscriptions/:id
 * Delete a webhook subscription
 */
router.delete("/subscriptions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = webhookManager.unsubscribe(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    logger.info("Webhook subscription deleted", { id });

    res.status(204).send();
  } catch (error: any) {
    logger.error("Webhook subscription deletion error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /webhooks/trigger
 * Manually trigger a webhook event (for testing)
 */
router.post("/trigger", async (req: Request, res: Response) => {
  try {
    const { event, data, metadata } = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        error: "Event type is required",
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        error: "Data is required",
      });
    }

    await webhookManager.trigger(event as WebhookEventType, data, metadata);

    logger.info("Webhook event triggered manually", { event });

    res.json({
      success: true,
      message: "Webhook event triggered",
    });
  } catch (error: any) {
    logger.error("Webhook trigger error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /webhooks/deliveries/:id
 * Get delivery information
 */
router.get("/deliveries/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const delivery = webhookManager.getDelivery(id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: "Delivery not found",
      });
    }

    res.json({
      success: true,
      data: delivery,
    });
  } catch (error: any) {
    logger.error("Webhook delivery get error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /webhooks/subscriptions/:id/deliveries
 * Get all deliveries for a subscription
 */
router.get(
  "/subscriptions/:id/deliveries",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 100, status } = req.query;

      let deliveries = webhookManager.getDeliveriesForSubscription(id);

      // Filter by status if provided
      if (status) {
        deliveries = deliveries.filter((d) => d.status === status);
      }

      // Limit results
      const limitNum = parseInt(limit as string, 10);
      deliveries = deliveries.slice(0, limitNum);

      res.json({
        success: true,
        data: deliveries,
        total: deliveries.length,
      });
    } catch (error: any) {
      logger.error("Webhook deliveries list error", { error: error.message });

      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

/**
 * GET /webhooks/subscriptions/:id/stats
 * Get delivery statistics for a subscription
 */
router.get("/subscriptions/:id/stats", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subscription = webhookManager.getSubscription(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    const stats = webhookManager.getDeliveryStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error("Webhook stats error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /webhooks/generate-secret
 * Generate a secure webhook secret
 */
router.post("/generate-secret", async (req: Request, res: Response) => {
  try {
    const { length = 64 } = req.body;

    const secret = generateWebhookSecret(length);

    res.json({
      success: true,
      data: {
        secret,
      },
    });
  } catch (error: any) {
    logger.error("Webhook secret generation error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /webhooks/events
 * Get list of available webhook events
 */
router.get("/events", async (req: Request, res: Response) => {
  try {
    const events: { event: WebhookEventType; description: string }[] = [
      { event: "patient.created", description: "Patient record created" },
      { event: "patient.updated", description: "Patient record updated" },
      { event: "patient.deleted", description: "Patient record deleted" },
      { event: "appointment.created", description: "Appointment created" },
      { event: "appointment.updated", description: "Appointment updated" },
      { event: "appointment.cancelled", description: "Appointment cancelled" },
      { event: "order.created", description: "Order created" },
      { event: "order.completed", description: "Order completed" },
      {
        event: "result.available",
        description: "Lab/imaging result available",
      },
      { event: "prescription.created", description: "Prescription created" },
      { event: "prescription.filled", description: "Prescription filled" },
      { event: "encounter.created", description: "Encounter created" },
      { event: "encounter.completed", description: "Encounter completed" },
      { event: "document.created", description: "Clinical document created" },
      { event: "billing.claim.created", description: "Billing claim created" },
      {
        event: "billing.claim.submitted",
        description: "Billing claim submitted",
      },
      { event: "billing.payment.received", description: "Payment received" },
    ];

    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    logger.error("Webhook events list error", { error: error.message });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /webhooks/test
 * Test a webhook URL
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { url, secret } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL is required",
      });
    }

    // Validate URL
    const urlValidation = validateWebhookURL(url);
    if (!urlValidation.valid) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL",
        errors: urlValidation.errors,
      });
    }

    // Create temporary subscription
    const testSecret = secret || generateWebhookSecret();
    const testSubscription = webhookManager.subscribe({
      url,
      events: ["patient.created"],
      secret: testSecret,
      active: true,
    });

    // Trigger test event
    await webhookManager.trigger("patient.created", {
      test: true,
      message: "This is a test webhook event",
      timestamp: new Date().toISOString(),
    });

    // Get delivery stats
    const stats = webhookManager.getDeliveryStats(testSubscription.id);

    // Clean up
    webhookManager.unsubscribe(testSubscription.id);

    res.json({
      success: true,
      data: {
        delivered: stats.success > 0,
        stats,
      },
    });
  } catch (error: any) {
    logger.error("Webhook test error", { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
