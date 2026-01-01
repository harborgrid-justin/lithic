import { Request, Response } from 'express';
import EncounterService from '../services/EncounterService';
import { CreateEncounterRequest, UpdateEncounterRequest, SignDocumentRequest } from '../models/ClinicalTypes';

export class EncounterController {
  async createEncounter(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.body.userId || 'system';
      const encounterData: CreateEncounterRequest = req.body;

      const encounter = await EncounterService.createEncounter(encounterData, userId);
      res.status(201).json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error creating encounter:', error);
      res.status(500).json({ success: false, error: 'Failed to create encounter' });
    }
  }

  async getEncounterById(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const encounter = await EncounterService.getEncounterById(encounterId);

      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error fetching encounter:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch encounter' });
    }
  }

  async getEncountersByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const encounters = await EncounterService.getEncountersByPatient(patientId);
      res.json({ success: true, data: encounters });
    } catch (error) {
      console.error('Error fetching encounters:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch encounters' });
    }
  }

  async getEncountersByProvider(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { status } = req.query;

      const encounters = await EncounterService.getEncountersByProvider(
        providerId,
        status as any
      );
      res.json({ success: true, data: encounters });
    } catch (error) {
      console.error('Error fetching encounters:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch encounters' });
    }
  }

  async getEncountersByDateRange(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ success: false, error: 'Start and end dates required' });
        return;
      }

      const encounters = await EncounterService.getEncountersByDateRange(
        providerId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ success: true, data: encounters });
    } catch (error) {
      console.error('Error fetching encounters:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch encounters' });
    }
  }

  async updateEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const updates: UpdateEncounterRequest = req.body;

      const encounter = await EncounterService.updateEncounter(encounterId, updates);
      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error updating encounter:', error);
      res.status(500).json({ success: false, error: 'Failed to update encounter' });
    }
  }

  async startEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const encounter = await EncounterService.startEncounter(encounterId);

      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error starting encounter:', error);
      res.status(500).json({ success: false, error: 'Failed to start encounter' });
    }
  }

  async completeEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const encounter = await EncounterService.completeEncounter(encounterId);

      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error completing encounter:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete encounter',
      });
    }
  }

  async signEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const signRequest: SignDocumentRequest = {
        ...req.body,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      };

      const encounter = await EncounterService.signEncounter(encounterId, signRequest);
      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error signing encounter:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign encounter',
      });
    }
  }

  async cancelEncounter(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ success: false, error: 'Cancellation reason required' });
        return;
      }

      const encounter = await EncounterService.cancelEncounter(encounterId, reason);
      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error cancelling encounter:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel encounter',
      });
    }
  }

  async addDiagnosisCodes(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const { icd10Codes } = req.body;

      if (!icd10Codes || !Array.isArray(icd10Codes)) {
        res.status(400).json({ success: false, error: 'ICD-10 codes array required' });
        return;
      }

      const encounter = await EncounterService.addDiagnosisCodes(encounterId, icd10Codes);
      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error adding diagnosis codes:', error);
      res.status(500).json({ success: false, error: 'Failed to add diagnosis codes' });
    }
  }

  async addProcedureCodes(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const { cptCodes } = req.body;

      if (!cptCodes || !Array.isArray(cptCodes)) {
        res.status(400).json({ success: false, error: 'CPT codes array required' });
        return;
      }

      const encounter = await EncounterService.addProcedureCodes(encounterId, cptCodes);
      if (!encounter) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: encounter });
    } catch (error) {
      console.error('Error adding procedure codes:', error);
      res.status(500).json({ success: false, error: 'Failed to add procedure codes' });
    }
  }

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const providerId = req.user?.id || req.query.providerId as string;

      if (!providerId) {
        res.status(400).json({ success: false, error: 'Provider ID required' });
        return;
      }

      const stats = await EncounterService.getDashboardStats(providerId);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
  }

  async getEncounterSummary(req: Request, res: Response): Promise<void> {
    try {
      const { encounterId } = req.params;
      const summary = await EncounterService.getEncounterSummary(encounterId);

      if (!summary) {
        res.status(404).json({ success: false, error: 'Encounter not found' });
        return;
      }

      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('Error fetching encounter summary:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch encounter summary' });
    }
  }
}

const encounterController = new EncounterController();
export default encounterController;
