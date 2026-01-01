"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ReportEditor from "@/components/imaging/ReportEditor";
import VoiceDictation from "@/components/imaging/VoiceDictation";
import { imagingService, RadiologyReport } from "@/services/imaging.service";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const studyId = searchParams.get("studyId");
  const isNew = searchParams.get("new") === "true";

  const [reports, setReports] = useState<RadiologyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<RadiologyReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showDictation, setShowDictation] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    radiologist: "",
  });

  useEffect(() => {
    loadReports();
  }, [filters, studyId]);

  const loadReports = async () => {
    try {
      const data = await imagingService.getReports({
        ...filters,
        studyId: studyId || undefined,
      });
      setReports(data);
      if (isNew && studyId) {
        // Create new report mode
        setSelectedReport(null);
      } else if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      DRAFT: "bg-yellow-100 text-yellow-800",
      PRELIMINARY: "bg-blue-100 text-blue-800",
      FINAL: "bg-green-100 text-green-800",
      AMENDED: "bg-purple-100 text-purple-800",
      CORRECTED: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Reports List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-4">Radiology Reports</h2>

          {/* Filters */}
          <div className="space-y-2">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PRELIMINARY">Preliminary</option>
              <option value="FINAL">Final</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto">
          {reports.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {isNew ? "Create a new report" : "No reports found"}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedReport?.id === report.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm truncate">
                      {report.patientName}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(report.status)}`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{report.studyDescription}</div>
                    <div>
                      {new Date(report.reportDate).toLocaleDateString()}
                    </div>
                    <div>by {report.radiologist}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Report Button */}
        {!isNew && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setSelectedReport(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              New Report
            </button>
          </div>
        )}
      </div>

      {/* Report Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Voice Dictation Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowDictation(!showDictation)}
              className={`px-4 py-2 rounded ${
                showDictation
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {showDictation ? "Hide" : "Show"} Voice Dictation
            </button>
          </div>

          {/* Voice Dictation */}
          {showDictation && (
            <VoiceDictation
              onTranscript={(text) => console.log("Transcript:", text)}
              onComplete={(text) => console.log("Complete:", text)}
            />
          )}

          {/* Report Editor */}
          <ReportEditor
            studyId={studyId || undefined}
            reportId={selectedReport?.id}
            onSave={(report) => {
              loadReports();
              setSelectedReport(report);
            }}
            onSign={(report) => {
              loadReports();
              setSelectedReport(report);
            }}
          />
        </div>
      </div>
    </div>
  );
}
