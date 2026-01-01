/**
 * Data Export Utilities
 * Excel generation, PDF reports, CSV export, scheduled exports
 */

export interface ExportConfig {
  format: "excel" | "pdf" | "csv" | "json";
  filename: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fields?: string[];
  includeCharts?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  url?: string;
  error?: string;
  size?: number;
}

export interface ScheduledExport {
  id: string;
  name: string;
  description: string;
  config: ExportConfig;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
  recipients: string[];
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  fields?: string[],
): string {
  if (data.length === 0) {
    return "";
  }

  // Determine fields to export
  const exportFields = fields || Object.keys(data[0]);

  // Create header row
  const header = exportFields.join(",");

  // Create data rows
  const rows = data.map((row) => {
    return exportFields
      .map((field) => {
        const value = row[field];

        // Handle different data types
        if (value === null || value === undefined) {
          return "";
        }

        if (typeof value === "string") {
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (
            value.includes(",") ||
            value.includes("\n") ||
            value.includes('"')
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }

        if (value instanceof Date) {
          return value.toISOString();
        }

        return String(value);
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Export data to Excel format (XLSX)
 * Note: In production, use a library like exceljs or xlsx
 */
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  config: {
    sheetName?: string;
    fields?: string[];
    includeStyles?: boolean;
    includeFormulas?: boolean;
  } = {},
): Promise<Blob> {
  const { sheetName = "Sheet1", fields, includeStyles = true } = config;

  // In a real implementation, use exceljs or similar library
  // This is a simplified version that creates a basic Excel-compatible format
  const csv = exportToCSV(data, fields);

  // Convert CSV to Excel-compatible XML format (simplified)
  const xlsContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${sheetName}">
  <Table>
${csv
  .split("\n")
  .map(
    (row) =>
      `   <Row>${row
        .split(",")
        .map((cell) => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`)
        .join("")}</Row>`,
  )
  .join("\n")}
  </Table>
 </Worksheet>
</Workbook>`;

  return new Blob([xlsContent], {
    type: "application/vnd.ms-excel",
  });
}

/**
 * Export data to PDF format
 * Note: In production, use a library like pdfmake or jsPDF
 */
export async function exportToPDF(
  content: {
    title: string;
    subtitle?: string;
    sections: {
      heading: string;
      content: string | string[];
      table?: {
        headers: string[];
        rows: string[][];
      };
    }[];
    metadata?: Record<string, string>;
  },
  config: {
    orientation?: "portrait" | "landscape";
    pageSize?: "letter" | "legal" | "a4";
    includeHeader?: boolean;
    includeFooter?: boolean;
  } = {},
): Promise<Blob> {
  // In a real implementation, use pdfmake or jsPDF
  // This is a placeholder that returns a text representation

  let pdfContent = `${content.title}\n`;
  if (content.subtitle) {
    pdfContent += `${content.subtitle}\n`;
  }
  pdfContent += "\n";

  if (content.metadata) {
    pdfContent += "Metadata:\n";
    for (const [key, value] of Object.entries(content.metadata)) {
      pdfContent += `  ${key}: ${value}\n`;
    }
    pdfContent += "\n";
  }

  for (const section of content.sections) {
    pdfContent += `\n${section.heading}\n`;
    pdfContent += "=".repeat(section.heading.length) + "\n\n";

    if (typeof section.content === "string") {
      pdfContent += section.content + "\n";
    } else {
      section.content.forEach((line) => {
        pdfContent += `  - ${line}\n`;
      });
    }

    if (section.table) {
      pdfContent += "\n";
      pdfContent += section.table.headers.join(" | ") + "\n";
      pdfContent += "-".repeat(section.table.headers.join(" | ").length) + "\n";
      section.table.rows.forEach((row) => {
        pdfContent += row.join(" | ") + "\n";
      });
    }

    pdfContent += "\n";
  }

  return new Blob([pdfContent], { type: "application/pdf" });
}

/**
 * Generate dashboard export
 */
export async function exportDashboard(
  dashboardData: {
    title: string;
    dateRange: { start: Date; end: Date };
    kpis: Array<{ name: string; value: number; unit: string }>;
    charts: Array<{ title: string; data: any[] }>;
    summary: string;
  },
  format: "pdf" | "excel",
): Promise<Blob> {
  if (format === "pdf") {
    const pdfContent = {
      title: dashboardData.title,
      subtitle: `Report Period: ${dashboardData.dateRange.start.toLocaleDateString()} - ${dashboardData.dateRange.end.toLocaleDateString()}`,
      sections: [
        {
          heading: "Executive Summary",
          content: dashboardData.summary,
        },
        {
          heading: "Key Performance Indicators",
          content: dashboardData.kpis.map(
            (kpi) => `${kpi.name}: ${kpi.value} ${kpi.unit}`,
          ),
        },
        {
          heading: "Detailed Analytics",
          content: dashboardData.charts.map((chart) => chart.title),
        },
      ],
      metadata: {
        "Generated On": new Date().toLocaleString(),
        "Report Type": "Executive Dashboard",
      },
    };

    return exportToPDF(pdfContent);
  } else {
    // Excel export
    const excelData = dashboardData.kpis.map((kpi) => ({
      Metric: kpi.name,
      Value: kpi.value,
      Unit: kpi.unit,
    }));

    return exportToExcel(excelData, {
      sheetName: "KPI Summary",
      includeStyles: true,
    });
  }
}

/**
 * Create downloadable file from blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export analytics data with configuration
 */
export async function exportAnalyticsData<T extends Record<string, any>>(
  data: T[],
  config: ExportConfig,
): Promise<ExportResult> {
  try {
    let blob: Blob;
    let mimeType: string;

    // Filter data by date range if specified
    let filteredData = data;
    if (config.dateRange && data.length > 0 && "timestamp" in data[0]) {
      filteredData = data.filter((item) => {
        const timestamp = new Date(item.timestamp);
        return (
          timestamp >= config.dateRange!.start &&
          timestamp <= config.dateRange!.end
        );
      });
    }

    // Filter fields if specified
    if (config.fields && config.fields.length > 0) {
      filteredData = filteredData.map((item) => {
        const filtered: any = {};
        config.fields!.forEach((field) => {
          filtered[field] = item[field];
        });
        return filtered;
      });
    }

    switch (config.format) {
      case "csv":
        const csv = exportToCSV(filteredData, config.fields);
        blob = new Blob([csv], { type: "text/csv" });
        mimeType = "text/csv";
        break;

      case "excel":
        blob = await exportToExcel(filteredData, {
          fields: config.fields,
          includeStyles: true,
        });
        mimeType = "application/vnd.ms-excel";
        break;

      case "json":
        const json = JSON.stringify(filteredData, null, 2);
        blob = new Blob([json], { type: "application/json" });
        mimeType = "application/json";
        break;

      case "pdf":
        // For PDF, we need to format the data
        const pdfContent = {
          title: "Analytics Report",
          sections: [
            {
              heading: "Data Export",
              content: "Generated report data",
              table: {
                headers: config.fields || Object.keys(filteredData[0] || {}),
                rows: filteredData.map((item) =>
                  (config.fields || Object.keys(item)).map((field) =>
                    String(item[field] || ""),
                  ),
                ),
              },
            },
          ],
          metadata: {
            "Record Count": String(filteredData.length),
            "Export Date": new Date().toLocaleString(),
          },
        };
        blob = await exportToPDF(pdfContent);
        mimeType = "application/pdf";
        break;

      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }

    // In a real implementation, you would upload to cloud storage
    // and return a URL. For now, we'll create a local download
    downloadFile(blob, config.filename);

    return {
      success: true,
      filename: config.filename,
      size: blob.size,
    };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      filename: config.filename,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule recurring export
 */
export function scheduleExport(
  exportConfig: Omit<ScheduledExport, "id" | "lastRun" | "nextRun">,
): ScheduledExport {
  const id = crypto.randomUUID?.() || Math.random().toString(36);
  const nextRun = calculateNextRun(exportConfig.schedule);

  return {
    id,
    ...exportConfig,
    nextRun,
  };
}

/**
 * Calculate next run time for scheduled export
 */
function calculateNextRun(schedule: ScheduledExport["schedule"]): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(":").map(Number);
  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case "daily":
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      if (schedule.dayOfWeek !== undefined) {
        const daysUntilNext = (schedule.dayOfWeek - nextRun.getDay() + 7) % 7;
        nextRun.setDate(nextRun.getDate() + daysUntilNext);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
      }
      break;

    case "monthly":
      if (schedule.dayOfMonth !== undefined) {
        nextRun.setDate(schedule.dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;

    case "quarterly":
      const currentQuarter = Math.floor(nextRun.getMonth() / 3);
      const nextQuarterMonth = (currentQuarter + 1) * 3;
      nextRun.setMonth(nextQuarterMonth, schedule.dayOfMonth || 1);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
  }

  return nextRun;
}

/**
 * Process scheduled export
 */
export async function processScheduledExport(
  scheduledExport: ScheduledExport,
  dataFetcher: () => Promise<any[]>,
): Promise<ExportResult> {
  try {
    // Fetch data
    const data = await dataFetcher();

    // Execute export
    const result = await exportAnalyticsData(data, scheduledExport.config);

    // Update last run and next run
    scheduledExport.lastRun = new Date();
    scheduledExport.nextRun = calculateNextRun(scheduledExport.schedule);

    // In production, send email to recipients with attachment
    if (result.success && scheduledExport.recipients.length > 0) {
      await sendExportEmail(
        scheduledExport.recipients,
        result,
        scheduledExport,
      );
    }

    return result;
  } catch (error) {
    console.error("Scheduled export error:", error);
    return {
      success: false,
      filename: scheduledExport.config.filename,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send export via email (placeholder)
 */
async function sendExportEmail(
  recipients: string[],
  exportResult: ExportResult,
  config: ScheduledExport,
): Promise<void> {
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  console.log("Sending export email to:", recipients);
  console.log("Export:", exportResult);
  console.log("Config:", config);

  // Placeholder for email sending logic
}

/**
 * Batch export multiple datasets
 */
export async function batchExport(
  exports: Array<{
    name: string;
    data: any[];
    config: Partial<ExportConfig>;
  }>,
  format: "excel" | "zip",
): Promise<ExportResult> {
  try {
    if (format === "excel") {
      // Create multi-sheet Excel workbook
      // In production, use exceljs to create actual multi-sheet workbook
      const firstExport = exports[0];
      if (!firstExport) {
        throw new Error("No exports provided");
      }

      const blob = await exportToExcel(firstExport.data, {
        sheetName: firstExport.name,
      });

      const filename = `batch_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      downloadFile(blob, filename);

      return {
        success: true,
        filename,
        size: blob.size,
      };
    } else {
      // Create ZIP file with multiple exports
      // In production, use jszip library
      throw new Error("ZIP export not yet implemented");
    }
  } catch (error) {
    return {
      success: false,
      filename: "batch_export",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
