"use client";

import { useState, useEffect } from "react";
import { imagingService, RadiologyReport } from "@/services/imaging.service";

interface ReportEditorProps {
  studyId?: string;
  reportId?: string;
  onSave?: (report: RadiologyReport) => void;
  onSign?: (report: RadiologyReport) => void;
}

export default function ReportEditor({
  studyId,
  reportId,
  onSave,
  onSign,
}: ReportEditorProps) {
  const [report, setReport] = useState<Partial<RadiologyReport>>({
    studyId: studyId || "",
    technique: "",
    comparison: "",
    findings: "",
    impression: "",
    recommendations: "",
    criticalFindings: "",
  });
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
    loadTemplates();
  }, [reportId]);

  const loadReport = async () => {
    if (!reportId) return;
    try {
      const data = await imagingService.getReport(reportId);
      setReport(data);
    } catch (error) {
      console.error("Failed to load report:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await imagingService.getReportTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let savedReport;
      if (reportId) {
        savedReport = await imagingService.updateReport(reportId, report);
      } else {
        savedReport = await imagingService.createReport(report);
      }
      onSave?.(savedReport);
    } catch (error) {
      console.error("Failed to save report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!reportId) {
      alert("Please save the report first");
      return;
    }
    setLoading(true);
    try {
      const signedReport = await imagingService.signReport(reportId);
      onSign?.(signedReport);
    } catch (error) {
      console.error("Failed to sign report:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setReport((prev) => ({
        ...prev,
        technique: template.technique || "",
        findings: template.findings || "",
        impression: template.impression || "",
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {reportId ? "Edit Report" : "New Radiology Report"}
        </h2>
        <div className="flex space-x-2">
          {templates.length > 0 && (
            <select
              onChange={(e) => applyTemplate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
              defaultValue=""
            >
              <option value="">Load Template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Report Form */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        {/* Technique */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Technique
          </label>
          <textarea
            value={report.technique || ""}
            onChange={(e) =>
              setReport({ ...report, technique: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the imaging technique used..."
          />
        </div>

        {/* Comparison */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comparison
          </label>
          <textarea
            value={report.comparison || ""}
            onChange={(e) =>
              setReport({ ...report, comparison: e.target.value })
            }
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Previous studies for comparison..."
          />
        </div>

        {/* Findings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Findings <span className="text-red-500">*</span>
          </label>
          <textarea
            value={report.findings || ""}
            onChange={(e) => setReport({ ...report, findings: e.target.value })}
            rows={10}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed findings..."
          />
        </div>

        {/* Impression */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Impression <span className="text-red-500">*</span>
          </label>
          <textarea
            value={report.impression || ""}
            onChange={(e) =>
              setReport({ ...report, impression: e.target.value })
            }
            rows={5}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Summary and impression..."
          />
        </div>

        {/* Recommendations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recommendations
          </label>
          <textarea
            value={report.recommendations || ""}
            onChange={(e) =>
              setReport({ ...report, recommendations: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Clinical recommendations..."
          />
        </div>

        {/* Critical Findings */}
        <div>
          <label className="block text-sm font-medium text-red-700 mb-1">
            Critical Findings
          </label>
          <textarea
            value={report.criticalFindings || ""}
            onChange={(e) =>
              setReport({ ...report, criticalFindings: e.target.value })
            }
            rows={2}
            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
            placeholder="Any critical or urgent findings requiring immediate attention..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {report.status && (
            <span className="font-medium">Status: {report.status}</span>
          )}
          {report.signedBy && report.signedDate && (
            <span className="ml-4">
              Signed by {report.signedBy} on{" "}
              {new Date(report.signedDate).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={loading || !report.findings || !report.impression}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handleSign}
            disabled={loading || !reportId || report.status === "FINAL"}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Sign Report
          </button>
        </div>
      </div>
    </div>
  );
}
