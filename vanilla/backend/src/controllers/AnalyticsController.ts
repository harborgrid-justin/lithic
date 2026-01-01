/**
 * Analytics Controller - HTTP request handlers for analytics endpoints
 * Lithic Healthcare Platform
 */

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { ReportingService } from '../services/ReportingService';
import { ExportService } from '../services/ExportService';
import { AnalyticsAudit } from '../models/Analytics';

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private reportingService: ReportingService;
  private exportService: ExportService;
  private auditLog: AnalyticsAudit[] = [];

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.reportingService = new ReportingService(this.analyticsService);
    this.exportService = new ExportService();
  }

  // ==================== Dashboard Endpoints ====================

  getDashboards = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { category } = req.query;

      const dashboards = await this.analyticsService.getDashboards(userId, {
        category: category as any,
      });

      this.logAudit({
        action: 'dashboard_viewed',
        resourceType: 'dashboard',
        resourceId: 'list',
        resourceName: 'All Dashboards',
        performedBy: userId,
        performedAt: new Date(),
      });

      res.json({
        success: true,
        data: dashboards,
        count: dashboards.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { id } = req.params;

      const dashboard = await this.analyticsService.getDashboard(id, userId);

      if (!dashboard) {
        res.status(404).json({
          success: false,
          error: 'Dashboard not found',
        });
        return;
      }

      this.logAudit({
        action: 'dashboard_viewed',
        resourceType: 'dashboard',
        resourceId: id,
        resourceName: dashboard.name,
        performedBy: userId,
        performedAt: new Date(),
      });

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      res.status(error.message.includes('Access denied') ? 403 : 500).json({
        success: false,
        error: error.message,
      });
    }
  };

  createDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const dashboardData = req.body;

      const dashboard = await this.analyticsService.createDashboard(dashboardData, userId);

      this.logAudit({
        action: 'dashboard_created',
        resourceType: 'dashboard',
        resourceId: dashboard.id,
        resourceName: dashboard.name,
        performedBy: userId,
        performedAt: new Date(),
        details: dashboardData,
      });

      res.status(201).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  updateDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { id } = req.params;
      const updates = req.body;

      const dashboard = await this.analyticsService.updateDashboard(id, updates, userId);

      this.logAudit({
        action: 'dashboard_modified',
        resourceType: 'dashboard',
        resourceId: id,
        resourceName: dashboard.name,
        performedBy: userId,
        performedAt: new Date(),
        details: updates,
      });

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 403).json({
        success: false,
        error: error.message,
      });
    }
  };

  deleteDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { id } = req.params;

      const dashboard = await this.analyticsService.getDashboard(id, userId);
      await this.analyticsService.deleteDashboard(id, userId);

      this.logAudit({
        action: 'dashboard_deleted',
        resourceType: 'dashboard',
        resourceId: id,
        resourceName: dashboard?.name || 'Unknown',
        performedBy: userId,
        performedAt: new Date(),
      });

      res.json({
        success: true,
        message: 'Dashboard deleted successfully',
      });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 403).json({
        success: false,
        error: error.message,
      });
    }
  };

  duplicateDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { id } = req.params;

      const dashboard = await this.analyticsService.duplicateDashboard(id, userId);

      res.status(201).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  getWidgetData = async (req: Request, res: Response): Promise<void> => {
    try {
      const widgetConfig = req.body;

      const data = await this.analyticsService.getWidgetData(widgetConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Metrics Endpoints ====================

  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category } = req.query;

      const metrics = await this.analyticsService.getMetrics(category as any);

      res.json({
        success: true,
        data: metrics,
        count: metrics.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getMetric = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const metric = await this.analyticsService.getMetric(id);

      if (!metric) {
        res.status(404).json({
          success: false,
          error: 'Metric not found',
        });
        return;
      }

      res.json({
        success: true,
        data: metric,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  calculateMetric = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const parameters = req.body;

      const value = await this.analyticsService.calculateMetric(id, parameters);

      this.logAudit({
        action: 'metric_calculated',
        resourceType: 'metric',
        resourceId: id,
        resourceName: 'Metric Calculation',
        performedBy: req.user?.id || 'anonymous',
        performedAt: new Date(),
        details: { parameters, value },
      });

      res.json({
        success: true,
        data: { value, calculatedAt: new Date() },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Quality Measures Endpoints ====================

  getQualityMeasures = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, status, startDate, endDate } = req.query;

      const filters: any = {};
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (startDate && endDate) {
        filters.period = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }

      const measures = await this.analyticsService.getQualityMeasures(filters);

      res.json({
        success: true,
        data: measures,
        count: measures.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  calculateQualityMeasure = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const measure = await this.analyticsService.calculateQualityMeasure(id);

      res.json({
        success: true,
        data: measure,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Financial Metrics Endpoints ====================

  getFinancialMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
        return;
      }

      const metrics = await this.analyticsService.getFinancialMetrics({
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      });

      res.json({
        success: true,
        data: metrics,
        count: metrics.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Operational Metrics Endpoints ====================

  getOperationalMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
        return;
      }

      const metrics = await this.analyticsService.getOperationalMetrics({
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      });

      res.json({
        success: true,
        data: metrics,
        count: metrics.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Population Health Endpoints ====================

  getPopulationHealthMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { populationId } = req.query;

      const metrics = await this.analyticsService.getPopulationHealthMetrics(populationId as string);

      res.json({
        success: true,
        data: metrics,
        count: metrics.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Report Endpoints ====================

  getReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, createdBy } = req.query;

      const reports = await this.reportingService.getReports({
        type: type as any,
        createdBy: createdBy as string,
      });

      res.json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const report = await this.reportingService.getReport(id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: 'Report not found',
        });
        return;
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  createReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const reportData = req.body;

      // Validate configuration
      const validation = await this.reportingService.validateReportConfig(reportData);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          errors: validation.errors,
        });
        return;
      }

      const report = await this.reportingService.createReport(reportData, userId);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  updateReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { id } = req.params;
      const updates = req.body;

      const report = await this.reportingService.updateReport(id, updates, userId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  };

  deleteReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.reportingService.deleteReport(id);

      res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  generateReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { id } = req.params;
      const parameters = req.body;

      const instance = await this.reportingService.generateReport(id, userId, parameters);

      this.logAudit({
        action: 'report_generated',
        resourceType: 'report',
        resourceId: id,
        resourceName: instance.name,
        performedBy: userId,
        performedAt: new Date(),
        details: parameters,
      });

      res.status(202).json({
        success: true,
        data: instance,
        message: 'Report generation started',
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  getReportInstances = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reportId, userId } = req.query;

      const instances = await this.reportingService.getReportInstances(
        reportId as string,
        userId as string
      );

      res.json({
        success: true,
        data: instances,
        count: instances.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getReportInstance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const instance = await this.reportingService.getReportInstance(id);

      if (!instance) {
        res.status(404).json({
          success: false,
          error: 'Report instance not found',
        });
        return;
      }

      res.json({
        success: true,
        data: instance,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getReportTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.reportingService.getReportTemplates();

      res.json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Scheduled Reports Endpoints ====================

  getScheduledReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reportId } = req.query;

      const scheduled = await this.reportingService.getScheduledReports(reportId as string);

      res.json({
        success: true,
        data: scheduled,
        count: scheduled.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  createScheduledReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const scheduleData = req.body;

      const scheduled = await this.reportingService.createScheduledReport(scheduleData, userId);

      this.logAudit({
        action: 'report_scheduled',
        resourceType: 'report',
        resourceId: scheduled.reportConfigId,
        resourceName: 'Scheduled Report',
        performedBy: userId,
        performedAt: new Date(),
        details: scheduleData,
      });

      res.status(201).json({
        success: true,
        data: scheduled,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  updateScheduledReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const scheduled = await this.reportingService.updateScheduledReport(id, updates);

      res.json({
        success: true,
        data: scheduled,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  deleteScheduledReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.reportingService.deleteScheduledReport(id);

      res.json({
        success: true,
        message: 'Scheduled report deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  toggleScheduledReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const scheduled = await this.reportingService.toggleScheduledReport(id, isActive);

      res.json({
        success: true,
        data: scheduled,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Export Endpoints ====================

  createExportJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';
      const { type, sourceId, sourceName, format, parameters } = req.body;

      const job = await this.exportService.createExportJob(
        type,
        sourceId,
        sourceName,
        format,
        parameters,
        userId
      );

      this.logAudit({
        action: 'data_exported',
        resourceType: 'export',
        resourceId: job.id,
        resourceName: sourceName,
        performedBy: userId,
        performedAt: new Date(),
        details: { type, format },
      });

      res.status(202).json({
        success: true,
        data: job,
        message: 'Export job created',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  getExportJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const job = await this.exportService.getExportJob(id);

      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Export job not found',
        });
        return;
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getExportJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 'anonymous';

      const jobs = await this.exportService.getExportJobs(userId);

      res.json({
        success: true,
        data: jobs,
        count: jobs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  cancelExportJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.exportService.cancelExportJob(id);

      res.json({
        success: true,
        message: 'Export job cancelled',
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  getExportStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const stats = await this.exportService.getExportStatistics(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Audit Log ====================

  getAuditLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resourceType, resourceId, userId, startDate, endDate } = req.query;

      let filtered = [...this.auditLog];

      if (resourceType) {
        filtered = filtered.filter((a) => a.resourceType === resourceType);
      }
      if (resourceId) {
        filtered = filtered.filter((a) => a.resourceId === resourceId);
      }
      if (userId) {
        filtered = filtered.filter((a) => a.performedBy === userId);
      }
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        filtered = filtered.filter((a) => a.performedAt >= start && a.performedAt <= end);
      }

      res.json({
        success: true,
        data: filtered.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime()),
        count: filtered.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==================== Helper Methods ====================

  private logAudit(audit: Omit<AnalyticsAudit, 'id'>): void {
    const auditEntry: AnalyticsAudit = {
      ...audit,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.auditLog.push(auditEntry);

    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }
}

// Singleton instance
export const analyticsController = new AnalyticsController();
