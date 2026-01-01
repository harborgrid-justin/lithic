/**
 * Security tRPC Router
 * API endpoints for security operations
 * Lithic Enterprise Healthcare Platform v0.3
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { AuditLogger, queryAuditLogs, getAuditStatistics } from "@/lib/security/audit-logger";
import { AccessControlEngine } from "@/lib/security/access-control";
import { MFAService } from "@/lib/security/authentication/mfa";
import { SessionManager } from "@/lib/security/authentication/session-manager";
import { PasswordPolicyService } from "@/lib/security/authentication/password-policy";
import { AccountLockoutService } from "@/lib/security/authentication/account-lockout";
import { HIPAAComplianceService } from "@/lib/security/compliance/hipaa-controls";
import { SOC2ComplianceService } from "@/lib/security/compliance/soc2-controls";
import { RiskAssessmentService } from "@/lib/security/compliance/risk-assessment";

export const securityRouter = createTRPCRouter({
  // ============================================================================
  // Audit Logs
  // ============================================================================

  queryAuditLogs: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        userId: z.string().optional(),
        action: z.string().optional(),
        resource: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await queryAuditLogs(input);
    }),

  getAuditStatistics: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ input }) => {
      return await getAuditStatistics(
        input.organizationId,
        input.startDate,
        input.endDate,
      );
    }),

  exportAuditLogs: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        format: z.enum(["json", "csv"]),
      }),
    )
    .mutation(async ({ input }) => {
      return await AuditLogger.export(input, input.format);
    }),

  // ============================================================================
  // MFA
  // ============================================================================

  setupTOTP: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      return await MFAService.setupTOTP(input.userId);
    }),

  verifyTOTP: protectedProcedure
    .input(z.object({ userId: z.string(), token: z.string() }))
    .mutation(async ({ input }) => {
      return await MFAService.verifyTOTP(input.userId, input.token);
    }),

  disableMFA: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      return await MFAService.disableMFA(input.userId);
    }),

  regenerateBackupCodes: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      return await MFAService.regenerateBackupCodes(input.userId);
    }),

  // ============================================================================
  // Sessions
  // ============================================================================

  getUserSessions: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await SessionManager.getUserSessions(input.userId);
    }),

  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string(), reason: z.string() }))
    .mutation(async ({ input }) => {
      return await SessionManager.revokeSession(input.sessionId, input.reason);
    }),

  revokeAllSessions: protectedProcedure
    .input(z.object({ userId: z.string(), exceptSessionId: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await SessionManager.revokeAllUserSessions(
        input.userId,
        input.exceptSessionId,
      );
    }),

  // ============================================================================
  // Password Policy
  // ============================================================================

  validatePassword: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        userId: z.string().optional(),
        organizationId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return await PasswordPolicyService.validatePassword(
        input.password,
        input.userId,
        input.organizationId,
      );
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        currentPassword: z.string(),
        newPassword: z.string(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await PasswordPolicyService.changePassword(
        input.userId,
        input.currentPassword,
        input.newPassword,
        input.organizationId,
      );
    }),

  // ============================================================================
  // Access Control
  // ============================================================================

  evaluateAccess: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        organizationId: z.string(),
        resource: z.string(),
        resourceId: z.string().optional(),
        action: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return await AccessControlEngine.evaluate(input);
    }),

  // ============================================================================
  // Compliance
  // ============================================================================

  getHIPAACompliance: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return await HIPAAComplianceService.assessCompliance(input.organizationId);
    }),

  getSOC2Compliance: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return await SOC2ComplianceService.assessCompliance(input.organizationId);
    }),

  getRiskAssessments: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return await RiskAssessmentService.listRisks(input.organizationId);
    }),

  getOrganizationRiskScore: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return await RiskAssessmentService.getRiskScore(input.organizationId);
    }),

  // ============================================================================
  // Account Lockout
  // ============================================================================

  isAccountLocked: protectedProcedure
    .input(z.object({ userId: z.string(), organizationId: z.string() }))
    .query(async ({ input }) => {
      return await AccountLockoutService.isAccountLocked(
        input.userId,
        input.organizationId,
      );
    }),

  unlockAccount: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        unlockedBy: z.string(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return await AccountLockoutService.unlockAccount(
        input.userId,
        input.unlockedBy,
        input.organizationId,
      );
    }),

  getLoginHistory: protectedProcedure
    .input(z.object({ userId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await AccountLockoutService.getLoginHistory(
        input.userId,
        input.limit,
      );
    }),
});
