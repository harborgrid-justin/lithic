import { Router } from "express";
import { ImagingController } from "../../controllers/ImagingController";
import { authMiddleware } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validation";
import { z } from "zod";

const router = Router();
const controller = new ImagingController();

// Validation schemas
const createOrderSchema = z.object({
  patientId: z.string().uuid(),
  orderingProviderId: z.string().uuid(),
  procedureCode: z.string(),
  modality: z.enum(["CT", "MRI", "XRAY", "US", "NM", "PET", "MAMMO", "FLUORO"]),
  priority: z.enum(["ROUTINE", "URGENT", "STAT", "ASAP"]),
  clinicalIndication: z.string().min(10),
  bodyPart: z.string(),
  laterality: z
    .enum(["LEFT", "RIGHT", "BILATERAL", "UNILATERAL", "NA"])
    .optional(),
  contrast: z.boolean().optional(),
  scheduledDateTime: z.string().datetime().optional(),
  specialInstructions: z.string().optional(),
  icdCodes: z.array(z.string()).optional(),
  transportRequired: z.boolean().optional(),
  isolationPrecautions: z.string().optional(),
});

const updateOrderSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "DISCONTINUED",
    ])
    .optional(),
  scheduledDateTime: z.string().datetime().optional(),
  assignedTechnicianId: z.string().uuid().optional(),
  assignedRadiologistId: z.string().uuid().optional(),
  notes: z.string().optional(),
  priority: z.enum(["ROUTINE", "URGENT", "STAT", "ASAP"]).optional(),
});

const searchOrdersSchema = z.object({
  patientId: z.string().uuid().optional(),
  status: z.string().optional(),
  modality: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  orderingProviderId: z.string().uuid().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// Routes
/**
 * GET /api/imaging/orders
 * Get all imaging orders with filtering
 */
router.get(
  "/",
  authMiddleware,
  validateRequest(searchOrdersSchema, "query"),
  async (req, res) => {
    try {
      const result = await controller.getOrders(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch orders",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * GET /api/imaging/orders/:id
 * Get specific imaging order by ID
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await controller.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch order",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/imaging/orders
 * Create new imaging order
 */
router.post(
  "/",
  authMiddleware,
  validateRequest(createOrderSchema),
  async (req, res) => {
    try {
      const order = await controller.createOrder(req.body, req.user);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({
        error: "Failed to create order",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * PUT /api/imaging/orders/:id
 * Update imaging order
 */
router.put(
  "/:id",
  authMiddleware,
  validateRequest(updateOrderSchema),
  async (req, res) => {
    try {
      const order = await controller.updateOrder(
        req.params.id,
        req.body,
        req.user,
      );
      res.json(order);
    } catch (error) {
      res.status(500).json({
        error: "Failed to update order",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

/**
 * DELETE /api/imaging/orders/:id
 * Cancel imaging order
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await controller.cancelOrder(req.params.id, req.user);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: "Failed to cancel order",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/imaging/orders/:id/schedule
 * Schedule an imaging order
 */
router.post("/:id/schedule", authMiddleware, async (req, res) => {
  try {
    const order = await controller.scheduleOrder(
      req.params.id,
      req.body.scheduledDateTime,
      req.body.modalityId,
      req.user,
    );
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: "Failed to schedule order",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/imaging/orders/:id/start
 * Mark order as in progress
 */
router.post("/:id/start", authMiddleware, async (req, res) => {
  try {
    const order = await controller.startOrder(req.params.id, req.user);
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: "Failed to start order",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/imaging/orders/:id/complete
 * Mark order as completed
 */
router.post("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const order = await controller.completeOrder(req.params.id, req.user);
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: "Failed to complete order",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/imaging/orders/:id/history
 * Get order history/audit trail
 */
router.get("/:id/history", authMiddleware, async (req, res) => {
  try {
    const history = await controller.getOrderHistory(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch order history",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
