/**
 * Analytics Service
 * Handles data fetching, processing, and calculations for analytics features
 */

export interface MetricData {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: "up" | "down" | "stable";
  unit?: string;
  format?: "number" | "currency" | "percentage" | "duration";
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
  category?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  type: "quality" | "financial" | "operational" | "population" | "custom";
  widgets: Widget[];
  layout: LayoutItem[];
  filters?: FilterConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  shared: boolean;
  tags?: string[];
}

export interface Widget {
  id: string;
  type: "kpi" | "chart" | "table" | "trend" | "benchmark" | "heatmap";
  title: string;
  description?: string;
  dataSource: string;
  config: WidgetConfig;
  refreshInterval?: number;
}

export interface WidgetConfig {
  chartType?: "line" | "bar" | "pie" | "area" | "scatter" | "radar";
  metrics?: string[];
  dimensions?: string[];
  aggregation?: "sum" | "avg" | "count" | "min" | "max";
  filters?: Record<string, any>;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
}

export interface LayoutItem {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface FilterConfig {
  dateRange?: {
    start: string;
    end: string;
    preset?: "today" | "week" | "month" | "quarter" | "year" | "custom";
  };
  departments?: string[];
  providers?: string[];
  locations?: string[];
  payors?: string[];
  customFilters?: Record<string, any>;
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: FilterConfig;
  groupBy?: string[];
  orderBy?: { field: string; direction: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
}

export interface QueryResult {
  data: Record<string, any>[];
  total: number;
  aggregations?: Record<string, number>;
  metadata?: {
    query: AnalyticsQuery;
    executionTime: number;
    cached: boolean;
  };
}

class AnalyticsService {
  private baseUrl = "/api/analytics";

  /**
   * Fetch all dashboards
   */
  async getDashboards(filters?: {
    type?: string;
    shared?: boolean;
  }): Promise<Dashboard[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.shared !== undefined)
      params.append("shared", String(filters.shared));

    const response = await fetch(`${this.baseUrl}/dashboards?${params}`);
    if (!response.ok) throw new Error("Failed to fetch dashboards");
    return response.json();
  }

  /**
   * Get specific dashboard by ID
   */
  async getDashboard(id: string): Promise<Dashboard> {
    const response = await fetch(`${this.baseUrl}/dashboards/${id}`);
    if (!response.ok) throw new Error("Failed to fetch dashboard");
    return response.json();
  }

  /**
   * Create new dashboard
   */
  async createDashboard(
    dashboard: Omit<Dashboard, "id" | "createdAt" | "updatedAt">,
  ): Promise<Dashboard> {
    const response = await fetch(`${this.baseUrl}/dashboards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboard),
    });
    if (!response.ok) throw new Error("Failed to create dashboard");
    return response.json();
  }

  /**
   * Update existing dashboard
   */
  async updateDashboard(
    id: string,
    updates: Partial<Dashboard>,
  ): Promise<Dashboard> {
    const response = await fetch(`${this.baseUrl}/dashboards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error("Failed to update dashboard");
    return response.json();
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/dashboards/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete dashboard");
  }

  /**
   * Execute analytics query
   */
  async executeQuery(query: AnalyticsQuery): Promise<QueryResult> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    if (!response.ok) throw new Error("Failed to execute query");
    return response.json();
  }

  /**
   * Get quality metrics (CMS measures)
   */
  async getQualityMetrics(filters?: FilterConfig): Promise<MetricData[]> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics: [
          "readmission_rate",
          "mortality_rate",
          "patient_satisfaction",
          "core_measures",
          "infection_rate",
          "fall_rate",
        ],
        filters,
      }),
    });
    if (!response.ok) throw new Error("Failed to fetch quality metrics");
    const result = await response.json();
    return this.transformToMetricData(result.data);
  }

  /**
   * Get financial metrics
   */
  async getFinancialMetrics(filters?: FilterConfig): Promise<MetricData[]> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics: [
          "total_revenue",
          "net_revenue",
          "accounts_receivable",
          "days_in_ar",
          "collection_rate",
          "denial_rate",
          "operating_margin",
        ],
        filters,
      }),
    });
    if (!response.ok) throw new Error("Failed to fetch financial metrics");
    const result = await response.json();
    return this.transformToMetricData(result.data);
  }

  /**
   * Get operational metrics
   */
  async getOperationalMetrics(filters?: FilterConfig): Promise<MetricData[]> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics: [
          "patient_volume",
          "bed_occupancy",
          "average_length_of_stay",
          "er_wait_time",
          "staff_to_patient_ratio",
          "procedure_volume",
        ],
        filters,
      }),
    });
    if (!response.ok) throw new Error("Failed to fetch operational metrics");
    const result = await response.json();
    return this.transformToMetricData(result.data);
  }

  /**
   * Get population health metrics
   */
  async getPopulationMetrics(filters?: FilterConfig): Promise<MetricData[]> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics: [
          "total_patients",
          "active_patients",
          "high_risk_patients",
          "chronic_disease_prevalence",
          "preventive_care_compliance",
          "care_gap_closure_rate",
        ],
        filters,
      }),
    });
    if (!response.ok) throw new Error("Failed to fetch population metrics");
    const result = await response.json();
    return this.transformToMetricData(result.data);
  }

  /**
   * Get time series data for trending
   */
  async getTimeSeriesData(
    metric: string,
    filters?: FilterConfig,
    granularity: "hour" | "day" | "week" | "month" | "quarter" | "year" = "day",
  ): Promise<TimeSeriesData[]> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics: [metric],
        dimensions: ["date"],
        filters,
        groupBy: [granularity],
        orderBy: [{ field: "date", direction: "asc" }],
      }),
    });
    if (!response.ok) throw new Error("Failed to fetch time series data");
    const result = await response.json();
    return result.data.map((item: any) => ({
      timestamp: item.date,
      value: item[metric],
      label: item.label,
    }));
  }

  /**
   * Get benchmark data
   */
  async getBenchmarkData(
    metric: string,
    compareBy: "national" | "regional" | "peer" | "historical",
  ): Promise<{ current: number; benchmark: number; percentile: number }> {
    const response = await fetch(`${this.baseUrl}/metrics/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric, compareBy }),
    });
    if (!response.ok) throw new Error("Failed to fetch benchmark data");
    return response.json();
  }

  /**
   * Export data
   */
  async exportData(
    query: AnalyticsQuery,
    format: "csv" | "excel" | "pdf",
    options?: {
      includeCharts?: boolean;
      includeSummary?: boolean;
      template?: string;
    },
  ): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, format, options }),
    });
    if (!response.ok) throw new Error("Failed to export data");
    return response.blob();
  }

  /**
   * Schedule report
   */
  async scheduleReport(config: {
    name: string;
    query: AnalyticsQuery;
    format: "csv" | "excel" | "pdf";
    schedule: {
      frequency: "daily" | "weekly" | "monthly";
      time: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
    };
    recipients: string[];
  }): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/scheduled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error("Failed to schedule report");
    return response.json();
  }

  /**
   * Get widget data
   */
  async getWidgetData(widget: Widget, filters?: FilterConfig): Promise<any> {
    const query: AnalyticsQuery = {
      metrics: widget.config.metrics || [],
      dimensions: widget.config.dimensions,
      filters: { ...widget.config.filters, ...filters },
    };

    const result = await this.executeQuery(query);

    // Transform data based on widget type
    switch (widget.type) {
      case "kpi":
        return this.transformToKPIData(result.data, widget.config.metrics?.[0]);
      case "chart":
        return this.transformToChartData(result.data, widget.config);
      case "table":
        return result.data;
      case "trend":
        return this.transformToTrendData(result.data);
      default:
        return result.data;
    }
  }

  /**
   * Helper: Transform query result to metric data
   */
  private transformToMetricData(data: Record<string, any>[]): MetricData[] {
    return data.map((item) => {
      const change = item.previousValue
        ? item.value - item.previousValue
        : undefined;
      const changePercent = item.previousValue
        ? ((item.value - item.previousValue) / item.previousValue) * 100
        : undefined;

      return {
        id: item.id || item.name,
        name: item.name,
        value: item.value,
        previousValue: item.previousValue,
        change,
        changePercent,
        trend: this.calculateTrend(change),
        unit: item.unit,
        format: item.format || "number",
      };
    });
  }

  /**
   * Helper: Transform to KPI data
   */
  private transformToKPIData(
    data: Record<string, any>[],
    metric?: string,
  ): MetricData {
    if (data.length === 0) {
      return {
        id: metric || "unknown",
        name: metric || "Unknown",
        value: 0,
      };
    }

    const item = data[0];
    return this.transformToMetricData([item])[0];
  }

  /**
   * Helper: Transform to chart data
   */
  private transformToChartData(
    data: Record<string, any>[],
    config: WidgetConfig,
  ): any[] {
    return data.map((item) => {
      const transformed: Record<string, any> = {};

      config.dimensions?.forEach((dim) => {
        transformed[dim] = item[dim];
      });

      config.metrics?.forEach((metric) => {
        transformed[metric] = item[metric];
      });

      return transformed;
    });
  }

  /**
   * Helper: Transform to trend data
   */
  private transformToTrendData(data: Record<string, any>[]): TimeSeriesData[] {
    return data.map((item) => ({
      timestamp: item.date || item.timestamp,
      value: item.value,
      label: item.label,
      category: item.category,
    }));
  }

  /**
   * Helper: Calculate trend direction
   */
  private calculateTrend(change?: number): "up" | "down" | "stable" {
    if (!change || Math.abs(change) < 0.01) return "stable";
    return change > 0 ? "up" : "down";
  }

  /**
   * Get available metrics
   */
  async getAvailableMetrics(category?: string): Promise<
    {
      id: string;
      name: string;
      category: string;
      description: string;
      unit?: string;
      format?: string;
    }[]
  > {
    const allMetrics = [
      // Quality Metrics
      {
        id: "readmission_rate",
        name: "Readmission Rate",
        category: "quality",
        description: "30-day readmission rate",
        unit: "%",
        format: "percentage",
      },
      {
        id: "mortality_rate",
        name: "Mortality Rate",
        category: "quality",
        description: "Risk-adjusted mortality rate",
        unit: "%",
        format: "percentage",
      },
      {
        id: "patient_satisfaction",
        name: "Patient Satisfaction",
        category: "quality",
        description: "HCAHPS score",
        unit: "/100",
        format: "number",
      },
      {
        id: "core_measures",
        name: "Core Measures",
        category: "quality",
        description: "CMS core measures compliance",
        unit: "%",
        format: "percentage",
      },
      {
        id: "infection_rate",
        name: "Infection Rate",
        category: "quality",
        description: "Hospital-acquired infection rate",
        unit: "%",
        format: "percentage",
      },
      {
        id: "fall_rate",
        name: "Fall Rate",
        category: "quality",
        description: "Patient falls per 1000 days",
        unit: "/1000",
        format: "number",
      },

      // Financial Metrics
      {
        id: "total_revenue",
        name: "Total Revenue",
        category: "financial",
        description: "Gross revenue",
        unit: "$",
        format: "currency",
      },
      {
        id: "net_revenue",
        name: "Net Revenue",
        category: "financial",
        description: "Net revenue after adjustments",
        unit: "$",
        format: "currency",
      },
      {
        id: "accounts_receivable",
        name: "Accounts Receivable",
        category: "financial",
        description: "Outstanding AR",
        unit: "$",
        format: "currency",
      },
      {
        id: "days_in_ar",
        name: "Days in AR",
        category: "financial",
        description: "Average days in accounts receivable",
        unit: "days",
        format: "number",
      },
      {
        id: "collection_rate",
        name: "Collection Rate",
        category: "financial",
        description: "Percentage of revenue collected",
        unit: "%",
        format: "percentage",
      },
      {
        id: "denial_rate",
        name: "Denial Rate",
        category: "financial",
        description: "Claims denial rate",
        unit: "%",
        format: "percentage",
      },
      {
        id: "operating_margin",
        name: "Operating Margin",
        category: "financial",
        description: "Operating profit margin",
        unit: "%",
        format: "percentage",
      },

      // Operational Metrics
      {
        id: "patient_volume",
        name: "Patient Volume",
        category: "operational",
        description: "Total patient encounters",
        unit: "patients",
        format: "number",
      },
      {
        id: "bed_occupancy",
        name: "Bed Occupancy",
        category: "operational",
        description: "Bed occupancy rate",
        unit: "%",
        format: "percentage",
      },
      {
        id: "average_length_of_stay",
        name: "Average Length of Stay",
        category: "operational",
        description: "Average patient LOS",
        unit: "days",
        format: "number",
      },
      {
        id: "er_wait_time",
        name: "ER Wait Time",
        category: "operational",
        description: "Average ER wait time",
        unit: "min",
        format: "duration",
      },
      {
        id: "staff_to_patient_ratio",
        name: "Staff to Patient Ratio",
        category: "operational",
        description: "Nursing staff ratio",
        unit: ":1",
        format: "number",
      },
      {
        id: "procedure_volume",
        name: "Procedure Volume",
        category: "operational",
        description: "Total procedures performed",
        unit: "procedures",
        format: "number",
      },

      // Population Health Metrics
      {
        id: "total_patients",
        name: "Total Patients",
        category: "population",
        description: "Total patient population",
        unit: "patients",
        format: "number",
      },
      {
        id: "active_patients",
        name: "Active Patients",
        category: "population",
        description: "Actively managed patients",
        unit: "patients",
        format: "number",
      },
      {
        id: "high_risk_patients",
        name: "High Risk Patients",
        category: "population",
        description: "Patients identified as high risk",
        unit: "patients",
        format: "number",
      },
      {
        id: "chronic_disease_prevalence",
        name: "Chronic Disease Prevalence",
        category: "population",
        description: "Percentage with chronic conditions",
        unit: "%",
        format: "percentage",
      },
      {
        id: "preventive_care_compliance",
        name: "Preventive Care Compliance",
        category: "population",
        description: "Preventive care adherence",
        unit: "%",
        format: "percentage",
      },
      {
        id: "care_gap_closure_rate",
        name: "Care Gap Closure Rate",
        category: "population",
        description: "Rate of care gap closure",
        unit: "%",
        format: "percentage",
      },
    ];

    return category
      ? allMetrics.filter((m) => m.category === category)
      : allMetrics;
  }
}

export const analyticsService = new AnalyticsService();
