import { Router } from "express";
import { AuthController } from "../../controllers/AuthController";

/**
 * Logout route
 */
export function createLogoutRoute(authController: AuthController): Router {
  const router = Router();

  /**
   * POST /auth/logout
   * Logout user and invalidate session
   */
  router.post("/", authController.logout);

  return router;
}
