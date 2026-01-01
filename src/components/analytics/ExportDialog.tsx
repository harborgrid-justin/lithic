"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Download, Calendar } from "lucide-react";
import { ExportConfig } from "@/lib/analytics/export";
import { formatDate } from "@/lib/utils";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport?: (config: ExportConfig) => Promise<void>;
  defaultDateRange?: {
    start: Date;
    end: Date;
  };
  reportType?: string;
}

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  defaultDateRange,
  reportType = "analytics",
}: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [config, setConfig] = useState<Partial<ExportConfig>>({
    format: "excel",
    filename: `${reportType}_report_${new Date().toISOString().split("T")[0]}`,
    dateRange: defaultDateRange || {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
    },
    includeCharts: true,
    includeMetadata: true,
    fields: [],
  });

  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  const availableFields = [
    { id: "date", label: "Date/Period", checked: true },
    { id: "metric", label: "Metric Name", checked: true },
    { id: "value", label: "Value", checked: true },
    { id: "target", label: "Target", checked: true },
    { id: "trend", label: "Trend", checked: false },
    { id: "previousValue", label: "Previous Value", checked: false },
    { id: "change", label: "Change", checked: false },
    { id: "percentChange", label: "Percent Change", checked: false },
  ];

  const handleFormatChange = (format: string) => {
    setConfig((prev) => ({
      ...prev,
      format: format as ExportConfig["format"],
    }));
  };

  const handleDateChange = (field: "start" | "end", value: string) => {
    setConfig((prev) => ({
      ...prev,
      dateRange: {
        ...(prev.dateRange || { start: new Date(), end: new Date() }),
        [field]: new Date(value),
      },
    }));
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });

    setConfig((prev) => ({
      ...prev,
      fields: Array.from(selectedFields),
    }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const exportConfig: ExportConfig = {
        format: config.format || "excel",
        filename: config.filename || "export",
        dateRange: config.dateRange,
        fields: Array.from(selectedFields),
        includeCharts: config.includeCharts,
        includeMetadata: config.includeMetadata,
      };

      if (onExport) {
        await onExport(exportConfig);
      } else {
        // Default export handling
        console.log("Exporting with config:", exportConfig);
        // Simulate export
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      onClose();
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <Label
              htmlFor="format"
              className="text-sm font-medium text-gray-700"
            >
              Export Format
            </Label>
            <Select value={config.format} onValueChange={handleFormatChange}>
              <SelectTrigger id="format" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="json">JSON (.json)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {config.format === "excel" &&
                "Excel format with charts and formatting"}
              {config.format === "pdf" && "PDF report with visualizations"}
              {config.format === "csv" && "CSV format for data analysis"}
              {config.format === "json" &&
                "JSON format for programmatic access"}
            </p>
          </div>

          {/* Filename */}
          <div>
            <Label
              htmlFor="filename"
              className="text-sm font-medium text-gray-700"
            >
              Filename
            </Label>
            <Input
              id="filename"
              type="text"
              value={config.filename}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, filename: e.target.value }))
              }
              className="mt-1"
              placeholder="report_name"
            />
            <p className="text-xs text-gray-500 mt-1">
              Extension will be added automatically based on format
            </p>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs text-gray-600">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={
                    config.dateRange?.start
                      ? config.dateRange.start.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs text-gray-600">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={
                    config.dateRange?.end
                      ? config.dateRange.end.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Fields to Include
            </Label>
            <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="space-y-3">
                {availableFields.map((field) => (
                  <div key={field.id} className="flex items-center">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.has(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                    <label
                      htmlFor={field.id}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select which data fields to include in the export
            </p>
          </div>

          {/* Additional Options */}
          {(config.format === "excel" || config.format === "pdf") && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Additional Options
              </Label>

              <div className="flex items-center">
                <Checkbox
                  id="includeCharts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      includeCharts: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="includeCharts"
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  Include Charts and Visualizations
                </label>
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="includeMetadata"
                  checked={config.includeMetadata}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      includeMetadata: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="includeMetadata"
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  Include Report Metadata (date generated, filters, etc.)
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Export Summary
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                <span className="font-medium">Format:</span>{" "}
                {config.format?.toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Filename:</span> {config.filename}
                {config.format === "excel" && ".xlsx"}
                {config.format === "pdf" && ".pdf"}
                {config.format === "csv" && ".csv"}
                {config.format === "json" && ".json"}
              </div>
              {config.dateRange && (
                <div>
                  <span className="font-medium">Period:</span>{" "}
                  {formatDate(config.dateRange.start)} -{" "}
                  {formatDate(config.dateRange.end)}
                </div>
              )}
              <div>
                <span className="font-medium">Fields:</span>{" "}
                {selectedFields.size} selected
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
