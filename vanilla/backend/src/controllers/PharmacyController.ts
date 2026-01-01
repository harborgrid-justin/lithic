/**
 * PharmacyController.ts
 * Controller for pharmacy management endpoints
 */

import { Request, Response } from "express";
import pharmacyService from "../services/PharmacyService";
import prescriptionService from "../services/PrescriptionService";
import drugInteractionService from "../services/DrugInteractionService";

export class PharmacyController {
  // Medications
  async getMedications(req: Request, res: Response): Promise<void> {
    try {
      const { isControlled, deaSchedule, formularyStatus, therapeuticClass } =
        req.query;

      const medications = await pharmacyService.getAllMedications({
        isControlled:
          isControlled === "true"
            ? true
            : isControlled === "false"
              ? false
              : undefined,
        deaSchedule: deaSchedule as string,
        formularyStatus: formularyStatus as string,
        therapeuticClass: therapeuticClass as string,
      });

      res.json({
        success: true,
        data: medications,
        count: medications.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch medications",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getMedication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const medication = await pharmacyService.getMedication(id);

      if (!medication) {
        res.status(404).json({
          success: false,
          error: "Medication not found",
        });
        return;
      }

      res.json({
        success: true,
        data: medication,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch medication",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async searchMedications(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        res.status(400).json({
          success: false,
          error: "Search query required",
        });
        return;
      }

      const medications = await pharmacyService.searchMedications(q);

      res.json({
        success: true,
        data: medications,
        count: medications.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to search medications",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createMedication(req: Request, res: Response): Promise<void> {
    try {
      const medication = await pharmacyService.createMedication(req.body);

      res.status(201).json({
        success: true,
        data: medication,
        message: "Medication created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create medication",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Inventory
  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const { status, lowStock, expiringSoon } = req.query;

      const inventory = await pharmacyService.getAllInventory({
        status: status as string,
        lowStock: lowStock === "true",
        expiringSoon: expiringSoon === "true",
      });

      res.json({
        success: true,
        data: inventory,
        count: inventory.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch inventory",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await pharmacyService.getInventoryItem(id);

      if (!item) {
        res.status(404).json({
          success: false,
          error: "Inventory item not found",
        });
        return;
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch inventory item",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const item = await pharmacyService.createInventoryItem(req.body);

      res.status(201).json({
        success: true,
        data: item,
        message: "Inventory item created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create inventory item",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updateInventoryQuantity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantityChange, reason } = req.body;

      if (typeof quantityChange !== "number" || !reason) {
        res.status(400).json({
          success: false,
          error: "Quantity change and reason required",
        });
        return;
      }

      const item = await pharmacyService.updateInventoryQuantity(
        id,
        quantityChange,
        reason,
      );

      if (!item) {
        res.status(404).json({
          success: false,
          error: "Inventory item not found",
        });
        return;
      }

      res.json({
        success: true,
        data: item,
        message: "Inventory updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update inventory",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Prescriptions
  async getPrescriptions(req: Request, res: Response): Promise<void> {
    try {
      const { status, priority, isControlled, patientId } = req.query;

      let prescriptions;

      if (patientId) {
        prescriptions = await pharmacyService.getPrescriptionsByPatient(
          patientId as string,
          {
            status: status as string,
          },
        );
      } else {
        prescriptions = await pharmacyService.getAllPrescriptions({
          status: status as string,
          priority: priority as string,
          isControlled:
            isControlled === "true"
              ? true
              : isControlled === "false"
                ? false
                : undefined,
        });
      }

      res.json({
        success: true,
        data: prescriptions,
        count: prescriptions.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch prescriptions",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getPrescription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const prescription = await pharmacyService.getPrescription(id);

      if (!prescription) {
        res.status(404).json({
          success: false,
          error: "Prescription not found",
        });
        return;
      }

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createPrescription(req: Request, res: Response): Promise<void> {
    try {
      // Validate prescription
      const validation = await prescriptionService.validatePrescription(
        req.body,
      );

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: "Prescription validation failed",
          errors: validation.errors,
          warnings: validation.warnings,
        });
        return;
      }

      const prescription = await pharmacyService.createPrescription(req.body);

      res.status(201).json({
        success: true,
        data: prescription,
        warnings: validation.warnings,
        message: "Prescription created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async updatePrescriptionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: "Status required",
        });
        return;
      }

      const prescription = await pharmacyService.updatePrescriptionStatus(
        id,
        status,
        notes,
      );

      if (!prescription) {
        res.status(404).json({
          success: false,
          error: "Prescription not found",
        });
        return;
      }

      res.json({
        success: true,
        data: prescription,
        message: "Prescription status updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Dispensing
  async dispensePrescription(req: Request, res: Response): Promise<void> {
    try {
      const { prescriptionId } = req.params;
      const dispensingData = req.body;

      const record = await pharmacyService.dispensePrescription({
        prescriptionId,
        ...dispensingData,
      });

      if (!record) {
        res.status(404).json({
          success: false,
          error: "Prescription not found or cannot be dispensed",
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: record,
        message: "Prescription dispensed successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Failed to dispense prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Controlled Substances
  async getControlledSubstanceLogs(req: Request, res: Response): Promise<void> {
    try {
      const { medicationId, action, startDate, endDate } = req.query;

      const logs = await pharmacyService.getControlledSubstanceLogs({
        medicationId: medicationId as string,
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch controlled substance logs",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async logControlledSubstance(req: Request, res: Response): Promise<void> {
    try {
      const log = await pharmacyService.logControlledSubstanceAction(req.body);

      res.status(201).json({
        success: true,
        data: log,
        message: "Controlled substance action logged successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to log controlled substance action",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Formulary
  async getFormulary(req: Request, res: Response): Promise<void> {
    try {
      const { tier, status } = req.query;

      const formulary = await pharmacyService.getAllFormulary({
        tier: tier ? Number(tier) : undefined,
        status: status as string,
      });

      res.json({
        success: true,
        data: formulary,
        count: formulary.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch formulary",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getFormularyEntry(req: Request, res: Response): Promise<void> {
    try {
      const { medicationId } = req.params;
      const entry = await pharmacyService.getFormularyEntry(medicationId);

      if (!entry) {
        res.status(404).json({
          success: false,
          error: "Formulary entry not found",
        });
        return;
      }

      res.json({
        success: true,
        data: entry,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch formulary entry",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createFormularyEntry(req: Request, res: Response): Promise<void> {
    try {
      const entry = await pharmacyService.createFormularyEntry(req.body);

      res.status(201).json({
        success: true,
        data: entry,
        message: "Formulary entry created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create formulary entry",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Drug Interactions
  async checkDrugInteractions(req: Request, res: Response): Promise<void> {
    try {
      const { medicationId, patientId, currentMedications, patientData } =
        req.body;

      if (!medicationId) {
        res.status(400).json({
          success: false,
          error: "Medication ID required",
        });
        return;
      }

      const medication = await pharmacyService.getMedication(medicationId);
      if (!medication) {
        res.status(404).json({
          success: false,
          error: "Medication not found",
        });
        return;
      }

      const result = await drugInteractionService.checkInteractions(
        medication,
        currentMedications || [],
        patientData,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to check drug interactions",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // E-Prescribing
  async getEPrescriptions(req: Request, res: Response): Promise<void> {
    try {
      const { status, messageType } = req.query;

      const erxs = await prescriptionService.getEPrescriptions({
        status: status as any,
        messageType: messageType as any,
      });

      res.json({
        success: true,
        data: erxs,
        count: erxs.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch e-prescriptions",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async processEPrescription(req: Request, res: Response): Promise<void> {
    try {
      const erx = await prescriptionService.processEPrescription(req.body);

      res.status(201).json({
        success: true,
        data: erx,
        message: "E-prescription processed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to process e-prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async acceptEPrescription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { processedBy } = req.body;

      const erx = await prescriptionService.acceptEPrescription(
        id,
        processedBy,
      );

      if (!erx) {
        res.status(404).json({
          success: false,
          error: "E-prescription not found",
        });
        return;
      }

      res.json({
        success: true,
        data: erx,
        message: "E-prescription accepted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to accept e-prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async rejectEPrescription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          error: "Rejection reason required",
        });
        return;
      }

      const erx = await prescriptionService.rejectEPrescription(id, reason);

      if (!erx) {
        res.status(404).json({
          success: false,
          error: "E-prescription not found",
        });
        return;
      }

      res.json({
        success: true,
        data: erx,
        message: "E-prescription rejected successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to reject e-prescription",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Refills
  async getRefillRequests(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, status } = req.query;

      const requests = await prescriptionService.getRefillRequests({
        patientId: patientId as string,
        status: status as any,
      });

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch refill requests",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createRefillRequest(req: Request, res: Response): Promise<void> {
    try {
      const { prescriptionId, requestedBy } = req.body;

      if (!prescriptionId || !requestedBy) {
        res.status(400).json({
          success: false,
          error: "Prescription ID and requestedBy required",
        });
        return;
      }

      const request = await prescriptionService.sendRefillRequest(
        prescriptionId,
        requestedBy,
      );

      res.status(201).json({
        success: true,
        data: request,
        message: "Refill request created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create refill request",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async approveRefillRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { processedBy } = req.body;

      if (!processedBy) {
        res.status(400).json({
          success: false,
          error: "ProcessedBy required",
        });
        return;
      }

      const request = await prescriptionService.approveRefillRequest(
        id,
        processedBy,
      );

      if (!request) {
        res.status(404).json({
          success: false,
          error: "Refill request not found",
        });
        return;
      }

      res.json({
        success: true,
        data: request,
        message: "Refill request approved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to approve refill request",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async denyRefillRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, processedBy } = req.body;

      if (!reason || !processedBy) {
        res.status(400).json({
          success: false,
          error: "Reason and processedBy required",
        });
        return;
      }

      const request = await prescriptionService.denyRefillRequest(
        id,
        reason,
        processedBy,
      );

      if (!request) {
        res.status(404).json({
          success: false,
          error: "Refill request not found",
        });
        return;
      }

      res.json({
        success: true,
        data: request,
        message: "Refill request denied successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to deny refill request",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

const pharmacyController = new PharmacyController();
export default pharmacyController;
