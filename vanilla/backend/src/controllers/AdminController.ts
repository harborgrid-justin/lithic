import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { RoleService } from "../services/RoleService";
import { AuditService } from "../services/AuditService";
import { SessionService } from "../services/SessionService";
import { MFAService } from "../services/MFAService";

/**
 * AdminController - Handles administrative endpoints
 */
export class AdminController {
  private userService: UserService;
  private roleService: RoleService;
  private auditService: AuditService;
  private sessionService: SessionService;
  private mfaService: MFAService;

  constructor(
    userService: UserService,
    roleService: RoleService,
    auditService: AuditService,
    sessionService: SessionService,
    mfaService: MFAService,
  ) {
    this.userService = userService;
    this.roleService = roleService;
    this.auditService = auditService;
    this.sessionService = sessionService;
    this.mfaService = mfaService;
  }

  // ============================================
  // User Management
  // ============================================

  /**
   * GET /admin/users
   * Get all users in organization
   */
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;
      const { limit = 100, offset = 0, search } = req.query;

      let users;

      if (search) {
        users = await this.userService.searchUsers(
          organizationId,
          search as string,
          Number(limit),
        );
      } else {
        users = await this.userService.getUsersByOrganization(
          organizationId,
          Number(limit),
          Number(offset),
        );
      }

      res.status(200).json({
        success: true,
        users,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get users",
      });
    }
  };

  /**
   * GET /admin/users/:userId
   * Get user by ID
   */
  getUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const user = await this.userService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      // Get user roles
      const roles = await this.roleService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        user: {
          ...user,
          roles: roles.map((r) => r.name),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get user",
      });
    }
  };

  /**
   * POST /admin/users
   * Create new user
   */
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as any).user?.userId;
      const organizationId = (req as any).user?.organizationId;
      const { email, password, firstName, lastName, roles, metadata } =
        req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: "All required fields must be provided",
        });
        return;
      }

      const user = await this.userService.createUser(
        {
          email,
          password,
          firstName,
          lastName,
          organizationId,
          roles,
          metadata,
        },
        adminId,
      );

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create user",
      });
    }
  };

  /**
   * PUT /admin/users/:userId
   * Update user
   */
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = (req as any).user?.userId;
      const updates = req.body;

      const user = await this.userService.updateUser(userId, updates, adminId);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update user",
      });
    }
  };

  /**
   * POST /admin/users/:userId/deactivate
   * Deactivate user
   */
  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = (req as any).user?.userId;

      await this.userService.deactivateUser(userId, adminId);

      res.status(200).json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to deactivate user",
      });
    }
  };

  /**
   * POST /admin/users/:userId/activate
   * Activate user
   */
  activateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = (req as any).user?.userId;

      await this.userService.activateUser(userId, adminId);

      res.status(200).json({
        success: true,
        message: "User activated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to activate user",
      });
    }
  };

  /**
   * POST /admin/users/:userId/reset-password
   * Reset user password (admin function)
   */
  resetUserPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      const adminId = (req as any).user?.userId;

      if (!newPassword) {
        res.status(400).json({
          success: false,
          error: "New password is required",
        });
        return;
      }

      await this.userService.resetPassword(userId, newPassword, adminId);

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to reset password",
      });
    }
  };

  // ============================================
  // Role Management
  // ============================================

  /**
   * GET /admin/roles
   * Get all roles
   */
  getRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;

      const roles = await this.roleService.getOrganizationRoles(organizationId);

      res.status(200).json({
        success: true,
        roles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get roles",
      });
    }
  };

  /**
   * POST /admin/users/:userId/roles
   * Assign role to user
   */
  assignRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { roleName } = req.body;
      const adminId = (req as any).user?.userId;
      const organizationId = (req as any).user?.organizationId;

      if (!roleName) {
        res.status(400).json({
          success: false,
          error: "Role name is required",
        });
        return;
      }

      await this.roleService.assignRoleToUser(
        userId,
        roleName,
        organizationId,
        adminId,
      );

      res.status(200).json({
        success: true,
        message: "Role assigned successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to assign role",
      });
    }
  };

  /**
   * DELETE /admin/users/:userId/roles/:roleName
   * Revoke role from user
   */
  revokeRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, roleName } = req.params;
      const adminId = (req as any).user?.userId;
      const organizationId = (req as any).user?.organizationId;

      await this.roleService.revokeRoleFromUser(
        userId,
        roleName,
        organizationId,
        adminId,
      );

      res.status(200).json({
        success: true,
        message: "Role revoked successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to revoke role",
      });
    }
  };

  /**
   * GET /admin/permissions
   * Get all available permissions
   */
  getPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real implementation, this would fetch from database
      // For now, return a static list of resources and actions
      const permissions = {
        resources: [
          "USERS",
          "ROLES",
          "PATIENTS",
          "APPOINTMENTS",
          "MEDICAL_RECORDS",
          "PRESCRIPTIONS",
          "LAB_RESULTS",
          "BILLING",
          "INSURANCE",
          "REPORTS",
          "SETTINGS",
          "AUDIT_LOGS",
        ],
        actions: [
          "CREATE",
          "READ",
          "UPDATE",
          "DELETE",
          "EXPORT",
          "PRINT",
          "MANAGE",
        ],
      };

      res.status(200).json({
        success: true,
        permissions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get permissions",
      });
    }
  };

  // ============================================
  // Audit Logs
  // ============================================

  /**
   * GET /admin/audit-logs
   * Get audit logs
   */
  getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;
      const {
        userId,
        action,
        resourceType,
        phiAccessed,
        startDate,
        endDate,
        limit = 100,
        offset = 0,
      } = req.query;

      const filters: any = {
        organizationId,
        limit: Number(limit),
        offset: Number(offset),
      };

      if (userId) filters.userId = userId as string;
      if (action) filters.action = action;
      if (resourceType) filters.resourceType = resourceType;
      if (phiAccessed !== undefined)
        filters.phiAccessed = phiAccessed === "true";
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const logs = await this.auditService.getLogs(filters);

      res.status(200).json({
        success: true,
        logs,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get audit logs",
      });
    }
  };

  /**
   * GET /admin/audit-logs/statistics
   * Get audit log statistics
   */
  getAuditStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;

      const statistics = await this.auditService.getStatistics(organizationId);

      res.status(200).json({
        success: true,
        statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get statistics",
      });
    }
  };

  /**
   * POST /admin/audit-logs/export
   * Export audit logs
   */
  exportAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;
      const { startDate, endDate, format = "json" } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: "Start date and end date are required",
        });
        return;
      }

      const exportData = await this.auditService.exportLogs({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        organizationId,
        format: format as "json" | "csv",
      });

      const contentType = format === "csv" ? "text/csv" : "application/json";
      const filename = `audit-logs-${startDate}-${endDate}.${format}`;

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.status(200).send(exportData);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to export audit logs",
      });
    }
  };

  // ============================================
  // Session Management
  // ============================================

  /**
   * GET /admin/sessions/statistics
   * Get session statistics
   */
  getSessionStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req as any).user?.organizationId;

      const statistics =
        await this.sessionService.getSessionStatistics(organizationId);

      res.status(200).json({
        success: true,
        statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get session statistics",
      });
    }
  };

  /**
   * DELETE /admin/users/:userId/sessions
   * Terminate all sessions for a user
   */
  terminateUserSessions = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { userId } = req.params;

      const count = await this.sessionService.invalidateAllUserSessions(userId);

      res.status(200).json({
        success: true,
        message: `Terminated ${count} session(s)`,
        count,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to terminate sessions",
      });
    }
  };

  // ============================================
  // Organization Management
  // ============================================

  /**
   * GET /admin/organizations/:organizationId
   * Get organization details
   */
  getOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;

      // In production, this would fetch from organizations table
      // For now, return mock data
      res.status(200).json({
        success: true,
        organization: {
          id: organizationId,
          name: "Sample Healthcare Organization",
          type: "hospital",
          settings: {
            mfaRequired: true,
            sessionTimeout: 30,
            passwordPolicy: {
              minLength: 12,
              requireSpecialChars: true,
              requireNumbers: true,
              expiryDays: 90,
            },
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get organization",
      });
    }
  };

  /**
   * PUT /admin/organizations/:organizationId
   * Update organization settings
   */
  updateOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const updates = req.body;

      // In production, this would update organizations table
      res.status(200).json({
        success: true,
        message: "Organization updated successfully",
        organization: {
          id: organizationId,
          ...updates,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update organization",
      });
    }
  };

  // ============================================
  // MFA Statistics
  // ============================================

  /**
   * GET /admin/mfa/statistics
   * Get MFA adoption statistics
   */
  getMFAStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.mfaService.getMFAStatistics();

      res.status(200).json({
        success: true,
        statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get MFA statistics",
      });
    }
  };
}
