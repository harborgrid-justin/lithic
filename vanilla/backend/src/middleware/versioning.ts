/**
 * API Versioning Middleware
 *
 * Handle API versioning through headers, URL paths, and query parameters
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// API Version
export type ApiVersion = 'v1' | 'v2';

// Version Configuration
interface VersionConfig {
  current: ApiVersion;
  supported: ApiVersion[];
  deprecated: ApiVersion[];
}

const versionConfig: VersionConfig = {
  current: 'v1',
  supported: ['v1'],
  deprecated: [],
};

/**
 * Extract API version from request
 */
export function extractApiVersion(req: Request): ApiVersion | null {
  // 1. Check URL path (/api/v1/...)
  const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    return pathMatch[1] as ApiVersion;
  }

  // 2. Check Accept header (application/vnd.lithic.v1+json)
  const acceptHeader = req.headers.accept;
  if (acceptHeader) {
    const acceptMatch = acceptHeader.match(/application\/vnd\.lithic\.(v\d+)\+json/);
    if (acceptMatch) {
      return acceptMatch[1] as ApiVersion;
    }
  }

  // 3. Check custom header (X-API-Version)
  const versionHeader = req.headers['x-api-version'];
  if (versionHeader) {
    return versionHeader as ApiVersion;
  }

  // 4. Check query parameter (?api_version=v1)
  const queryVersion = req.query.api_version;
  if (queryVersion) {
    return queryVersion as ApiVersion;
  }

  return null;
}

/**
 * API versioning middleware
 */
export function apiVersioning(req: Request, res: Response, next: NextFunction): void {
  const version = extractApiVersion(req);

  // Set default version if not specified
  if (!version) {
    req.apiVersion = versionConfig.current;
  } else if (!versionConfig.supported.includes(version)) {
    res.status(400).json({
      success: false,
      error: `API version ${version} is not supported`,
      supportedVersions: versionConfig.supported,
    });
    return;
  } else {
    req.apiVersion = version;
  }

  // Add version headers to response
  res.setHeader('X-API-Version', req.apiVersion);
  res.setHeader('X-API-Supported-Versions', versionConfig.supported.join(', '));

  // Warn about deprecated versions
  if (versionConfig.deprecated.includes(req.apiVersion)) {
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecation-Info', `API version ${req.apiVersion} is deprecated. Please upgrade to ${versionConfig.current}`);

    logger.warn('Deprecated API version used', {
      version: req.apiVersion,
      path: req.path,
      ip: req.ip,
    });
  }

  next();
}

/**
 * Require specific API version
 */
export function requireVersion(...versions: ApiVersion[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const version = req.apiVersion || extractApiVersion(req);

    if (!version || !versions.includes(version)) {
      res.status(400).json({
        success: false,
        error: `This endpoint requires API version: ${versions.join(' or ')}`,
        currentVersion: version,
        requiredVersions: versions,
      });
      return;
    }

    next();
  };
}

/**
 * Deprecate API version
 */
export function deprecateVersion(version: ApiVersion, sunsetDate?: string) {
  return (req: Request, res: Response, next: NextFunction): void {
    const currentVersion = req.apiVersion || extractApiVersion(req);

    if (currentVersion === version) {
      res.setHeader('Deprecation', 'true');

      if (sunsetDate) {
        res.setHeader('Sunset', sunsetDate);
      }

      res.setHeader('Link', `</api/${versionConfig.current}${req.path}>; rel="successor-version"`);

      logger.warn('Deprecated API endpoint accessed', {
        version,
        path: req.path,
        sunsetDate,
      });
    }

    next();
  };
}

/**
 * Version-specific response wrapper
 */
export function versionedResponse(req: Request, data: any, metadata?: any): any {
  const version = req.apiVersion || 'v1';

  switch (version) {
    case 'v1':
      return {
        success: true,
        data,
        ...metadata,
      };

    case 'v2':
      // Different response format for v2
      return {
        status: 'success',
        result: data,
        meta: metadata,
        version: 'v2',
      };

    default:
      return {
        success: true,
        data,
        ...metadata,
      };
  }
}

/**
 * Get current API version
 */
export function getCurrentVersion(): ApiVersion {
  return versionConfig.current;
}

/**
 * Get supported versions
 */
export function getSupportedVersions(): ApiVersion[] {
  return versionConfig.supported;
}

/**
 * Get deprecated versions
 */
export function getDeprecatedVersions(): ApiVersion[] {
  return versionConfig.deprecated;
}

/**
 * Add version to supported list
 */
export function addSupportedVersion(version: ApiVersion): void {
  if (!versionConfig.supported.includes(version)) {
    versionConfig.supported.push(version);
    logger.info('API version added to supported list', { version });
  }
}

/**
 * Mark version as deprecated
 */
export function markVersionDeprecated(version: ApiVersion): void {
  if (!versionConfig.deprecated.includes(version)) {
    versionConfig.deprecated.push(version);
    logger.info('API version marked as deprecated', { version });
  }
}

/**
 * Remove version from supported list
 */
export function removeSupportedVersion(version: ApiVersion): void {
  const index = versionConfig.supported.indexOf(version);
  if (index > -1) {
    versionConfig.supported.splice(index, 1);
    logger.info('API version removed from supported list', { version });
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      apiVersion?: ApiVersion;
    }
  }
}
