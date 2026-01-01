/**
 * Patient Controller - HTTP request handlers for patient operations
 */

import { Request, Response } from "express";
import PatientService from "../services/PatientService";
import {
  Patient,
  PatientSearchParams,
  PatientMergeRequest,
} from "../models/Patient";

export class PatientController {
  /**
   * Get all patients (with pagination)
   */
  public async getAllPatients(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const patients = await PatientService.getAllPatients(limit, offset);
      const total = await PatientService.getPatientCount();

      res.json({
        success: true,
        data: patients,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get patient by ID
   */
  public async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "anonymous";

      const patient = await PatientService.getPatientById(id, userId);

      if (!patient) {
        res.status(404).json({
          success: false,
          error: "Patient not found",
        });
        return;
      }

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get patient by MRN
   */
  public async getPatientByMRN(req: Request, res: Response): Promise<void> {
    try {
      const { mrn } = req.params;
      const userId = req.user?.id || "anonymous";

      const patient = await PatientService.getPatientByMRN(mrn, userId);

      if (!patient) {
        res.status(404).json({
          success: false,
          error: "Patient not found",
        });
        return;
      }

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Create new patient
   */
  public async createPatient(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";
      const patientData = req.body;

      // Validate required fields
      if (
        !patientData.firstName ||
        !patientData.lastName ||
        !patientData.dateOfBirth
      ) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: firstName, lastName, dateOfBirth",
        });
        return;
      }

      const patient = await PatientService.createPatient(patientData, userId);

      res.status(201).json({
        success: true,
        data: patient,
        message: "Patient created successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update patient
   */
  public async updatePatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "anonymous";
      const updates = req.body;

      const patient = await PatientService.updatePatient(id, updates, userId);

      res.json({
        success: true,
        data: patient,
        message: "Patient updated successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Delete patient
   */
  public async deletePatient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "anonymous";

      await PatientService.deletePatient(id, userId);

      res.json({
        success: true,
        message: "Patient deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Search patients
   */
  public async searchPatients(req: Request, res: Response): Promise<void> {
    try {
      const params: PatientSearchParams = {
        query: req.query.query as string,
        firstName: req.query.firstName as string,
        lastName: req.query.lastName as string,
        mrn: req.query.mrn as string,
        phone: req.query.phone as string,
        email: req.query.email as string,
        status: req.query.status as Patient["status"],
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      if (req.query.dateOfBirth) {
        params.dateOfBirth = new Date(req.query.dateOfBirth as string);
      }

      const patients = await PatientService.searchPatients(params);

      res.json({
        success: true,
        data: patients,
        count: patients.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Find duplicate patients
   */
  public async findDuplicates(req: Request, res: Response): Promise<void> {
    try {
      const patientData = req.body;

      const duplicates = await PatientService.findDuplicates(patientData);

      res.json({
        success: true,
        data: duplicates,
        count: duplicates.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Merge patients
   */
  public async mergePatients(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || "anonymous";
      const request: PatientMergeRequest = {
        ...req.body,
        performedBy: userId,
      };

      // Validate required fields
      if (!request.sourceMrn || !request.targetMrn || !request.reason) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: sourceMrn, targetMrn, reason",
        });
        return;
      }

      const mergedPatient = await PatientService.mergePatients(request);

      res.json({
        success: true,
        data: mergedPatient,
        message: "Patients merged successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Add document to patient
   */
  public async addDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "anonymous";
      const documentData = req.body;

      const patient = await PatientService.addDocument(
        id,
        documentData,
        userId,
      );

      res.json({
        success: true,
        data: patient,
        message: "Document added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Update patient insurance
   */
  public async updateInsurance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id || "anonymous";
      const insuranceData = req.body;

      // Generate ID if not provided
      if (!insuranceData.id) {
        insuranceData.id = `ins-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      const patient = await PatientService.updateInsurance(
        id,
        insuranceData,
        userId,
      );

      res.json({
        success: true,
        data: patient,
        message: "Insurance updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Get patient audit log
   */
  public async getAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const auditLog = await PatientService.getAuditLog(id);

      res.json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}

const patientController = new PatientController();
export default patientController;
