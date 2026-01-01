import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { Request, Response } from 'express';
import { MFAService } from '../../services/MFAService';

/**
 * MFA routes
 */
export function createMFARoute(
  authController: AuthController,
  mfaService: MFAService
): Router {
  const router = Router();

  /**
   * POST /auth/mfa/verify
   * Verify MFA token during login
   */
  router.post('/verify', authController.verifyMFA);

  /**
   * POST /auth/mfa/setup
   * Setup MFA for authenticated user
   */
  router.post('/setup', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const userEmail = (req as any).user?.email;

      if (!userId || !userEmail) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const mfaSetup = await mfaService.setupMFA(userId, userEmail);

      res.status(200).json({
        success: true,
        secret: mfaSetup.secret,
        qrCode: mfaSetup.qrCodeUrl,
        backupCodes: mfaSetup.backupCodes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'MFA setup failed',
      });
    }
  });

  /**
   * POST /auth/mfa/enable
   * Enable MFA after setup
   */
  router.post('/enable', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const userEmail = (req as any).user?.email;
      const organizationId = (req as any).user?.organizationId;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'MFA token is required',
        });
        return;
      }

      const success = await mfaService.enableMFA(
        userId,
        userEmail,
        organizationId,
        token
      );

      if (!success) {
        res.status(400).json({
          success: false,
          error: 'Invalid MFA token',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'MFA enabled successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to enable MFA',
      });
    }
  });

  /**
   * POST /auth/mfa/disable
   * Disable MFA
   */
  router.post('/disable', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const userEmail = (req as any).user?.email;
      const organizationId = (req as any).user?.organizationId;
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'MFA token is required',
        });
        return;
      }

      const success = await mfaService.disableMFA(
        userId,
        userEmail,
        organizationId,
        token
      );

      if (!success) {
        res.status(400).json({
          success: false,
          error: 'Invalid MFA token or MFA not enabled',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'MFA disabled successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to disable MFA',
      });
    }
  });

  /**
   * POST /auth/mfa/backup-codes/regenerate
   * Regenerate backup codes
   */
  router.post('/backup-codes/regenerate', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      const backupCodes = await mfaService.regenerateBackupCodes(userId);

      res.status(200).json({
        success: true,
        backupCodes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to regenerate backup codes',
      });
    }
  });

  /**
   * GET /auth/mfa/status
   * Get MFA status for current user
   */
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      const enabled = await mfaService.isMFAEnabled(userId);

      res.status(200).json({
        success: true,
        enabled,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get MFA status',
      });
    }
  });

  return router;
}
