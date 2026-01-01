/**
 * Laboratory Controller
 * Handles HTTP requests for laboratory operations
 */

import { Request, Response } from 'express';
import { LaboratoryService } from '../services/LaboratoryService';
import { SpecimenService } from '../services/SpecimenService';
import { HL7Service } from '../services/HL7Service';

export class LaboratoryController {
  private labService: LaboratoryService;
  private specimenService: SpecimenService;

  constructor() {
    this.labService = new LaboratoryService();
    this.specimenService = new SpecimenService();
  }

  // ==================== ORDERS ====================

  /**
   * Create new lab order
   */
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await this.labService.createOrder(req.body);

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create order from panel
   */
  createOrderFromPanel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { panelId } = req.params;
      const order = await this.labService.createOrderFromPanel(panelId, req.body);

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get order by ID
   */
  getOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const order = await this.labService.getOrder(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get orders by patient
   */
  getOrdersByPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params;
      const orders = await this.labService.getOrdersByPatient(patientId);

      res.json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get pending orders
   */
  getPendingOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await this.labService.getPendingOrders();

      res.json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Update order status
   */
  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await this.labService.updateOrderStatus(orderId, status);

      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Cancel order
   */
  cancelOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await this.labService.cancelOrder(orderId, reason);

      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Generate HL7 order message
   */
  generateHL7Order = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const order = await this.labService.getOrder(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      // Mock patient and visit data (would come from database in production)
      const hl7Message = HL7Service.generateOrderMessage({
        patient: {
          mrn: order.patientMRN,
          firstName: order.patientName.split(' ')[0],
          lastName: order.patientName.split(' ')[1] || '',
          dateOfBirth: new Date('1980-01-01'),
          gender: 'M'
        },
        visit: {
          patientClass: 'O',
          visitNumber: order.orderNumber,
          admitDateTime: order.orderDateTime
        },
        order: {
          placerOrderNumber: order.orderNumber,
          fillerOrderNumber: order.orderNumber,
          status: 'NW',
          orderDateTime: order.orderDateTime,
          orderingProvider: {
            id: order.orderingProviderId,
            firstName: order.orderingProviderName.split(' ')[0],
            lastName: order.orderingProviderName.split(' ')[1] || ''
          }
        },
        tests: order.tests.map(test => ({
          testCode: test.testCode,
          testName: test.testName,
          observationDateTime: new Date(),
          collectionDateTime: test.collectedDateTime || order.collectionDateTime
        }))
      });

      res.json({
        success: true,
        data: {
          hl7Message,
          orderId: order.id
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // ==================== RESULTS ====================

  /**
   * Add result
   */
  addResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.labService.addResult(req.body);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Verify result
   */
  verifyResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resultId } = req.params;
      const { verifiedBy } = req.body;

      const result = await this.labService.verifyResult(resultId, verifiedBy);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get results for order
   */
  getResultsForOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const results = await this.labService.getResultsForOrder(orderId);

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get results for patient
   */
  getResultsForPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params;
      const results = await this.labService.getResultsForPatient(patientId);

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get critical results
   */
  getCriticalResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const results = await this.labService.getCriticalResults();

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Search results
   */
  searchResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const criteria = {
        patientId: req.query.patientId as string,
        loincCode: req.query.loincCode as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        critical: req.query.critical === 'true' ? true : req.query.critical === 'false' ? false : undefined
      };

      const results = await this.labService.searchResults(criteria);

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Generate HL7 result message
   */
  generateHL7Result = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const order = await this.labService.getOrder(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      const results = await this.labService.getResultsForOrder(orderId);

      const hl7Message = HL7Service.generateResultMessage({
        patient: {
          mrn: order.patientMRN,
          firstName: order.patientName.split(' ')[0],
          lastName: order.patientName.split(' ')[1] || '',
          dateOfBirth: new Date('1980-01-01'),
          gender: 'M'
        },
        visit: {
          patientClass: 'O',
          visitNumber: order.orderNumber,
          admitDateTime: order.orderDateTime
        },
        order: {
          placerOrderNumber: order.orderNumber,
          fillerOrderNumber: order.orderNumber,
          testCode: order.tests[0]?.testCode,
          testName: order.tests[0]?.testName,
          observationDateTime: new Date(),
          resultsDateTime: new Date()
        },
        results: results.map(result => ({
          testCode: result.loincCode,
          testName: result.testName,
          value: result.value,
          unit: result.unit,
          referenceRange: result.referenceRange,
          abnormalFlag: result.abnormalFlag,
          valueType: result.valueType === 'numeric' ? 'NM' : 'ST',
          observationDateTime: result.performedDateTime,
          analysisDateTime: result.performedDateTime,
          observationResultStatus: result.status === 'final' ? 'F' : 'P'
        }))
      });

      res.json({
        success: true,
        data: {
          hl7Message,
          orderId: order.id
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // ==================== SPECIMENS ====================

  /**
   * Create specimen
   */
  createSpecimen = async (req: Request, res: Response): Promise<void> => {
    try {
      const specimen = await this.specimenService.createSpecimen(req.body);

      res.status(201).json({
        success: true,
        data: specimen
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Receive specimen
   */
  receiveSpecimen = async (req: Request, res: Response): Promise<void> => {
    try {
      const { specimenId } = req.params;
      const { receivedBy } = req.body;

      const specimen = await this.specimenService.receiveSpecimen(specimenId, receivedBy);

      res.json({
        success: true,
        data: specimen
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Update specimen status
   */
  updateSpecimenStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { specimenId } = req.params;
      const { status, performedBy, notes } = req.body;

      const specimen = await this.specimenService.updateStatus(specimenId, status, performedBy, notes);

      res.json({
        success: true,
        data: specimen
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get specimen by ID
   */
  getSpecimen = async (req: Request, res: Response): Promise<void> => {
    try {
      const { specimenId } = req.params;
      const specimen = await this.specimenService.getSpecimen(specimenId);

      if (!specimen) {
        res.status(404).json({
          success: false,
          error: 'Specimen not found'
        });
        return;
      }

      res.json({
        success: true,
        data: specimen
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get specimen by barcode
   */
  getSpecimenByBarcode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { barcode } = req.params;
      const specimen = await this.specimenService.getSpecimenByBarcode(barcode);

      if (!specimen) {
        res.status(404).json({
          success: false,
          error: 'Specimen not found'
        });
        return;
      }

      res.json({
        success: true,
        data: specimen
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get specimens for order
   */
  getSpecimensForOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const specimens = await this.specimenService.getSpecimensForOrder(orderId);

      res.json({
        success: true,
        data: specimens
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get tracking history
   */
  getTrackingHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { specimenId } = req.params;
      const history = await this.specimenService.getTrackingHistory(specimenId);

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Reject specimen
   */
  rejectSpecimen = async (req: Request, res: Response): Promise<void> => {
    try {
      const { specimenId } = req.params;
      const { reason, rejectedBy } = req.body;

      const specimen = await this.specimenService.rejectSpecimen(specimenId, reason, rejectedBy);

      res.json({
        success: true,
        data: specimen
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Add quality issue
   */
  addQualityIssue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { specimenId } = req.params;
      const specimen = await this.specimenService.addQualityIssue(specimenId, req.body);

      res.json({
        success: true,
        data: specimen
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  // ==================== PANELS ====================

  /**
   * Get all panels
   */
  getPanels = async (req: Request, res: Response): Promise<void> => {
    try {
      const panels = await this.labService.getPanels();

      res.json({
        success: true,
        data: panels
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get panel by ID
   */
  getPanel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { panelId } = req.params;
      const panel = await this.labService.getPanel(panelId);

      if (!panel) {
        res.status(404).json({
          success: false,
          error: 'Panel not found'
        });
        return;
      }

      res.json({
        success: true,
        data: panel
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Create panel
   */
  createPanel = async (req: Request, res: Response): Promise<void> => {
    try {
      const panel = await this.labService.createPanel(req.body);

      res.status(201).json({
        success: true,
        data: panel
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  // ==================== QUALITY CONTROL ====================

  /**
   * Record QC
   */
  recordQC = async (req: Request, res: Response): Promise<void> => {
    try {
      const qc = await this.labService.recordQC(req.body);

      res.status(201).json({
        success: true,
        data: qc
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get QC records
   */
  getQCRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const testCode = req.query.testCode as string;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const records = await this.labService.getQCRecords(testCode, dateFrom, dateTo);

      res.json({
        success: true,
        data: records
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Get failed QC
   */
  getFailedQC = async (req: Request, res: Response): Promise<void> => {
    try {
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const records = await this.labService.getFailedQC(dateFrom);

      res.json({
        success: true,
        data: records
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}
