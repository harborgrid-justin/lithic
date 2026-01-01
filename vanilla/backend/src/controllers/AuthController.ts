import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import { MFAService } from "../services/MFAService";
import { SessionService } from "../services/SessionService";

/**
 * AuthController - Handles authentication endpoints
 */
export class AuthController {
  private authService: AuthService;
  private userService: UserService;
  private mfaService: MFAService;
  private sessionService: SessionService;

  constructor(
    authService: AuthService,
    userService: UserService,
    mfaService: MFAService,
    sessionService: SessionService,
  ) {
    this.authService = authService;
    this.userService = userService;
    this.mfaService = mfaService;
    this.sessionService = sessionService;
  }

  /**
   * POST /auth/login
   * Login with email and password
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, mfaToken } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      const tokens = await this.authService.login({
        email,
        password,
        mfaToken,
        ipAddress,
        userAgent,
      });

      // If MFA is required
      if (tokens.requireMFA) {
        res.status(200).json({
          success: true,
          requireMFA: true,
          tempToken: tokens.tempToken,
          message: "MFA verification required",
        });
        return;
      }

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || "Login failed",
      });
    }
  };

  /**
   * POST /auth/mfa/verify
   * Complete MFA login
   */
  verifyMFA = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tempToken, mfaToken } = req.body;

      if (!tempToken || !mfaToken) {
        res.status(400).json({
          success: false,
          error: "Temporary token and MFA token are required",
        });
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      const tokens = await this.authService.completeMFALogin(
        tempToken,
        mfaToken,
        ipAddress,
        userAgent,
      );

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || "MFA verification failed",
      });
    }
  };

  /**
   * POST /auth/logout
   * Logout user and invalidate session
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = (req as any).user?.sessionId;

      if (sessionId) {
        await this.authService.logout(sessionId);
      }

      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Logout failed",
      });
    }
  };

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: "Refresh token is required",
        });
        return;
      }

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      // Update refresh token cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || "Token refresh failed",
      });
    }
  };

  /**
   * POST /auth/register
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, organizationId, roles } =
        req.body;

      if (!email || !password || !firstName || !lastName || !organizationId) {
        res.status(400).json({
          success: false,
          error: "All required fields must be provided",
        });
        return;
      }

      // Validate password strength
      const passwordValidation =
        this.authService.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: "User with this email already exists",
        });
        return;
      }

      // Create user (createdBy would be admin or system)
      const createdBy = (req as any).user?.userId || "system";
      const user = await this.userService.createUser(
        {
          email,
          password,
          firstName,
          lastName,
          organizationId,
          roles,
        },
        createdBy,
      );

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Registration failed",
      });
    }
  };

  /**
   * POST /auth/change-password
   * Change user password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: "Old password and new password are required",
        });
        return;
      }

      // Validate new password strength
      const passwordValidation =
        this.authService.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        });
        return;
      }

      const success = await this.userService.changePassword(
        userId,
        oldPassword,
        newPassword,
      );

      if (!success) {
        res.status(401).json({
          success: false,
          error: "Invalid old password",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Password change failed",
      });
    }
  };

  /**
   * GET /auth/me
   * Get current user info
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      const user = await this.userService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
          roles: user.roles,
          isMFAEnabled: user.isMFAEnabled,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get user info",
      });
    }
  };

  /**
   * GET /auth/sessions
   * Get user's active sessions
   */
  getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      const sessions = await this.sessionService.getUserSessions(userId);

      res.status(200).json({
        success: true,
        sessions: sessions.map((s) => ({
          id: s.id,
          ipAddress: s.ipAddress,
          deviceInfo: s.deviceInfo,
          createdAt: s.createdAt,
          lastActivityAt: s.lastActivityAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get sessions",
      });
    }
  };

  /**
   * DELETE /auth/sessions/:sessionId
   * Terminate a specific session
   */
  terminateSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user?.userId;

      // Verify session belongs to user
      const session = await this.sessionService.getSession(sessionId);

      if (!session || session.userId !== userId) {
        res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
        return;
      }

      await this.sessionService.invalidateSession(sessionId);

      res.status(200).json({
        success: true,
        message: "Session terminated successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to terminate session",
      });
    }
  };
}
