import { Request, Response, NextFunction } from 'express';
import { auditLog } from '../utils/logger.js';

// HIPAA-compliant audit logging middleware
export const auditLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only audit PHI-related endpoints
  const phiEndpoints = [
    '/api/v1/patients',
    '/api/v1/clinical',
    '/api/v1/laboratory',
    '/api/v1/pharmacy',
    '/api/v1/imaging',
  ];

  const shouldAudit = phiEndpoints.some(endpoint => req.path.startsWith(endpoint));

  if (shouldAudit && req.method !== 'OPTIONS') {
    const userId = (req as any).user?.id || 'anonymous';
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const action = req.method;
    const resourceType = req.path.split('/')[3] || 'unknown';
    const resourceId = req.params.id || 'N/A';

    auditLog(userId, action, resourceType, resourceId, ipAddress, {
      path: req.path,
      query: req.query,
    });
  }

  next();
};

export default auditLogger;
