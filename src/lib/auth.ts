import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import { logAudit } from "./audit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/error",
    verifyRequest: "/verify-request",
    newUser: "/welcome",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "MFA Code", type: "text", optional: true },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
            organization: true,
          },
        });

        if (!user || !user.password) {
          // Log failed login attempt
          await logAudit({
            action: "LOGIN_FAILED",
            resource: "User",
            description: `Failed login attempt for email: ${credentials.email}`,
            metadata: {
              email: credentials.email,
              reason: "User not found or no password set",
            },
            ipAddress:
              (req.headers?.["x-forwarded-for"] as string) ||
              (req.headers?.["x-real-ip"] as string) ||
              "unknown",
          });

          throw new Error("Invalid credentials");
        }

        // Check if account is locked
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          const lockTimeRemaining = Math.ceil(
            (new Date(user.lockedUntil).getTime() - Date.now()) / 1000 / 60,
          );

          await logAudit({
            userId: user.id,
            action: "LOGIN_FAILED",
            resource: "User",
            description: `Login attempt on locked account`,
            metadata: {
              email: credentials.email,
              lockTimeRemaining,
            },
            organizationId: user.organizationId,
            ipAddress:
              (req.headers?.["x-forwarded-for"] as string) ||
              (req.headers?.["x-real-ip"] as string) ||
              "unknown",
          });

          throw new Error(
            `Account is locked. Please try again in ${lockTimeRemaining} minutes.`,
          );
        }

        // Check if account is active
        if (user.status !== "ACTIVE") {
          await logAudit({
            userId: user.id,
            action: "LOGIN_FAILED",
            resource: "User",
            description: `Login attempt on ${user.status} account`,
            metadata: {
              email: credentials.email,
              status: user.status,
            },
            organizationId: user.organizationId,
            ipAddress:
              (req.headers?.["x-forwarded-for"] as string) ||
              (req.headers?.["x-real-ip"] as string) ||
              "unknown",
          });

          throw new Error(`Account is ${user.status.toLowerCase()}`);
        }

        // Check organization status
        if (user.organization.status !== "ACTIVE") {
          throw new Error("Organization is not active");
        }

        // Verify password
        const isPasswordValid = await compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          // Increment failed login attempts
          const failedAttempts = user.failedLoginAttempts + 1;
          const shouldLock = failedAttempts >= 5;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failedAttempts,
              lockedUntil: shouldLock
                ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
                : undefined,
            },
          });

          await logAudit({
            userId: user.id,
            action: shouldLock ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
            resource: "User",
            description: shouldLock
              ? "Account locked due to multiple failed login attempts"
              : "Failed login attempt - invalid password",
            metadata: {
              email: credentials.email,
              failedAttempts,
            },
            organizationId: user.organizationId,
            ipAddress:
              (req.headers?.["x-forwarded-for"] as string) ||
              (req.headers?.["x-real-ip"] as string) ||
              "unknown",
          });

          throw new Error("Invalid credentials");
        }

        // Check MFA if enabled
        if (user.mfaEnabled) {
          if (!credentials.mfaCode) {
            // Return a special indicator that MFA is required
            throw new Error("MFA_REQUIRED");
          }

          // Verify MFA code (implemented in mfa.ts)
          const { verifyTOTP } = await import("./mfa");
          const isMFAValid = await verifyTOTP(user.id, credentials.mfaCode);

          if (!isMFAValid) {
            await logAudit({
              userId: user.id,
              action: "LOGIN_FAILED",
              resource: "User",
              description: "Failed MFA verification",
              metadata: {
                email: credentials.email,
              },
              organizationId: user.organizationId,
              ipAddress:
                (req.headers?.["x-forwarded-for"] as string) ||
                (req.headers?.["x-real-ip"] as string) ||
                "unknown",
            });

            throw new Error("Invalid MFA code");
          }
        }

        // Reset failed login attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp:
              (req.headers?.["x-forwarded-for"] as string) ||
              (req.headers?.["x-real-ip"] as string) ||
              "unknown",
          },
        });

        // Log successful login
        await logAudit({
          userId: user.id,
          action: "LOGIN",
          resource: "User",
          description: "User logged in successfully",
          metadata: {
            email: credentials.email,
            mfaUsed: user.mfaEnabled,
          },
          organizationId: user.organizationId,
          ipAddress:
            (req.headers?.["x-forwarded-for"] as string) ||
            (req.headers?.["x-real-ip"] as string) ||
            "unknown",
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role?.name,
          organizationId: user.organizationId,
          status: user.status,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.status = (user as any).status;
      }

      // Update session data
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      // Fetch fresh user data periodically
      if (
        token.id &&
        (!token.lastFetched ||
          Date.now() - (token.lastFetched as number) > 5 * 60 * 1000)
      ) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
            organization: true,
          },
        });

        if (freshUser) {
          token.role = freshUser.role?.name;
          token.status = freshUser.status;
          token.organizationId = freshUser.organizationId;
          token.organizationStatus = freshUser.organization.status;
          token.permissions = freshUser.role?.permissions.map((p) => ({
            resource: p.resource,
            action: p.action,
            scope: p.scope,
          }));
          token.lastFetched = Date.now();
        }
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).status = token.status;
        (session.user as any).permissions = token.permissions;
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        // Revoke all sessions for this user
        await prisma.session.updateMany({
          where: {
            userId: token.id as string,
            isActive: true,
          },
          data: {
            isActive: false,
            revokedAt: new Date(),
            revokedReason: "User signed out",
          },
        });

        // Log sign out
        await logAudit({
          userId: token.id as string,
          action: "LOGOUT",
          resource: "User",
          description: "User logged out",
          organizationId: token.organizationId as string,
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

// For next-auth v5, create a compatibility wrapper
// @ts-ignore - next-auth v5 beta types may not be complete
export async function getServerSession(options?: any) {
  const { getServerSession: getSession } = await import("next-auth");
  return getSession(authOptions);
}
