import { Request, Response } from 'express';
import { ClaimsService } from '../services/ClaimsService';
import { EDIService } from '../services/EDIService';

export class ClaimsController {
  private claimsService: ClaimsService;
  private ediService: EDIService;

  constructor() {
    this.claimsService = new ClaimsService();
    this.ediService = new EDIService();
  }

  async getClaims(req: Request, res: Response): Promise<Response> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        payerId,
        patientId,
        providerId,
        startDate,
        endDate,
        search
      } = req.query;

      const filters = {
        status: status as string,
        payerId: payerId as string,
        patientId: patientId as string,
        providerId: providerId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string
      };

      const result = await this.claimsService.getClaims(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.claims,
        pagination: result.pagination,
        summary: result.summary
      });
    } catch (error) {
      console.error('Error in getClaims:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve claims',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getClaimById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const claim = await this.claimsService.getClaimById(id);

      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: claim
      });
    } catch (error) {
      console.error('Error in getClaimById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve claim',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createClaim(req: Request, res: Response): Promise<Response> {
    try {
      const claimData = req.body;
      const userId = (req as any).user?.id;

      // Validate claim data
      const validation = await this.claimsService.validateClaim(claimData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid claim data',
          errors: validation.errors
        });
      }

      const claim = await this.claimsService.createClaim(claimData, userId);

      return res.status(201).json({
        success: true,
        message: 'Claim created successfully',
        data: claim
      });
    } catch (error) {
      console.error('Error in createClaim:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create claim',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateClaim(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = (req as any).user?.id;

      // Check if claim is in editable status
      const claim = await this.claimsService.getClaimById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      if (!['draft', 'rejected', 'denied'].includes(claim.status)) {
        return res.status(400).json({
          success: false,
          message: 'Claim cannot be edited in current status'
        });
      }

      const updatedClaim = await this.claimsService.updateClaim(id, updates, userId);

      return res.status(200).json({
        success: true,
        message: 'Claim updated successfully',
        data: updatedClaim
      });
    } catch (error) {
      console.error('Error in updateClaim:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update claim',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteClaim(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      // Check if claim is in deletable status
      const claim = await this.claimsService.getClaimById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      if (!['draft', 'rejected'].includes(claim.status)) {
        return res.status(400).json({
          success: false,
          message: 'Claim cannot be deleted in current status. Consider voiding instead.'
        });
      }

      await this.claimsService.voidClaim(id, reason, userId);

      return res.status(200).json({
        success: true,
        message: 'Claim voided successfully'
      });
    } catch (error) {
      console.error('Error in deleteClaim:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to void claim',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async submitClaim(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { submissionMethod = 'electronic' } = req.body;
      const userId = (req as any).user?.id;

      // Validate claim before submission
      const claim = await this.claimsService.getClaimById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      const validation = await this.claimsService.validateClaim(claim);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Claim validation failed',
          errors: validation.errors
        });
      }

      // Generate EDI 837 if electronic submission
      let edi837Data = null;
      if (submissionMethod === 'electronic') {
        edi837Data = await this.ediService.generate837(claim);
      }

      const result = await this.claimsService.submitClaim(id, submissionMethod, edi837Data, userId);

      return res.status(200).json({
        success: true,
        message: 'Claim submitted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in submitClaim:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit claim',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async resubmitClaim(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { correctionCode, notes } = req.body;
      const userId = (req as any).user?.id;

      const claim = await this.claimsService.getClaimById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      if (!['denied', 'rejected'].includes(claim.status)) {
        return res.status(400).json({
          success: false,
          message: 'Only denied or rejected claims can be resubmitted'
        });
      }

      const result = await this.claimsService.resubmitClaim(id, correctionCode, notes, userId);

      return res.status(200).json({
        success: true,
        message: 'Claim resubmitted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in resubmitClaim:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to resubmit claim',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async checkClaimStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const status = await this.claimsService.checkClaimStatus(id, userId);

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error in checkClaimStatus:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check claim status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getClaimHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const history = await this.claimsService.getClaimHistory(id);

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error in getClaimHistory:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve claim history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createAppeal(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const appealData = req.body;
      const userId = (req as any).user?.id;

      const claim = await this.claimsService.getClaimById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      if (claim.status !== 'denied') {
        return res.status(400).json({
          success: false,
          message: 'Only denied claims can be appealed'
        });
      }

      const appeal = await this.claimsService.createAppeal(id, appealData, userId);

      return res.status(201).json({
        success: true,
        message: 'Appeal created successfully',
        data: appeal
      });
    } catch (error) {
      console.error('Error in createAppeal:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create appeal',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getClaimsByBatch(req: Request, res: Response): Promise<Response> {
    try {
      const { batchId } = req.params;
      const claims = await this.claimsService.getClaimsByBatch(batchId);

      return res.status(200).json({
        success: true,
        data: claims
      });
    } catch (error) {
      console.error('Error in getClaimsByBatch:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve batch claims',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async submitBatchClaims(req: Request, res: Response): Promise<Response> {
    try {
      const { claimIds, submissionMethod = 'electronic' } = req.body;
      const userId = (req as any).user?.id;

      if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid claim IDs provided'
        });
      }

      const result = await this.claimsService.submitBatchClaims(claimIds, submissionMethod, userId);

      return res.status(200).json({
        success: true,
        message: 'Batch claims submitted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in submitBatchClaims:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit batch claims',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getClaimsStats(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate, groupBy } = req.query;

      const stats = await this.claimsService.getClaimsStats(
        startDate as string,
        endDate as string,
        groupBy as string
      );

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getClaimsStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve claims statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
