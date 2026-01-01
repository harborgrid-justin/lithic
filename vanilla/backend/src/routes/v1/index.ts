/**
 * API v1 Routes
 *
 * Main router for API version 1 endpoints
 */

import { Router } from 'express';
import fhirRoutes from '../fhir';
import hl7Routes from '../hl7';
import webhookRoutes from '../webhooks';

const router = Router();

/**
 * Mount all v1 routes
 */

// Health check (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: 'v1',
      timestamp: new Date().toISOString(),
    },
  });
});

// Integration routes
router.use('/fhir', fhirRoutes);
router.use('/hl7', hl7Routes);
router.use('/webhooks', webhookRoutes);

// Patient routes
// router.use('/patients', patientRoutes);

// Appointment routes
// router.use('/appointments', appointmentRoutes);

// Clinical routes
// router.use('/clinical', clinicalRoutes);

// Laboratory routes
// router.use('/laboratory', laboratoryRoutes);

// Imaging routes
// router.use('/imaging', imagingRoutes);

// Pharmacy routes
// router.use('/pharmacy', pharmacyRoutes);

// Billing routes
// router.use('/billing', billingRoutes);

// Analytics routes
// router.use('/analytics', analyticsRoutes);

// Queue management routes
router.get('/queue/stats', (req, res) => {
  // Import queue processor dynamically to avoid circular deps
  const { queueProcessor } = require('../../queue/processor');
  const stats = queueProcessor.getStats();

  res.json({
    success: true,
    data: stats,
  });
});

// Real-time stats
router.get('/realtime/stats', (req, res) => {
  // Get WebSocket stats if available
  const stats = {
    enabled: true,
    connections: 0,
    authenticated: 0,
  };

  res.json({
    success: true,
    data: stats,
  });
});

// API information
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      version: 'v1',
      name: 'Lithic Healthcare Platform API',
      description: 'Enterprise healthcare platform API',
      documentation: '/api/docs',
      endpoints: {
        health: '/api/v1/health',
        fhir: '/api/v1/fhir',
        hl7: '/api/v1/hl7',
        webhooks: '/api/v1/webhooks',
        queue: '/api/v1/queue',
        realtime: '/api/v1/realtime',
      },
      features: [
        'FHIR R4 Support',
        'HL7v2 Integration',
        'Webhook Management',
        'Real-time Updates (WebSocket)',
        'Job Queue Processing',
        'E-Prescribing (Surescripts)',
        'Claims Processing (EDI 837/835)',
        'Eligibility Verification',
        'Immunization Registry',
      ],
    },
  });
});

export default router;
