import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';
import { createSession } from '@/lib/session';
import { generateToken } from '@/lib/encryption';

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleId?: string;
  title?: string;
  npi?: string;
}

export interface LoginData {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterUserData) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      organizationId: data.organizationId,
      title: data.title,
      npi: data.npi,
      status: 'PENDING',
      lastPasswordChange: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
    },
  });

  // Assign role if provided
  if (data.roleId) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: data.roleId,
      },
    });
  }

  // Log user creation
  await logAudit({
    action: 'CREATE',
    resource: 'User',
    resourceId: user.id,
    description: `New user registered: ${user.email}`,
    metadata: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    organizationId: user.organizationId,
  });

  return user;
}

/**
 * Authenticate user
 */
export async function authenticateUser(data: LoginData) {
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
    include: {
      organization: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if account is locked
  if (user.status === 'LOCKED' || user.status === 'SUSPENDED') {
    throw new Error(`Account is ${user.status.toLowerCase()}`);
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.passwordHash);

  if (!isValid) {
    await logAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      resource: 'User',
      description: 'Failed login attempt - invalid password',
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      organizationId: user.organizationId,
    });

    throw new Error('Invalid credentials');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      updatedBy: user.id,
    },
  });

  // Create session
  const session = await createSession({
    userId: user.id,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  // Log successful login
  await logAudit({
    userId: user.id,
    action: 'LOGIN',
    resource: 'User',
    description: 'User logged in successfully',
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    organizationId: user.organizationId,
  });

  return {
    user,
    session,
  };
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, organizationId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      lastPasswordChange: new Date(),
      updatedBy: userId,
    },
  });

  // Log password change
  await logAudit({
    userId,
    action: 'PASSWORD_CHANGED',
    resource: 'User',
    resourceId: userId,
    description: 'User changed their password',
    organizationId: user.organizationId,
  });

  return true;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, firstName: true, organizationId: true },
  });

  if (!user) {
    // Don't reveal if user exists
    return { success: true };
  }

  // Generate reset token
  const resetToken = generateToken(32);
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

  // Store reset token (you'll need to add this to your schema)
  // For now, we'll use a verification token
  await prisma.$executeRaw`
    INSERT INTO verification_tokens (identifier, token, expires)
    VALUES (${user.email}, ${resetToken}, ${resetTokenExpiry})
    ON CONFLICT (identifier, token) DO UPDATE SET expires = ${resetTokenExpiry}
  `;

  // TODO: Send password reset email
  // await sendPasswordResetEmail(user.email, user.firstName, resetToken);

  // Log password reset request
  await logAudit({
    userId: user.id,
    action: 'PASSWORD_RESET',
    resource: 'User',
    description: 'Password reset requested',
    organizationId: user.organizationId,
  });

  return { success: true, token: resetToken }; // Remove token in production
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  // Find valid reset token
  const resetToken = await prisma.$queryRaw<Array<{ identifier: string; expires: Date }>>`
    SELECT identifier, expires FROM verification_tokens
    WHERE token = ${token} AND expires > NOW()
    LIMIT 1
  `;

  if (!resetToken || resetToken.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const email = resetToken[0].identifier;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, organizationId: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      lastPasswordChange: new Date(),
      updatedBy: user.id,
    },
  });

  // Delete used token
  await prisma.$executeRaw`
    DELETE FROM verification_tokens WHERE token = ${token}
  `;

  // Log password reset
  await logAudit({
    userId: user.id,
    action: 'PASSWORD_RESET',
    resource: 'User',
    description: 'Password reset completed',
    organizationId: user.organizationId,
  });

  return true;
}

/**
 * Verify email address
 */
export async function verifyEmail(token: string) {
  // Find valid verification token
  const verificationToken = await prisma.$queryRaw<Array<{ identifier: string; expires: Date }>>`
    SELECT identifier, expires FROM verification_tokens
    WHERE token = ${token} AND expires > NOW()
    LIMIT 1
  `;

  if (!verificationToken || verificationToken.length === 0) {
    throw new Error('Invalid or expired verification token');
  }

  const email = verificationToken[0].identifier;

  // Update user
  const user = await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date(),
      status: 'ACTIVE',
      updatedBy: 'system',
    },
  });

  // Delete used token
  await prisma.$executeRaw`
    DELETE FROM verification_tokens WHERE token = ${token}
  `;

  // Log email verification
  await logAudit({
    userId: user.id,
    action: 'CREATE',
    resource: 'User',
    description: 'Email verified',
    organizationId: user.organizationId,
  });

  return user;
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string, reason?: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'INACTIVE',
      deletedAt: new Date(),
      updatedBy: userId,
    },
  });

  // Revoke all sessions
  await prisma.session.updateMany({
    where: { userId, status: 'active' },
    data: {
      status: 'revoked',
      logoutAt: new Date(),
      logoutReason: reason || 'Account deactivated',
    },
  });

  // Log deactivation
  await logAudit({
    userId,
    action: 'DELETE',
    resource: 'User',
    resourceId: userId,
    description: `User account deactivated: ${reason || 'No reason provided'}`,
    metadata: { reason },
    organizationId: user.organizationId,
  });

  return user;
}

/**
 * Reactivate user account
 */
export async function reactivateUser(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      deletedAt: null,
      updatedBy: userId,
    },
  });

  // Log reactivation
  await logAudit({
    userId,
    action: 'UPDATE',
    resource: 'User',
    resourceId: userId,
    description: 'User account reactivated',
    organizationId: user.organizationId,
  });

  return user;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    title?: string;
    avatar?: string;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      updatedBy: userId,
    },
  });

  // Log profile update
  await logAudit({
    userId,
    action: 'UPDATE',
    resource: 'User',
    resourceId: userId,
    description: 'User profile updated',
    metadata: data,
    organizationId: user.organizationId,
  });

  return user;
}
