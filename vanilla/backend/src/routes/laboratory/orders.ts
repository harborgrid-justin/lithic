/**
 * Laboratory Orders Routes
 */

import { Router } from "express";
import { LaboratoryController } from "../../controllers/LaboratoryController";

const router = Router();
const controller = new LaboratoryController();

// Create new order
router.post("/", controller.createOrder);

// Create order from panel
router.post("/panel/:panelId", controller.createOrderFromPanel);

// Get pending orders
router.get("/pending", controller.getPendingOrders);

// Get order by ID
router.get("/:orderId", controller.getOrder);

// Get orders by patient
router.get("/patient/:patientId", controller.getOrdersByPatient);

// Update order status
router.patch("/:orderId/status", controller.updateOrderStatus);

// Cancel order
router.post("/:orderId/cancel", controller.cancelOrder);

// Generate HL7 order message
router.get("/:orderId/hl7", controller.generateHL7Order);

export default router;
