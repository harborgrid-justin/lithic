/**
 * Analytics Service - Core analytics and metrics calculation
 * Lithic Healthcare Platform
 */

import {
  Dashboard,
  WidgetConfig,
  MetricDefinition,
  MetricDataPoint,
  QualityMeasure,
  FinancialMetric,
  OperationalMetric,
  PopulationHealthMetric,
  MetricCategory,
  TimeGranularity,
  ChartDataSeries,
} from "../models/Analytics";

export class AnalyticsService {
  // In-memory storage (replace with database in production)
  private dashboards: Map<string, Dashboard> = new Map();
  private metrics: Map<string, MetricDefinition> = new Map();
  private metricData: Map<string, MetricDataPoint[]> = new Map();
  private qualityMeasures: Map<string, QualityMeasure> = new Map();

  constructor() {
    this.initializeDefaultMetrics();
  }

  // ==================== Dashboard Management ====================

  async getDashboards(
    userId: string,
    filters?: { category?: MetricCategory },
  ): Promise<Dashboard[]> {
    const allDashboards = Array.from(this.dashboards.values());

    // Filter by ownership and visibility
    let filtered = allDashboards.filter(
      (d) =>
        d.owner === userId ||
        d.visibility === "public" ||
        (d.visibility === "shared" && d.sharedWith?.includes(userId)),
    );

    // Apply category filter
    if (filters?.category) {
      filtered = filtered.filter((d) => d.category === filters.category);
    }

    return filtered.sort((a, b) => {
      // Sort favorites first, then by update time
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  async getDashboard(id: string, userId: string): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(id);

    if (!dashboard) {
      return null;
    }

    // Check permissions
    if (
      dashboard.owner !== userId &&
      dashboard.visibility === "private" &&
      !dashboard.sharedWith?.includes(userId)
    ) {
      throw new Error("Access denied to this dashboard");
    }

    return dashboard;
  }

  async createDashboard(
    data: Omit<Dashboard, "id" | "createdAt" | "updatedAt">,
    userId: string,
  ): Promise<Dashboard> {
    const id = this.generateId("dash");
    const now = new Date();

    const dashboard: Dashboard = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    };

    this.dashboards.set(id, dashboard);
    return dashboard;
  }

  async updateDashboard(
    id: string,
    updates: Partial<Dashboard>,
    userId: string,
  ): Promise<Dashboard> {
    const dashboard = this.dashboards.get(id);

    if (!dashboard) {
      throw new Error("Dashboard not found");
    }

    if (dashboard.owner !== userId) {
      throw new Error("Only the owner can update this dashboard");
    }

    const updated: Dashboard = {
      ...dashboard,
      ...updates,
      id, // Prevent ID change
      updatedAt: new Date(),
      updatedBy: userId,
    };

    this.dashboards.set(id, updated);
    return updated;
  }

  async deleteDashboard(id: string, userId: string): Promise<void> {
    const dashboard = this.dashboards.get(id);

    if (!dashboard) {
      throw new Error("Dashboard not found");
    }

    if (dashboard.owner !== userId) {
      throw new Error("Only the owner can delete this dashboard");
    }

    this.dashboards.delete(id);
  }

  async duplicateDashboard(id: string, userId: string): Promise<Dashboard> {
    const original = await this.getDashboard(id, userId);

    if (!original) {
      throw new Error("Dashboard not found");
    }

    const duplicate: Omit<Dashboard, "id" | "createdAt" | "updatedAt"> = {
      ...original,
      name: `${original.name} (Copy)`,
      owner: userId,
      visibility: "private",
      sharedWith: [],
      isFavorite: false,
      isDefault: false,
      createdBy: userId,
      updatedBy: userId,
    };

    return this.createDashboard(duplicate, userId);
  }

  // ==================== Widget Management ====================

  async getWidgetData(widgetConfig: WidgetConfig): Promise<ChartDataSeries[]> {
    const { dataSource } = widgetConfig;
    const metricId = dataSource.metric;

    // Get metric data points
    const dataPoints = this.metricData.get(metricId) || [];

    // Apply time range filter
    let filtered = dataPoints;
    if (dataSource.timeRange) {
      filtered = dataPoints.filter(
        (dp) =>
          dp.timestamp >= dataSource.timeRange!.start &&
          dp.timestamp <= dataSource.timeRange!.end,
      );
    }

    // Apply additional filters
    if (dataSource.filters) {
      filtered = filtered.filter((dp) => {
        return Object.entries(dataSource.filters!).every(([key, value]) => {
          return dp.dimensions?.[key] === value;
        });
      });
    }

    // Group and aggregate data
    const series = this.aggregateData(
      filtered,
      dataSource.groupBy,
      dataSource.timeRange?.granularity,
    );

    return series;
  }

  private aggregateData(
    dataPoints: MetricDataPoint[],
    groupBy?: string[],
    granularity?: TimeGranularity,
  ): ChartDataSeries[] {
    if (!groupBy || groupBy.length === 0) {
      // Single series
      const sorted = dataPoints.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );

      return [
        {
          name: "Value",
          data: sorted.map((dp) => ({
            x: dp.timestamp,
            y: dp.value,
          })),
        },
      ];
    }

    // Group by dimension
    const groups = new Map<string, MetricDataPoint[]>();

    dataPoints.forEach((dp) => {
      const groupKey = groupBy
        .map((key) => dp.dimensions?.[key] || "Unknown")
        .join(" - ");
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(dp);
    });

    // Create series for each group
    const series: ChartDataSeries[] = [];
    groups.forEach((points, groupName) => {
      const sorted = points.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      series.push({
        name: groupName,
        data: sorted.map((dp) => ({
          x: dp.timestamp,
          y: dp.value,
        })),
      });
    });

    return series;
  }

  // ==================== Metrics Management ====================

  async getMetrics(category?: MetricCategory): Promise<MetricDefinition[]> {
    const allMetrics = Array.from(this.metrics.values());

    if (category) {
      return allMetrics.filter((m) => m.category === category && m.isActive);
    }

    return allMetrics.filter((m) => m.isActive);
  }

  async getMetric(id: string): Promise<MetricDefinition | null> {
    return this.metrics.get(id) || null;
  }

  async calculateMetric(
    metricId: string,
    params?: Record<string, any>,
  ): Promise<number> {
    const metric = this.metrics.get(metricId);

    if (!metric) {
      throw new Error("Metric not found");
    }

    // In a real implementation, this would execute the formula
    // For now, return a simulated value
    return Math.random() * 100;
  }

  async recordMetricDataPoint(
    dataPoint: Omit<MetricDataPoint, "timestamp">,
  ): Promise<void> {
    const point: MetricDataPoint = {
      ...dataPoint,
      timestamp: new Date(),
    };

    if (!this.metricData.has(dataPoint.metricId)) {
      this.metricData.set(dataPoint.metricId, []);
    }

    this.metricData.get(dataPoint.metricId)!.push(point);
  }

  // ==================== Quality Measures ====================

  async getQualityMeasures(filters?: {
    category?: string;
    status?: string;
    period?: { start: Date; end: Date };
  }): Promise<QualityMeasure[]> {
    let measures = Array.from(this.qualityMeasures.values());

    if (filters?.category) {
      measures = measures.filter((m) => m.category === filters.category);
    }

    if (filters?.status) {
      measures = measures.filter((m) => m.status === filters.status);
    }

    if (filters?.period) {
      measures = measures.filter(
        (m) =>
          m.measurementPeriod.start >= filters.period!.start &&
          m.measurementPeriod.end <= filters.period!.end,
      );
    }

    return measures;
  }

  async getQualityMeasure(id: string): Promise<QualityMeasure | null> {
    return this.qualityMeasures.get(id) || null;
  }

  async calculateQualityMeasure(measureId: string): Promise<QualityMeasure> {
    // In production, this would query patient data and calculate based on criteria
    const measure = this.qualityMeasures.get(measureId);

    if (!measure) {
      throw new Error("Quality measure not found");
    }

    // Simulated calculation
    const denominator = Math.floor(Math.random() * 1000) + 500;
    const numerator = Math.floor(Math.random() * denominator);
    const rate = (numerator / denominator) * 100;

    const updated: QualityMeasure = {
      ...measure,
      numerator: { ...measure.numerator, count: numerator },
      denominator: { ...measure.denominator, count: denominator },
      rate,
      status:
        rate >= measure.target
          ? "compliant"
          : rate >= measure.target * 0.9
            ? "at_risk"
            : "non_compliant",
      lastCalculated: new Date(),
    };

    this.qualityMeasures.set(measureId, updated);
    return updated;
  }

  // ==================== Financial Metrics ====================

  async getFinancialMetrics(period: {
    start: Date;
    end: Date;
  }): Promise<FinancialMetric[]> {
    // Simulated financial metrics
    const metricTypes: FinancialMetric["metricType"][] = [
      "revenue",
      "expenses",
      "margin",
      "ar_days",
      "collection_rate",
      "claim_denial_rate",
    ];

    return metricTypes.map((metricType) => {
      const current = Math.random() * 1000000;
      const previous = Math.random() * 1000000;
      const budget = current * 1.1;
      const variance = current - budget;
      const variancePercent = (variance / budget) * 100;

      return {
        id: this.generateId("fin"),
        metricType,
        period,
        current,
        previous,
        budget,
        variance,
        variancePercent,
        trend: {
          direction:
            current > previous ? "up" : current < previous ? "down" : "stable",
          changePercent: ((current - previous) / previous) * 100,
          isPositive:
            metricType === "revenue" ? current > previous : current < previous,
        },
        calculatedAt: new Date(),
      };
    });
  }

  // ==================== Operational Metrics ====================

  async getOperationalMetrics(period: {
    start: Date;
    end: Date;
  }): Promise<OperationalMetric[]> {
    const metricTypes: OperationalMetric["metricType"][] = [
      "patient_volume",
      "appointment_utilization",
      "wait_time",
      "no_show_rate",
    ];

    return metricTypes.map((metricType) => {
      const value = Math.random() * 100;
      const target =
        metricType === "wait_time" || metricType === "no_show_rate"
          ? value * 0.8
          : value * 1.2;

      // Generate time series data
      const timeSeries = this.generateTimeSeries(
        period.start,
        period.end,
        "day",
      );

      return {
        id: this.generateId("ops"),
        metricType,
        period,
        value,
        unit: this.getMetricUnit(metricType),
        target,
        timeSeries,
        calculatedAt: new Date(),
      };
    });
  }

  private getMetricUnit(metricType: string): string {
    const units: Record<string, string> = {
      patient_volume: "patients",
      appointment_utilization: "%",
      wait_time: "minutes",
      no_show_rate: "%",
      length_of_stay: "days",
      bed_occupancy: "%",
    };

    return units[metricType] || "count";
  }

  // ==================== Population Health ====================

  async getPopulationHealthMetrics(
    populationId?: string,
  ): Promise<PopulationHealthMetric[]> {
    // Simulated population health data
    const populations = [
      "All Patients",
      "Diabetic Cohort",
      "Hypertensive Cohort",
      "High Risk",
    ];

    return populations.map((popName, idx) => {
      const current = Math.random() * 100;
      const previous = Math.random() * 100;

      return {
        id: this.generateId("pop"),
        populationId: `pop-${idx}`,
        populationName: popName,
        populationSize: Math.floor(Math.random() * 5000) + 1000,
        metricType: "risk_score",
        stratification: {
          byRiskLevel: {
            Low: Math.floor(Math.random() * 40) + 10,
            Medium: Math.floor(Math.random() * 40) + 10,
            High: Math.floor(Math.random() * 30) + 5,
          },
        },
        trend: {
          current,
          previous,
          changePercent: ((current - previous) / previous) * 100,
        },
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        calculatedAt: new Date(),
      };
    });
  }

  // ==================== Utility Methods ====================

  private generateTimeSeries(
    start: Date,
    end: Date,
    granularity: TimeGranularity,
  ): { timestamp: Date; value: number }[] {
    const series: { timestamp: Date; value: number }[] = [];
    const current = new Date(start);

    while (current <= end) {
      series.push({
        timestamp: new Date(current),
        value: Math.random() * 100,
      });

      // Increment based on granularity
      switch (granularity) {
        case "hour":
          current.setHours(current.getHours() + 1);
          break;
        case "day":
          current.setDate(current.getDate() + 1);
          break;
        case "week":
          current.setDate(current.getDate() + 7);
          break;
        case "month":
          current.setMonth(current.getMonth() + 1);
          break;
        case "quarter":
          current.setMonth(current.getMonth() + 3);
          break;
        case "year":
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    return series;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultMetrics(): void {
    // Sample quality measure
    const breastCancerScreening: QualityMeasure = {
      id: "qm_hedis_bcs",
      code: "HEDIS-BCS",
      name: "Breast Cancer Screening",
      description: "Women ages 50-74 who had mammogram in past 2 years",
      category: "preventive",
      numerator: {
        criteria: "Women 50-74 with mammogram in measurement period",
        count: 0,
      },
      denominator: {
        criteria: "All women ages 50-74",
        count: 0,
      },
      rate: 0,
      target: 70,
      benchmark: 75,
      measurementPeriod: {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31),
      },
      status: "at_risk",
      lastCalculated: new Date(),
      calculatedBy: "system",
    };

    this.qualityMeasures.set(breastCancerScreening.id, breastCancerScreening);

    // Sample metric definition
    const patientSatisfaction: MetricDefinition = {
      id: "metric_patient_sat",
      name: "Patient Satisfaction Score",
      description: "Average patient satisfaction rating (1-5)",
      category: "patient_satisfaction",
      calculation: {
        formula: "AVG(survey_responses.rating)",
        dependencies: [],
      },
      dataSource: "patient_surveys",
      requiredFields: ["rating", "survey_date"],
      unit: "score",
      format: "number",
      decimalPlaces: 2,
      benchmarks: {
        target: 4.5,
        industry: 4.2,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.metrics.set(patientSatisfaction.id, patientSatisfaction);
  }
}
