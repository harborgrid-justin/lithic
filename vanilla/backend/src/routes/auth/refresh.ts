import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';

/**
 * Token refresh route
 */
export function createRefreshRoute(authController: AuthController): Router {
  const router = Router();

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  router.post('/', authController.refreshToken);

  return router;
}
