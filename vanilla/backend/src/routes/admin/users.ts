import { Router } from 'express';
import { AdminController } from '../../controllers/AdminController';

/**
 * Admin users routes
 */
export function createAdminUsersRoute(adminController: AdminController): Router {
  const router = Router();

  /**
   * GET /admin/users
   * Get all users in organization
   */
  router.get('/', adminController.getUsers);

  /**
   * POST /admin/users
   * Create new user
   */
  router.post('/', adminController.createUser);

  /**
   * GET /admin/users/:userId
   * Get user by ID
   */
  router.get('/:userId', adminController.getUser);

  /**
   * PUT /admin/users/:userId
   * Update user
   */
  router.put('/:userId', adminController.updateUser);

  /**
   * POST /admin/users/:userId/activate
   * Activate user
   */
  router.post('/:userId/activate', adminController.activateUser);

  /**
   * POST /admin/users/:userId/deactivate
   * Deactivate user
   */
  router.post('/:userId/deactivate', adminController.deactivateUser);

  /**
   * POST /admin/users/:userId/reset-password
   * Reset user password
   */
  router.post('/:userId/reset-password', adminController.resetUserPassword);

  /**
   * POST /admin/users/:userId/roles
   * Assign role to user
   */
  router.post('/:userId/roles', adminController.assignRole);

  /**
   * DELETE /admin/users/:userId/roles/:roleName
   * Revoke role from user
   */
  router.delete('/:userId/roles/:roleName', adminController.revokeRole);

  /**
   * DELETE /admin/users/:userId/sessions
   * Terminate all sessions for user
   */
  router.delete('/:userId/sessions', adminController.terminateUserSessions);

  return router;
}
