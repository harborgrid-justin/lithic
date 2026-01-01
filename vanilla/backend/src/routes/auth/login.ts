import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';

/**
 * Login route
 */
export function createLoginRoute(authController: AuthController): Router {
  const router = Router();

  /**
   * POST /auth/login
   * Authenticate user with email and password
   */
  router.post('/', authController.login);

  return router;
}
