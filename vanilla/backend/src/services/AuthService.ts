import jwt from "jsonwebtoken";
import { Pool } from "pg";
import { UserService } from "./UserService";
import { SessionService } from "./SessionService";
import { MFAService } from "./MFAService";
import { AuditService, AuditAction, ResourceType } from "./AuditService";
import { RoleService } from "./RoleService";

/**
 * AuthService - Authentication service with JWT, MFA, and session management
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requireMFA?: boolean;
  tempToken?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  roles: string[];
  sessionId: string;
  type: "access" | "refresh" | "mfa-temp";
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
  ipAddress: string;
  userAgent: string;
}

export class AuthService {
  private userService: UserService;
  private sessionService: SessionService;
  private mfaService: MFAService;
  private auditService: AuditService;
  private roleService: RoleService;

  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = "15m";
  private readonly refreshTokenExpiry = "7d";
  private readonly mfaTempTokenExpiry = "5m";

  constructor(
    userService: UserService,
    sessionService: SessionService,
    mfaService: MFAService,
    auditService: AuditService,
    roleService: RoleService,
  ) {
    this.userService = userService;
    this.sessionService = sessionService;
    this.mfaService = mfaService;
    this.auditService = auditService;
    this.roleService = roleService;

    this.accessTokenSecret =
      process.env.JWT_ACCESS_SECRET || "access-secret-change-in-production";
    this.refreshTokenSecret =
      process.env.JWT_REFRESH_SECRET || "refresh-secret-change-in-production";

    if (
      this.accessTokenSecret === "access-secret-change-in-production" ||
      this.refreshTokenSecret === "refresh-secret-change-in-production"
    ) {
      console.warn(
        "WARNING: Using default JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production!",
      );
    }
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { email, password, mfaToken, ipAddress, userAgent } = credentials;

    // Verify credentials
    const user = await this.userService.verifyPassword(email, password);

    if (!user) {
      // Audit failed login
      await this.auditService.log({
        userId: email,
        userEmail: email,
        organizationId: "unknown",
        action: AuditAction.LOGIN_FAILED,
        resourceType: ResourceType.USER,
        status: "failure",
        ipAddress,
        userAgent,
        details: { reason: "Invalid credentials" },
        severity: "medium",
      });

      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      await this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: AuditAction.LOGIN_FAILED,
        resourceType: ResourceType.USER,
        resourceId: user.id,
        status: "failure",
        ipAddress,
        userAgent,
        details: { reason: "Account deactivated" },
        severity: "high",
      });

      throw new Error("Account is deactivated");
    }

    // Check MFA requirement
    const mfaEnabled = await this.mfaService.isMFAEnabled(user.id);

    if (mfaEnabled && !mfaToken) {
      // Return temporary token for MFA verification
      const tempToken = this.generateMFATempToken(user);

      return {
        accessToken: "",
        refreshToken: "",
        expiresIn: 0,
        requireMFA: true,
        tempToken,
      };
    }

    // Verify MFA if enabled
    if (mfaEnabled && mfaToken) {
      const mfaValid = await this.mfaService.verifyMFA(user.id, mfaToken);

      if (!mfaValid) {
        await this.auditService.log({
          userId: user.id,
          userEmail: user.email,
          organizationId: user.organizationId,
          action: AuditAction.LOGIN_FAILED,
          resourceType: ResourceType.USER,
          resourceId: user.id,
          status: "failure",
          ipAddress,
          userAgent,
          details: { reason: "Invalid MFA token" },
          severity: "high",
        });

        throw new Error("Invalid MFA token");
      }

      // Audit MFA verification
      await this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        action: AuditAction.MFA_VERIFIED,
        resourceType: ResourceType.USER,
        resourceId: user.id,
        status: "success",
        ipAddress,
        userAgent,
        severity: "low",
      });
    }

    // Create session
    const session = await this.sessionService.createSession(
      user.id,
      user.email,
      user.organizationId,
      ipAddress,
      userAgent,
    );

    // Update last login
    await this.userService.updateLastLogin(user.id);

    // Get user roles
    const roles = await this.roleService.getUserRoles(user.id);
    const roleNames = roles.map((r) => r.name);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: roleNames,
      sessionId: session.id,
      type: "access",
    });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionService.invalidateSession(sessionId, "User logout");
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken,
        this.refreshTokenSecret,
      ) as TokenPayload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Validate session
      const session = await this.sessionService.validateSession(
        payload.sessionId,
        "", // IP validation can be added here
      );

      if (!session) {
        throw new Error("Invalid session");
      }

      // Get user
      const user = await this.userService.getUserById(payload.userId);

      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      // Get user roles
      const roles = await this.roleService.getUserRoles(user.id);
      const roleNames = roles.map((r) => r.name);

      // Generate new tokens
      return this.generateTokens({
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        roles: roleNames,
        sessionId: session.id,
        type: "access",
      });
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as TokenPayload;

      if (payload.type !== "access") {
        return null;
      }

      // Validate session
      const session = await this.sessionService.validateSession(
        payload.sessionId,
        "", // IP can be validated here
      );

      if (!session) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify MFA temporary token
   */
  verifyMFATempToken(tempToken: string): TokenPayload | null {
    try {
      const payload = jwt.verify(
        tempToken,
        this.accessTokenSecret,
      ) as TokenPayload;

      if (payload.type !== "mfa-temp") {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Complete MFA login
   */
  async completeMFALogin(
    tempToken: string,
    mfaToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthTokens> {
    // Verify temp token
    const tempPayload = this.verifyMFATempToken(tempToken);

    if (!tempPayload) {
      throw new Error("Invalid or expired temporary token");
    }

    // Verify MFA
    const mfaValid = await this.mfaService.verifyMFA(
      tempPayload.userId,
      mfaToken,
    );

    if (!mfaValid) {
      await this.auditService.log({
        userId: tempPayload.userId,
        userEmail: tempPayload.email,
        organizationId: tempPayload.organizationId,
        action: AuditAction.LOGIN_FAILED,
        resourceType: ResourceType.USER,
        resourceId: tempPayload.userId,
        status: "failure",
        ipAddress,
        userAgent,
        details: { reason: "Invalid MFA token" },
        severity: "high",
      });

      throw new Error("Invalid MFA token");
    }

    // Create session
    const session = await this.sessionService.createSession(
      tempPayload.userId,
      tempPayload.email,
      tempPayload.organizationId,
      ipAddress,
      userAgent,
    );

    // Update last login
    await this.userService.updateLastLogin(tempPayload.userId);

    // Generate tokens
    return this.generateTokens({
      userId: tempPayload.userId,
      email: tempPayload.email,
      organizationId: tempPayload.organizationId,
      roles: tempPayload.roles,
      sessionId: session.id,
      type: "access",
    });
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessPayload = { ...payload, type: "access" };
    const refreshPayload = { ...payload, type: "refresh" };

    const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Generate MFA temporary token
   */
  private generateMFATempToken(user: any): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: [],
      sessionId: "",
      type: "mfa-temp",
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.mfaTempTokenExpiry,
    });
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push("Password must be at least 12 characters long");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
