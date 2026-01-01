import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { initializeSystemRoles } from "@/lib/permissions";
import { generateToken } from "@/lib/encryption";

export interface CreateOrganizationData {
  name: string;
  type: string;
  npi: string;
  taxId: string;
  address: any;
  contactInfo: any;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  subscription?: string;
}

/**
 * Create a new organization
 */
export async function createOrganization(data: CreateOrganizationData) {
  // Check if NPI already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { npi: data.npi },
  });

  if (existingOrg) {
    throw new Error("Organization with this NPI already exists");
  }

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: data.name,
      type: data.type,
      npi: data.npi,
      taxId: data.taxId,
      address: data.address,
      contactInfo: data.contactInfo,
      settings: {
        mfaRequired: false,
        sessionTimeout: 3600,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expiryDays: 90,
        },
      },
      status: "TRIAL",
      subscription: data.subscription || "trial",
      licenseCount: 10,
      activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Initialize system roles
  await initializeSystemRoles(organization.id);

  // Create admin user
  const bcrypt = await import("bcryptjs");
  const tempPassword = generateToken(16);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Get admin role
  const adminRole = await prisma.role.findFirst({
    where: {
      organizationId: organization.id,
      name: "ADMIN",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: data.adminEmail.toLowerCase(),
      passwordHash,
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
      status: "ACTIVE",
      emailVerified: new Date(),
      lastPasswordChange: new Date(),
      createdBy: "system",
      updatedBy: "system",
    },
  });

  // Assign admin role
  if (adminRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  // Log organization creation
  await logAudit({
    userId: adminUser.id,
    action: "CREATE",
    resource: "Organization",
    resourceId: organization.id,
    description: `New organization created: ${organization.name}`,
    metadata: {
      name: organization.name,
      type: organization.type,
      npi: organization.npi,
    },
    organizationId: organization.id,
  });

  // TODO: Send welcome email with temporary password

  return {
    organization,
    adminUser,
    tempPassword, // Remove in production, send via email instead
  };
}

/**
 * Get organization details
 */
export async function getOrganization(organizationId: string) {
  return await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      _count: {
        select: {
          users: true,
          patients: true,
          appointments: true,
        },
      },
    },
  });
}

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  organizationId: string,
  settings: {
    mfaRequired?: boolean;
    sessionTimeout?: number;
    passwordPolicy?: any;
    ipWhitelist?: string[];
  },
  updatedBy: string,
) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  const currentSettings = (organization.settings as any) || {};
  const newSettings = { ...currentSettings, ...settings };

  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      settings: newSettings,
      updatedBy,
    },
  });

  // Log settings update
  await logAudit({
    userId: updatedBy,
    action: "SYSTEM_CONFIG_CHANGED",
    resource: "Organization",
    resourceId: organizationId,
    description: "Organization settings updated",
    metadata: { settings },
    organizationId,
  });

  return updatedOrg;
}

/**
 * Update organization subscription
 */
export async function updateSubscription(
  organizationId: string,
  subscription: {
    plan: string;
    status: string;
    licenseCount?: number;
    activeUntil?: Date;
  },
  updatedBy: string,
) {
  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscription: subscription.plan,
      status: subscription.status as any,
      licenseCount: subscription.licenseCount,
      activeUntil: subscription.activeUntil,
      updatedBy,
    },
  });

  // Log subscription update
  await logAudit({
    userId: updatedBy,
    action: "UPDATE",
    resource: "Organization",
    resourceId: organizationId,
    description: "Organization subscription updated",
    metadata: { subscription },
    organizationId,
  });

  return updatedOrg;
}

/**
 * Get organization users
 */
export async function getOrganizationUsers(
  organizationId: string,
  params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
) {
  const { status, search, page = 1, limit = 50 } = params || {};

  const where: any = { organizationId };

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(organizationId: string) {
  const [
    totalUsers,
    activeUsers,
    totalPatients,
    todayAppointments,
    thisMonthRevenue,
  ] = await Promise.all([
    prisma.user.count({
      where: { organizationId },
    }),
    prisma.user.count({
      where: {
        organizationId,
        status: "ACTIVE",
      },
    }),
    prisma.patient.count({
      where: { organizationId },
    }),
    prisma.appointment.count({
      where: {
        organizationId,
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.$queryRaw`
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM claims
      WHERE organization_id = ${organizationId}
        AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `,
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    patients: {
      total: totalPatients,
    },
    appointments: {
      today: todayAppointments,
    },
    revenue: {
      thisMonth: (thisMonthRevenue as any)[0]?.revenue || 0,
    },
  };
}

/**
 * Suspend organization
 */
export async function suspendOrganization(
  organizationId: string,
  reason: string,
  suspendedBy: string,
) {
  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      status: "SUSPENDED",
      updatedBy: suspendedBy,
    },
  });

  // Revoke all active sessions
  await prisma.session.updateMany({
    where: {
      user: { organizationId },
      status: "active",
    },
    data: {
      status: "revoked",
      logoutAt: new Date(),
      logoutReason: `Organization suspended: ${reason}`,
    },
  });

  // Log suspension
  await logAudit({
    userId: suspendedBy,
    action: "UPDATE",
    resource: "Organization",
    resourceId: organizationId,
    description: `Organization suspended: ${reason}`,
    metadata: { reason },
    organizationId,
  });

  return organization;
}

/**
 * Reactivate organization
 */
export async function reactivateOrganization(
  organizationId: string,
  reactivatedBy: string,
) {
  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      status: "ACTIVE",
      updatedBy: reactivatedBy,
    },
  });

  // Log reactivation
  await logAudit({
    userId: reactivatedBy,
    action: "UPDATE",
    resource: "Organization",
    resourceId: organizationId,
    description: "Organization reactivated",
    organizationId,
  });

  return organization;
}

/**
 * Delete organization (soft delete)
 */
export async function deleteOrganization(
  organizationId: string,
  deletedBy: string,
  reason: string,
) {
  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      status: "CHURNED",
      deletedAt: new Date(),
      updatedBy: deletedBy,
    },
  });

  // Deactivate all users
  await prisma.user.updateMany({
    where: { organizationId },
    data: {
      status: "INACTIVE",
      deletedAt: new Date(),
      updatedBy: deletedBy,
    },
  });

  // Revoke all sessions
  await prisma.session.updateMany({
    where: {
      user: { organizationId },
      status: "active",
    },
    data: {
      status: "revoked",
      logoutAt: new Date(),
      logoutReason: `Organization deleted: ${reason}`,
    },
  });

  // Log deletion
  await logAudit({
    userId: deletedBy,
    action: "DELETE",
    resource: "Organization",
    resourceId: organizationId,
    description: `Organization deleted: ${reason}`,
    metadata: { reason },
    organizationId,
  });

  return organization;
}

/**
 * Get organization integrations
 */
export async function getOrganizationIntegrations(organizationId: string) {
  // Note: This will work once the schema is updated with integrations
  try {
    return await prisma.$queryRaw`
      SELECT * FROM integrations
      WHERE organization_id = ${organizationId}
      ORDER BY created_at DESC
    `;
  } catch {
    // Return empty array if integrations table doesn't exist yet
    return [];
  }
}

/**
 * Update BAA (Business Associate Agreement) status
 */
export async function updateBAAStatus(
  organizationId: string,
  signedBy: string,
  status: boolean,
) {
  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      // baaSignedAt and baaSignedBy would be in the extended schema
      updatedBy: signedBy,
    },
  });

  // Log BAA status change
  await logAudit({
    userId: signedBy,
    action: "UPDATE",
    resource: "Organization",
    resourceId: organizationId,
    description: `BAA ${status ? "signed" : "revoked"}`,
    metadata: { baaStatus: status },
    organizationId,
  });

  return organization;
}
