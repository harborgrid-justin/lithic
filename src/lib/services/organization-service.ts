/**
 * Organization Management Service
 * Handles CRUD operations for organizations, facilities, and departments
 */

import {
  Organization,
  Facility,
  Department,
  DataSharingAgreement,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  CreateFacilityDto,
  UpdateFacilityDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  OrganizationStatus,
  FacilityStatus,
  DepartmentStatus,
} from "@/types/enterprise";
import { auditLogger } from "@/lib/audit-logger";

// Mock database - in production, replace with actual database
let organizations: Organization[] = [];
let facilities: Facility[] = [];
let departments: Department[] = [];

export class OrganizationService {
  // ============================================================================
  // Organization Management
  // ============================================================================

  async createOrganization(
    dto: CreateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    const now = new Date();
    const organizationId = this.generateId();

    const organization: Organization = {
      id: organizationId,
      organizationId, // Self-reference for consistency
      name: dto.name,
      type: dto.type,
      parentOrganizationId: dto.parentOrganizationId || null,
      npi: dto.npi,
      taxId: dto.taxId,
      clia: null,
      address: dto.address,
      contactInfo: dto.contactInfo,
      settings: this.getDefaultSettings(dto.settings),
      status: OrganizationStatus.PENDING_SETUP,
      subscription: dto.subscription,
      licenseAllocations: [],
      activeUntil: new Date(
        now.getFullYear() + 1,
        now.getMonth(),
        now.getDate(),
      ),
      trialEndsAt: null,
      billingContact: null,
      technicalContact: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    organizations.push(organization);

    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "organization",
      resourceId: organization.id,
      details: { organization },
    });

    return organization;
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return organizations.find((org) => org.id === id && !org.deletedAt) || null;
  }

  async getOrganizationsByParent(
    parentId: string | null,
  ): Promise<Organization[]> {
    return organizations.filter(
      (org) => org.parentOrganizationId === parentId && !org.deletedAt,
    );
  }

  async getOrganizationHierarchy(
    rootId: string,
  ): Promise<OrganizationHierarchy> {
    const root = await this.getOrganization(rootId);
    if (!root) {
      throw new Error("Organization not found");
    }

    return this.buildHierarchy(root);
  }

  private async buildHierarchy(
    org: Organization,
  ): Promise<OrganizationHierarchy> {
    const children = await this.getOrganizationsByParent(org.id);
    const childHierarchies = await Promise.all(
      children.map((child) => this.buildHierarchy(child)),
    );

    return {
      organization: org,
      children: childHierarchies,
      facilities: await this.getFacilitiesByOrganization(org.id),
      totalDescendants: childHierarchies.reduce(
        (sum, child) => sum + child.totalDescendants + 1,
        0,
      ),
    };
  }

  async updateOrganization(
    dto: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    const index = organizations.findIndex((org) => org.id === dto.id);
    if (index === -1) {
      throw new Error("Organization not found");
    }

    const updated = {
      ...organizations[index],
      ...dto,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    organizations[index] = updated;

    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "organization",
      resourceId: updated.id,
      details: { changes: dto },
    });

    return updated;
  }

  async deleteOrganization(id: string, userId: string): Promise<void> {
    const index = organizations.findIndex((org) => org.id === id);
    if (index === -1) {
      throw new Error("Organization not found");
    }

    organizations[index].deletedAt = new Date();
    organizations[index].updatedBy = userId;
    organizations[index].status = OrganizationStatus.ARCHIVED;

    await auditLogger.log({
      userId,
      action: "DELETE",
      resource: "organization",
      resourceId: id,
      details: {},
    });
  }

  async activateOrganization(
    id: string,
    userId: string,
  ): Promise<Organization> {
    const org = await this.getOrganization(id);
    if (!org) {
      throw new Error("Organization not found");
    }

    return this.updateOrganization(
      {
        id,
        status: OrganizationStatus.ACTIVE,
      },
      userId,
    );
  }

  async suspendOrganization(
    id: string,
    userId: string,
    reason: string,
  ): Promise<Organization> {
    const org = await this.getOrganization(id);
    if (!org) {
      throw new Error("Organization not found");
    }

    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "organization",
      resourceId: id,
      details: { action: "suspend", reason },
    });

    return this.updateOrganization(
      {
        id,
        status: OrganizationStatus.SUSPENDED,
      },
      userId,
    );
  }

  // ============================================================================
  // Facility Management
  // ============================================================================

  async createFacility(
    dto: CreateFacilityDto,
    userId: string,
  ): Promise<Facility> {
    const now = new Date();
    const facilityId = this.generateId();

    const facility: Facility = {
      id: facilityId,
      organizationId: dto.organizationId,
      name: dto.name,
      facilityCode: dto.facilityCode,
      type: dto.type,
      npi: null,
      address: dto.address,
      contactInfo: dto.contactInfo,
      coordinates: dto.coordinates || null,
      departments: [],
      operatingHours: dto.operatingHours || this.getDefaultOperatingHours(),
      services: dto.services || [],
      capacity: null,
      accreditations: [],
      licenses: [],
      status: FacilityStatus.OPERATIONAL,
      primaryContact: userId,
      emergencyContact: null,
      settings: this.getDefaultFacilitySettings(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    facilities.push(facility);

    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "facility",
      resourceId: facility.id,
      details: { facility },
    });

    return facility;
  }

  async getFacility(id: string): Promise<Facility | null> {
    return facilities.find((f) => f.id === id && !f.deletedAt) || null;
  }

  async getFacilitiesByOrganization(
    organizationId: string,
  ): Promise<Facility[]> {
    return facilities.filter(
      (f) => f.organizationId === organizationId && !f.deletedAt,
    );
  }

  async updateFacility(
    dto: UpdateFacilityDto,
    userId: string,
  ): Promise<Facility> {
    const index = facilities.findIndex((f) => f.id === dto.id);
    if (index === -1) {
      throw new Error("Facility not found");
    }

    const updated = {
      ...facilities[index],
      ...dto,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    facilities[index] = updated;

    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "facility",
      resourceId: updated.id,
      details: { changes: dto },
    });

    return updated;
  }

  async deleteFacility(id: string, userId: string): Promise<void> {
    const index = facilities.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error("Facility not found");
    }

    facilities[index].deletedAt = new Date();
    facilities[index].updatedBy = userId;
    facilities[index].status = FacilityStatus.PERMANENTLY_CLOSED;

    await auditLogger.log({
      userId,
      action: "DELETE",
      resource: "facility",
      resourceId: id,
      details: {},
    });
  }

  // ============================================================================
  // Department Management
  // ============================================================================

  async createDepartment(
    dto: CreateDepartmentDto,
    userId: string,
  ): Promise<Department> {
    const now = new Date();
    const departmentId = this.generateId();

    const department: Department = {
      id: departmentId,
      organizationId: "", // Will be set from facility
      facilityId: dto.facilityId,
      name: dto.name,
      code: dto.code,
      type: dto.type,
      parentDepartmentId: dto.parentDepartmentId || null,
      costCenter: null,
      glCode: null,
      manager: dto.manager || null,
      staffMembers: [],
      services: dto.services || [],
      operatingHours: null,
      location: null,
      phone: null,
      email: null,
      budget: null,
      status: DepartmentStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    // Get facility to set organizationId
    const facility = await this.getFacility(dto.facilityId);
    if (facility) {
      department.organizationId = facility.organizationId;
    }

    departments.push(department);

    await auditLogger.log({
      userId,
      action: "CREATE",
      resource: "department",
      resourceId: department.id,
      details: { department },
    });

    return department;
  }

  async getDepartment(id: string): Promise<Department | null> {
    return departments.find((d) => d.id === id && !d.deletedAt) || null;
  }

  async getDepartmentsByFacility(facilityId: string): Promise<Department[]> {
    return departments.filter(
      (d) => d.facilityId === facilityId && !d.deletedAt,
    );
  }

  async getDepartmentHierarchy(
    facilityId: string,
  ): Promise<DepartmentHierarchy[]> {
    const allDepts = await this.getDepartmentsByFacility(facilityId);
    const rootDepts = allDepts.filter((d) => !d.parentDepartmentId);

    return rootDepts.map((dept) =>
      this.buildDepartmentHierarchy(dept, allDepts),
    );
  }

  private buildDepartmentHierarchy(
    dept: Department,
    allDepts: Department[],
  ): DepartmentHierarchy {
    const children = allDepts.filter((d) => d.parentDepartmentId === dept.id);

    return {
      department: dept,
      children: children.map((child) =>
        this.buildDepartmentHierarchy(child, allDepts),
      ),
      staffCount: dept.staffMembers.length,
    };
  }

  async updateDepartment(
    dto: UpdateDepartmentDto,
    userId: string,
  ): Promise<Department> {
    const index = departments.findIndex((d) => d.id === dto.id);
    if (index === -1) {
      throw new Error("Department not found");
    }

    const updated = {
      ...departments[index],
      ...dto,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    departments[index] = updated;

    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "department",
      resourceId: updated.id,
      details: { changes: dto },
    });

    return updated;
  }

  async deleteDepartment(id: string, userId: string): Promise<void> {
    const index = departments.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error("Department not found");
    }

    departments[index].deletedAt = new Date();
    departments[index].updatedBy = userId;
    departments[index].status = DepartmentStatus.INACTIVE;

    await auditLogger.log({
      userId,
      action: "DELETE",
      resource: "department",
      resourceId: id,
      details: {},
    });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private getDefaultSettings(overrides?: any): any {
    return {
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      locale: "en-US",
      currency: "USD",
      features: {
        patientPortal: true,
        telemedicine: false,
        labIntegration: true,
        pharmacyIntegration: true,
        imagingIntegration: true,
        billingModule: true,
        analyticsModule: true,
        mobileApp: false,
        apiAccess: false,
        customBranding: false,
        ssoEnabled: false,
        advancedReporting: false,
        aiAssistant: false,
        qualityMetrics: true,
        populationHealth: false,
      },
      branding: {
        logoUrl: null,
        faviconUrl: null,
        primaryColor: "#0066cc",
        secondaryColor: "#333333",
        accentColor: null,
        customCss: null,
        emailHeader: null,
        emailFooter: null,
      },
      compliance: {
        hipaaEnabled: true,
        auditLogging: true,
        phiEncryption: true,
        dataRetentionDays: 2555, // 7 years
        requireMFA: false,
        passwordExpiryDays: 90,
        sessionTimeoutMinutes: 30,
        breakGlassEnabled: true,
        consentManagement: true,
        gdprCompliant: false,
      },
      billing: {
        billingCycle: "MONTHLY",
        paymentMethod: "CREDIT_CARD",
        autoRenew: true,
        invoiceEmail: "",
        purchaseOrderRequired: false,
        taxExempt: false,
        taxExemptCertificate: null,
      },
      integrations: {
        hl7Enabled: true,
        fhirEnabled: true,
        directMessaging: false,
        externalEhr: null,
        externalLis: null,
        externalRis: null,
        externalPms: null,
        webhooksEnabled: false,
      },
      security: {
        ipWhitelist: [],
        allowedDomains: [],
        ssoProvider: null,
        ssoConfig: null,
        dataResidency: "US",
        encryptionAtRest: true,
        encryptionInTransit: true,
      },
      notifications: {
        systemAlerts: true,
        securityAlerts: true,
        complianceAlerts: true,
        billingAlerts: true,
        usageAlerts: false,
        maintenanceNotifications: true,
        alertEmail: "",
        alertSms: null,
        escalationPolicy: null,
      },
      ...overrides,
    };
  }

  private getDefaultOperatingHours(): any {
    const defaultDay = {
      open: true,
      openTime: "08:00",
      closeTime: "17:00",
      breaks: [],
    };

    return {
      monday: defaultDay,
      tuesday: defaultDay,
      wednesday: defaultDay,
      thursday: defaultDay,
      friday: defaultDay,
      saturday: { open: false, openTime: null, closeTime: null, breaks: [] },
      sunday: { open: false, openTime: null, closeTime: null, breaks: [] },
      holidays: [],
    };
  }

  private getDefaultFacilitySettings(): any {
    return {
      defaultTimezone: "America/New_York",
      appointmentDuration: 30,
      walkinEnabled: true,
      telemedicineEnabled: false,
      parkingValidation: false,
      valetService: false,
      wheelchairAccessible: true,
      languageServices: ["en"],
    };
  }
}

// ============================================================================
// Types for Hierarchies
// ============================================================================

interface OrganizationHierarchy {
  organization: Organization;
  children: OrganizationHierarchy[];
  facilities: Facility[];
  totalDescendants: number;
}

interface DepartmentHierarchy {
  department: Department;
  children: DepartmentHierarchy[];
  staffCount: number;
}

// Export singleton instance
export const organizationService = new OrganizationService();
