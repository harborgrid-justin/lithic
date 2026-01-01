/**
 * Location-Based Access Control System
 * Lithic v0.2 - Advanced RBAC System
 */

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  LocationAccessLevel,
  GrantLocationAccessDto,
  GeoCoordinates,
} from "@/types/rbac";

// ============================================================================
// IP Address Utilities
// ============================================================================

class IPAddressUtil {
  /**
   * Check if IP is in CIDR range
   */
  static isInRange(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split("/");
      const mask = bits ? ~(2 ** (32 - parseInt(bits)) - 1) : -1;

      return (this.ipToInt(ip) & mask) === (this.ipToInt(range) & mask);
    } catch (error) {
      console.error("IP range check error:", error);
      return false;
    }
  }

  /**
   * Convert IP address to integer
   */
  private static ipToInt(ip: string): number {
    return ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  }

  /**
   * Check if IP is private/internal
   */
  static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.0.0/16",
      "127.0.0.0/8",
    ];

    return privateRanges.some((range) => this.isInRange(ip, range));
  }

  /**
   * Check if multiple IPs are in allowed ranges
   */
  static checkIPAllowed(ip: string, allowedRanges: string[]): boolean {
    if (allowedRanges.length === 0) {
      return true; // No restrictions
    }

    return allowedRanges.some((range) => this.isInRange(ip, range));
  }
}

// ============================================================================
// Geolocation Utilities
// ============================================================================

class GeoUtil {
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    coord1: GeoCoordinates,
    coord2: GeoCoordinates,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if coordinates are within radius
   */
  static isWithinRadius(
    coord1: GeoCoordinates,
    coord2: GeoCoordinates,
    radiusMeters: number,
  ): boolean {
    const distance = this.calculateDistance(coord1, coord2);
    return distance <= radiusMeters;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// ============================================================================
// Location Access Control
// ============================================================================

export class LocationAccessControl {
  /**
   * Grant location access to a user
   */
  static async grantAccess(
    userId: string,
    grantedBy: string,
    data: GrantLocationAccessDto,
  ): Promise<any> {
    // Validate location exists
    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    });

    if (!location) {
      throw new Error("Location not found");
    }

    // Create or update location access
    const access = await prisma.locationAccess.upsert({
      where: {
        userId_locationId: {
          userId,
          locationId: data.locationId,
        },
      },
      create: {
        userId,
        locationId: data.locationId,
        accessLevel: data.accessLevel,
        allowedResources: data.allowedResources || [],
        requiresVPN: data.requiresVPN ?? false,
        allowedIPRanges: data.allowedIPRanges || [],
        grantedBy,
        expiresAt: data.expiresAt,
      },
      update: {
        accessLevel: data.accessLevel,
        allowedResources: data.allowedResources || [],
        requiresVPN: data.requiresVPN ?? false,
        allowedIPRanges: data.allowedIPRanges || [],
        grantedBy,
        expiresAt: data.expiresAt,
        updatedAt: new Date(),
      },
    });

    // Log access grant
    await logAudit({
      userId: grantedBy,
      action: "UPDATE",
      resource: "LocationAccess",
      resourceId: access.id,
      description: `Granted location access to user`,
      metadata: {
        targetUserId: userId,
        locationId: data.locationId,
        accessLevel: data.accessLevel,
      },
      organizationId: location.organizationId,
    });

    return access;
  }

  /**
   * Revoke location access
   */
  static async revokeAccess(
    userId: string,
    locationId: string,
    revokedBy: string,
  ): Promise<void> {
    const access = await prisma.locationAccess.findUnique({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
    });

    if (!access) {
      throw new Error("Location access not found");
    }

    await prisma.locationAccess.delete({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
      },
    });

    // Log access revocation
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    await logAudit({
      userId: revokedBy,
      action: "DELETE",
      resource: "LocationAccess",
      resourceId: access.id,
      description: `Revoked location access from user`,
      metadata: {
        targetUserId: userId,
        locationId,
      },
      organizationId: location?.organizationId,
    });
  }

  /**
   * Check if user has access to a location
   */
  static async hasAccess(
    userId: string,
    locationId: string,
    ipAddress?: string,
    requiredLevel?: LocationAccessLevel,
  ): Promise<boolean> {
    const access = await prisma.locationAccess.findUnique({
      where: {
        userId_locationId: {
          userId,
          locationId,
        },
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: {
        location: true,
      },
    });

    if (!access) {
      return false;
    }

    // Check access level
    if (requiredLevel) {
      const levelOrder = [
        LocationAccessLevel.NONE,
        LocationAccessLevel.EMERGENCY_ONLY,
        LocationAccessLevel.RESTRICTED,
        LocationAccessLevel.FULL,
      ];

      const currentLevelIndex = levelOrder.indexOf(access.accessLevel);
      const requiredLevelIndex = levelOrder.indexOf(requiredLevel);

      if (currentLevelIndex < requiredLevelIndex) {
        return false;
      }
    }

    // Check IP restrictions if IP provided
    if (ipAddress && access.allowedIPRanges.length > 0) {
      if (!IPAddressUtil.checkIPAllowed(ipAddress, access.allowedIPRanges)) {
        return false;
      }
    }

    // Check VPN requirement
    if (access.requiresVPN && ipAddress) {
      const isVPN = await this.checkVPNConnection(ipAddress, locationId);
      if (!isVPN) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if location is accessible from IP
   */
  static async checkLocationFromIP(
    locationId: string,
    ipAddress: string,
  ): Promise<boolean> {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || location.ipRanges.length === 0) {
      return true; // No IP restrictions
    }

    return IPAddressUtil.checkIPAllowed(ipAddress, location.ipRanges);
  }

  /**
   * Check VPN connection
   */
  private static async checkVPNConnection(
    ipAddress: string,
    locationId: string,
  ): Promise<boolean> {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || location.ipRanges.length === 0) {
      return true;
    }

    // Check if IP is in location's VPN range
    return IPAddressUtil.checkIPAllowed(ipAddress, location.ipRanges);
  }

  /**
   * Check geofencing
   */
  static async checkGeofence(
    locationId: string,
    currentCoordinates: GeoCoordinates,
  ): Promise<boolean> {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || !location.coordinates) {
      return true; // No geofencing configured
    }

    // Check if geofencing is enabled (this would be in location settings)
    const geofenceRadius = 1000; // 1km default, should be configurable

    return GeoUtil.isWithinRadius(
      location.coordinates as GeoCoordinates,
      currentCoordinates,
      geofenceRadius,
    );
  }

  /**
   * Get user's accessible locations
   */
  static async getUserLocations(userId: string): Promise<any[]> {
    const accessList = await prisma.locationAccess.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: {
        location: true,
      },
    });

    return accessList.map((access) => ({
      locationId: access.locationId,
      locationName: access.location.name,
      locationCode: access.location.code,
      locationType: access.location.type,
      accessLevel: access.accessLevel,
      allowedResources: access.allowedResources,
      requiresVPN: access.requiresVPN,
      expiresAt: access.expiresAt,
    }));
  }

  /**
   * Get all users with access to a location
   */
  static async getLocationUsers(locationId: string): Promise<any[]> {
    const accessList = await prisma.locationAccess.findMany({
      where: {
        locationId,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return accessList.map((access) => ({
      userId: access.userId,
      userName: access.user.name,
      userEmail: access.user.email,
      userRole: access.user.role?.name,
      accessLevel: access.accessLevel,
      requiresVPN: access.requiresVPN,
      expiresAt: access.expiresAt,
    }));
  }

  /**
   * Get location hierarchy
   */
  static async getLocationHierarchy(organizationId: string): Promise<any[]> {
    const locations = await prisma.location.findMany({
      where: { organizationId },
      include: {
        parentLocation: true,
        childLocations: true,
      },
    });

    // Build tree structure
    const locMap = new Map();
    const rootLocs: any[] = [];

    for (const loc of locations) {
      locMap.set(loc.id, {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        type: loc.type,
        address: loc.address,
        status: loc.status,
        children: [],
      });
    }

    for (const loc of locations) {
      const node = locMap.get(loc.id);
      if (loc.parentLocationId) {
        const parent = locMap.get(loc.parentLocationId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootLocs.push(node);
      }
    }

    return rootLocs;
  }

  /**
   * Detect anomalous location access
   */
  static async detectAnomalousAccess(
    userId: string,
    locationId: string,
    ipAddress: string,
  ): Promise<{
    isAnomalous: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Get user's typical locations
    const recentAccess = await prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: {
        metadata: true,
      },
      take: 100,
    });

    const typicalLocations = new Set(
      recentAccess.map((log) => log.metadata?.locationId).filter(Boolean),
    );

    // Check if this is a new location
    if (!typicalLocations.has(locationId)) {
      reasons.push("Access from new location");
      riskScore += 30;
    }

    // Check if IP is from different country (would need IP geolocation service)
    // Placeholder for now
    if (ipAddress && !IPAddressUtil.isPrivateIP(ipAddress)) {
      // External IP
      reasons.push("Access from external IP");
      riskScore += 20;
    }

    // Check for rapid location changes
    const lastAccess = await prisma.auditLog.findFirst({
      where: { userId },
      orderBy: { timestamp: "desc" },
      select: { metadata: true, timestamp: true },
    });

    if (lastAccess?.metadata?.locationId) {
      const timeDiff = Date.now() - lastAccess.timestamp.getTime();
      const lastLocationId = lastAccess.metadata.locationId;

      if (lastLocationId !== locationId && timeDiff < 60 * 60 * 1000) {
        // Different location within 1 hour
        reasons.push("Rapid location change detected");
        riskScore += 40;
      }
    }

    return {
      isAnomalous: riskScore >= 50,
      reasons,
      riskScore,
    };
  }

  /**
   * Cleanup expired access grants
   */
  static async cleanupExpiredAccess(): Promise<number> {
    const result = await prisma.locationAccess.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}

// ============================================================================
// Exported Functions
// ============================================================================

export async function checkLocationAccess(
  userId: string,
  locationId: string | undefined | null,
  ipAddress?: string,
  allowedLocations?: string[],
): Promise<boolean> {
  // If no location specified or no restrictions, allow access
  if (!locationId || !allowedLocations || allowedLocations.length === 0) {
    return true;
  }

  // Check if user has access to any of the allowed locations
  for (const locId of allowedLocations) {
    const hasAccess = await LocationAccessControl.hasAccess(
      userId,
      locId,
      ipAddress,
    );
    if (hasAccess) {
      return true;
    }
  }

  return false;
}

export async function grantLocationAccess(
  userId: string,
  grantedBy: string,
  data: GrantLocationAccessDto,
): Promise<any> {
  return LocationAccessControl.grantAccess(userId, grantedBy, data);
}

export async function revokeLocationAccess(
  userId: string,
  locationId: string,
  revokedBy: string,
): Promise<void> {
  return LocationAccessControl.revokeAccess(userId, locationId, revokedBy);
}

export async function getUserLocations(userId: string): Promise<any[]> {
  return LocationAccessControl.getUserLocations(userId);
}

export async function getLocationUsers(locationId: string): Promise<any[]> {
  return LocationAccessControl.getLocationUsers(locationId);
}

export async function validateIPAccess(
  ip: string,
  allowedRanges: string[],
): Promise<boolean> {
  return IPAddressUtil.checkIPAllowed(ip, allowedRanges);
}

export async function detectAnomalousLocationAccess(
  userId: string,
  locationId: string,
  ipAddress: string,
): Promise<{
  isAnomalous: boolean;
  reasons: string[];
  riskScore: number;
}> {
  return LocationAccessControl.detectAnomalousAccess(
    userId,
    locationId,
    ipAddress,
  );
}
