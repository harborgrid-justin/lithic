/**
 * HL7v2 Routes
 *
 * RESTful endpoints for HL7v2 message processing
 */

import { Router, Request, Response } from 'express';
import { HL7Parser, HL7ParseError } from '../../integrations/hl7/parser';
import {
  createPatientRegistration,
  createPatientUpdate,
  createPatientDischarge,
  createGeneralOrder,
  createLabOrder,
  createAppointmentNotification,
  createDocumentNotification,
  createACK,
  createORUR01,
  getMessageInfo,
  validateMessage,
} from '../../integrations/hl7/messages';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /hl7/parse
 * Parse an HL7 message
 */
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const parsed = HL7Parser.parse(message);
    const json = HL7Parser.toJSON(parsed);

    logger.info('HL7 Message Parsed', {
      messageType: parsed.messageType,
      triggerEvent: parsed.triggerEvent,
      messageControlId: parsed.messageControlId,
    });

    res.json({
      success: true,
      data: json,
    });
  } catch (error: any) {
    logger.error('HL7 Parse Error', { error: error.message });

    if (error instanceof HL7ParseError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /hl7/validate
 * Validate an HL7 message
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const validation = validateMessage(message);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    logger.error('HL7 Validation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/extract/patient
 * Extract patient information from ADT message
 */
router.post('/extract/patient', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const parsed = HL7Parser.parse(message);
    const patient = HL7Parser.extractPatient(parsed);

    if (!patient) {
      return res.status(400).json({
        success: false,
        error: 'No patient information found in message',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error: any) {
    logger.error('HL7 Patient Extraction Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/extract/order
 * Extract order information from ORM message
 */
router.post('/extract/order', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const parsed = HL7Parser.parse(message);
    const order = HL7Parser.extractOrder(parsed);

    if (!order) {
      return res.status(400).json({
        success: false,
        error: 'No order information found in message',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('HL7 Order Extraction Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/extract/observations
 * Extract observations from ORU message
 */
router.post('/extract/observations', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const parsed = HL7Parser.parse(message);
    const observations = HL7Parser.extractObservations(parsed);

    res.json({
      success: true,
      data: observations,
    });
  } catch (error: any) {
    logger.error('HL7 Observations Extraction Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/ack
 * Create an ACK (acknowledgment) message
 */
router.post('/create/ack', async (req: Request, res: Response) => {
  try {
    const { originalMessage, acknowledgmentCode = 'AA' } = req.body;

    if (!originalMessage) {
      return res.status(400).json({
        success: false,
        error: 'Original message is required',
      });
    }

    const parsed = HL7Parser.parse(originalMessage);
    const ack = createACK(
      {
        messageControlId: parsed.messageControlId,
        messageType: parsed.messageType,
        triggerEvent: parsed.triggerEvent,
      },
      acknowledgmentCode
    );

    res.json({
      success: true,
      data: {
        message: ack,
      },
    });
  } catch (error: any) {
    logger.error('HL7 ACK Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/patient-registration
 * Create ADT^A04 patient registration message
 */
router.post('/create/patient-registration', async (req: Request, res: Response) => {
  try {
    const { patient, visit } = req.body;

    if (!patient) {
      return res.status(400).json({
        success: false,
        error: 'Patient is required',
      });
    }

    const message = createPatientRegistration(patient, visit);

    res.json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Patient Registration Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/patient-update
 * Create ADT^A08 patient update message
 */
router.post('/create/patient-update', async (req: Request, res: Response) => {
  try {
    const { patient, visit } = req.body;

    if (!patient) {
      return res.status(400).json({
        success: false,
        error: 'Patient is required',
      });
    }

    const message = createPatientUpdate(patient, visit);

    res.json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Patient Update Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/patient-discharge
 * Create ADT^A03 patient discharge message
 */
router.post('/create/patient-discharge', async (req: Request, res: Response) => {
  try {
    const { patient, dischargeInfo } = req.body;

    if (!patient || !dischargeInfo) {
      return res.status(400).json({
        success: false,
        error: 'Patient and discharge information are required',
      });
    }

    const message = createPatientDischarge(patient, dischargeInfo);

    res.json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Patient Discharge Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/lab-order
 * Create ORM^O01 lab order message
 */
router.post('/create/lab-order', async (req: Request, res: Response) => {
  try {
    const { patient, labTests, orderingProvider } = req.body;

    if (!patient || !labTests || !orderingProvider) {
      return res.status(400).json({
        success: false,
        error: 'Patient, lab tests, and ordering provider are required',
      });
    }

    const message = createLabOrder(patient, labTests, orderingProvider);

    res.json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Lab Order Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/observation-result
 * Create ORU^R01 observation result message
 */
router.post('/create/observation-result', async (req: Request, res: Response) => {
  try {
    const { patient, observations } = req.body;

    if (!patient || !observations) {
      return res.status(400).json({
        success: false,
        error: 'Patient and observations are required',
      });
    }

    const message = createORUR01(patient, observations);

    res.json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Observation Result Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/appointment
 * Create SIU^S12 appointment notification message
 */
router.post('/create/appointment', async (req: Request, res: Response) => {
  try {
    const { patient, appointment } = req.body;

    if (!patient || !appointment) {
      return res.status(400).json({
        success: false,
        error: 'Patient and appointment are required',
      });
    }

    const message = createAppointmentNotification(patient, appointment);

    res.json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Appointment Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/create/document
 * Create MDM^T02 document notification message
 */
router.post('/create/document', async (req: Request, res: Response) => {
  try {
    const { patient, document } = req.body;

    if (!patient || !document) {
      return res.status(400).json({
        success: false,
        error: 'Patient and document are required',
      });
    }

    const message = createDocumentNotification(patient, document);

    res.json({
      success: true,
      data: {
        message,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Document Creation Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/info
 * Get message type information
 */
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const info = getMessageInfo(message);

    res.json({
      success: true,
      data: info,
    });
  } catch (error: any) {
    logger.error('HL7 Info Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /hl7/process
 * Process incoming HL7 message (parse, validate, extract, and send ACK)
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Parse message
    const parsed = HL7Parser.parse(message);

    // Validate message
    const validation = validateMessage(message);

    if (!validation.valid) {
      // Send negative ACK
      const ack = createACK(
        {
          messageControlId: parsed.messageControlId,
          messageType: parsed.messageType,
          triggerEvent: parsed.triggerEvent,
        },
        'AE'
      );

      return res.status(400).json({
        success: false,
        error: 'Message validation failed',
        validation,
        ack,
      });
    }

    // Extract data based on message type
    let extractedData: any = {};

    if (parsed.messageType === 'ADT') {
      extractedData.patient = HL7Parser.extractPatient(parsed);
    } else if (parsed.messageType === 'ORM') {
      extractedData.order = HL7Parser.extractOrder(parsed);
    } else if (parsed.messageType === 'ORU') {
      extractedData.observations = HL7Parser.extractObservations(parsed);
    }

    // Send positive ACK
    const ack = createACK(
      {
        messageControlId: parsed.messageControlId,
        messageType: parsed.messageType,
        triggerEvent: parsed.triggerEvent,
      },
      'AA'
    );

    logger.info('HL7 Message Processed', {
      messageType: parsed.messageType,
      triggerEvent: parsed.triggerEvent,
      messageControlId: parsed.messageControlId,
    });

    res.json({
      success: true,
      data: {
        parsed: HL7Parser.toJSON(parsed),
        extracted: extractedData,
        validation,
        ack,
      },
    });
  } catch (error: any) {
    logger.error('HL7 Process Error', { error: error.message });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
