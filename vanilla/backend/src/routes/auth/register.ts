import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';

/**
 * Registration route
 */
export function createRegisterRoute(authController: AuthController): Router {
  const router = Router();

  /**
   * POST /auth/register
   * Register a new user
   */
  router.post('/', authController.register);

  return router;
}
