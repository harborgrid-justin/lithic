import { Request, Response } from "express";
import ClinicalService from "../services/ClinicalService";
import {
  CreateNoteRequest,
  CreateVitalsRequest,
  CreateProblemRequest,
  CreateAllergyRequest,
  CreateMedicationRequest,
  CreateOrderRequest,
  SignDocumentRequest,
} from "../models/ClinicalTypes";

export class ClinicalController {
  // ============ Clinical Notes ============

  async createNote(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      const noteData: CreateNoteRequest = req.body;

      const note = await ClinicalService.createNote(noteData, userId);
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ success: false, error: "Failed to create note" });
    }
  }

  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const note = await ClinicalService.getNoteById(noteId);

      if (!note) {
        res.status(404).json({ success: false, error: "Note not found" });
        return;
      }

      res.json({ success: true, data: note });
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ success: false, error: "Failed to fetch note" });
    }
  }

  async getNotesByEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const notes = await ClinicalService.getNotesByEncounter(encounterId);
      res.json({ success: true, data: notes });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ success: false, error: "Failed to fetch notes" });
    }
  }

  async getNotesByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const notes = await ClinicalService.getNotesByPatient(patientId);
      res.json({ success: true, data: notes });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ success: false, error: "Failed to fetch notes" });
    }
  }

  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const updates = req.body;

      const note = await ClinicalService.updateNote(noteId, updates);
      if (!note) {
        res.status(404).json({ success: false, error: "Note not found" });
        return;
      }

      res.json({ success: true, data: note });
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ success: false, error: "Failed to update note" });
    }
  }

  async signNote(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const signRequest: SignDocumentRequest = {
        ...req.body,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      };

      const note = await ClinicalService.signNote(noteId, signRequest);
      if (!note) {
        res.status(404).json({ success: false, error: "Note not found" });
        return;
      }

      res.json({ success: true, data: note });
    } catch (error) {
      console.error("Error signing note:", error);
      res
        .status(500)
        .json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to sign note",
        });
    }
  }

  async addAddendum(req: Request, res: Response): Promise<void> {
    try {
      const { noteId } = req.params;
      const { addendumText } = req.body;
      const userId = req.user?.id || req.body.userId;

      const note = await ClinicalService.addAddendum(
        noteId,
        addendumText,
        userId,
      );
      if (!note) {
        res.status(404).json({ success: false, error: "Note not found" });
        return;
      }

      res.json({ success: true, data: note });
    } catch (error) {
      console.error("Error adding addendum:", error);
      res
        .status(500)
        .json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to add addendum",
        });
    }
  }

  // ============ Vital Signs ============

  async recordVitals(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId || "system";
      const vitalsData: CreateVitalsRequest = req.body;

      const vitals = await ClinicalService.recordVitals(vitalsData, userId);
      res.status(201).json({ success: true, data: vitals });
    } catch (error) {
      console.error("Error recording vitals:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to record vitals" });
    }
  }

  async getVitalsByEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const vitals = await ClinicalService.getVitalsByEncounter(encounterId);
      res.json({ success: true, data: vitals });
    } catch (error) {
      console.error("Error fetching vitals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch vitals" });
    }
  }

  async getVitalsByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const vitals = await ClinicalService.getVitalsByPatient(patientId, limit);
      res.json({ success: true, data: vitals });
    } catch (error) {
      console.error("Error fetching vitals:", error);
      res.status(500).json({ success: false, error: "Failed to fetch vitals" });
    }
  }

  // ============ Problems ============

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      const problemData: CreateProblemRequest = req.body;

      const problem = await ClinicalService.createProblem(problemData, userId);
      res.status(201).json({ success: true, data: problem });
    } catch (error) {
      console.error("Error creating problem:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create problem" });
    }
  }

  async getProblemsByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const activeOnly = req.query.activeOnly === "true";
      const problems = await ClinicalService.getProblemsByPatient(
        patientId,
        activeOnly,
      );
      res.json({ success: true, data: problems });
    } catch (error) {
      console.error("Error fetching problems:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch problems" });
    }
  }

  async updateProblem(req: Request, res: Response): Promise<void> {
    try {
      const { problemId } = req.params;
      const updates = req.body;

      const problem = await ClinicalService.updateProblem(problemId, updates);
      if (!problem) {
        res.status(404).json({ success: false, error: "Problem not found" });
        return;
      }

      res.json({ success: true, data: problem });
    } catch (error) {
      console.error("Error updating problem:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update problem" });
    }
  }

  // ============ Allergies ============

  async createAllergy(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      const allergyData: CreateAllergyRequest = req.body;

      const allergy = await ClinicalService.createAllergy(allergyData, userId);
      res.status(201).json({ success: true, data: allergy });
    } catch (error) {
      console.error("Error creating allergy:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create allergy" });
    }
  }

  async getAllergiesByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const activeOnly = req.query.activeOnly !== "false";
      const allergies = await ClinicalService.getAllergiesByPatient(
        patientId,
        activeOnly,
      );
      res.json({ success: true, data: allergies });
    } catch (error) {
      console.error("Error fetching allergies:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch allergies" });
    }
  }

  async updateAllergy(req: Request, res: Response): Promise<void> {
    try {
      const { allergyId } = req.params;
      const updates = req.body;

      const allergy = await ClinicalService.updateAllergy(allergyId, updates);
      if (!allergy) {
        res.status(404).json({ success: false, error: "Allergy not found" });
        return;
      }

      res.json({ success: true, data: allergy });
    } catch (error) {
      console.error("Error updating allergy:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update allergy" });
    }
  }

  // ============ Medications ============

  async createMedication(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      const medicationData: CreateMedicationRequest = req.body;

      const medication = await ClinicalService.createMedication(
        medicationData,
        userId,
      );
      res.status(201).json({ success: true, data: medication });
    } catch (error) {
      console.error("Error creating medication:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create medication" });
    }
  }

  async getMedicationsByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const activeOnly = req.query.activeOnly !== "false";
      const medications = await ClinicalService.getMedicationsByPatient(
        patientId,
        activeOnly,
      );
      res.json({ success: true, data: medications });
    } catch (error) {
      console.error("Error fetching medications:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch medications" });
    }
  }

  async updateMedication(req: Request, res: Response): Promise<void> {
    try {
      const { medicationId } = req.params;
      const updates = req.body;

      const medication = await ClinicalService.updateMedication(
        medicationId,
        updates,
      );
      if (!medication) {
        res.status(404).json({ success: false, error: "Medication not found" });
        return;
      }

      res.json({ success: true, data: medication });
    } catch (error) {
      console.error("Error updating medication:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update medication" });
    }
  }

  // ============ Orders ============

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId;
      const orderData: CreateOrderRequest = req.body;

      const order = await ClinicalService.createOrder(orderData, userId);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ success: false, error: "Failed to create order" });
    }
  }

  async getOrdersByEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const orders = await ClinicalService.getOrdersByEncounter(encounterId);
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "Failed to fetch orders" });
    }
  }

  async getOrdersByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const orders = await ClinicalService.getOrdersByPatient(patientId);
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "Failed to fetch orders" });
    }
  }

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const updates = req.body;

      const order = await ClinicalService.updateOrder(orderId, updates);
      if (!order) {
        res.status(404).json({ success: false, error: "Order not found" });
        return;
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ success: false, error: "Failed to update order" });
    }
  }

  async signOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const signRequest: SignDocumentRequest = {
        ...req.body,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      };

      const order = await ClinicalService.signOrder(orderId, signRequest);
      if (!order) {
        res.status(404).json({ success: false, error: "Order not found" });
        return;
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error signing order:", error);
      res
        .status(500)
        .json({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to sign order",
        });
    }
  }

  // ============ Code Lookups ============

  async searchICD10(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Query parameter required" });
        return;
      }

      const codes = ClinicalService.searchICD10(query);
      res.json({ success: true, data: codes });
    } catch (error) {
      console.error("Error searching ICD-10 codes:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to search ICD-10 codes" });
    }
  }

  async searchCPT(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Query parameter required" });
        return;
      }

      const codes = ClinicalService.searchCPT(query);
      res.json({ success: true, data: codes });
    } catch (error) {
      console.error("Error searching CPT codes:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to search CPT codes" });
    }
  }

  async getICD10ByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const icd10 = ClinicalService.getICD10ByCode(code);

      if (!icd10) {
        res
          .status(404)
          .json({ success: false, error: "ICD-10 code not found" });
        return;
      }

      res.json({ success: true, data: icd10 });
    } catch (error) {
      console.error("Error fetching ICD-10 code:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch ICD-10 code" });
    }
  }

  async getCPTByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const cpt = ClinicalService.getCPTByCode(code);

      if (!cpt) {
        res.status(404).json({ success: false, error: "CPT code not found" });
        return;
      }

      res.json({ success: true, data: cpt });
    } catch (error) {
      console.error("Error fetching CPT code:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch CPT code" });
    }
  }

  // ============ Templates ============

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.query;
      const templates = ClinicalService.getTemplates(type as string);
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch templates" });
    }
  }

  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const template = ClinicalService.getTemplateById(templateId);

      if (!template) {
        res.status(404).json({ success: false, error: "Template not found" });
        return;
      }

      res.json({ success: true, data: template });
    } catch (error) {
      console.error("Error fetching template:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch template" });
    }
  }
}

const clinicalController = new ClinicalController();
export default clinicalController;
