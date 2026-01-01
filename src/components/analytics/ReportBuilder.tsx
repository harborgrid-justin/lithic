"use client";

import { useState } from "react";
import { Save, X, FileText, Plus, Trash2, GripVertical } from "lucide-react";
import { Report, ReportSchedule } from "@/services/reporting.service";
import { AnalyticsQuery } from "@/services/analytics.service";

interface ReportBuilderProps {
  report?: Report;
  onSave: (report: Partial<Report>) => void;
  onCancel: () => void;
}

export function ReportBuilder({
  report,
  onSave,
  onCancel,
}: ReportBuilderProps) {
  const [name, setName] = useState(report?.name || "");
  const [description, setDescription] = useState(report?.description || "");
  const [type, setType] = useState<Report["type"]>(report?.type || "custom");
  const [format, setFormat] = useState<Report["format"]>(
    report?.format || "pdf",
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    report?.query.metrics || [],
  );
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(
    report?.query.dimensions || [],
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(!!report?.schedule);
  const [schedule, setSchedule] = useState<ReportSchedule>(
    report?.schedule || {
      frequency: "weekly",
      time: "09:00",
      dayOfWeek: 1,
    },
  );
  const [recipients, setRecipients] = useState<string[]>(
    report?.recipients || [],
  );
  const [newRecipient, setNewRecipient] = useState("");

  // Available metrics (in real app, this would come from API)
  const availableMetrics = [
    { id: "patient_volume", name: "Patient Volume", category: "operational" },
    { id: "readmission_rate", name: "Readmission Rate", category: "quality" },
    {
      id: "patient_satisfaction",
      name: "Patient Satisfaction",
      category: "quality",
    },
    { id: "total_revenue", name: "Total Revenue", category: "financial" },
    { id: "net_revenue", name: "Net Revenue", category: "financial" },
    { id: "collection_rate", name: "Collection Rate", category: "financial" },
    { id: "bed_occupancy", name: "Bed Occupancy", category: "operational" },
    {
      id: "average_length_of_stay",
      name: "Average Length of Stay",
      category: "operational",
    },
  ];

  const availableDimensions = [
    { id: "date", name: "Date" },
    { id: "department", name: "Department" },
    { id: "provider", name: "Provider" },
    { id: "location", name: "Location" },
    { id: "payor", name: "Payor" },
  ];

  const handleMetricToggle = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((m) => m !== metricId)
        : [...prev, metricId],
    );
  };

  const handleDimensionToggle = (dimensionId: string) => {
    setSelectedDimensions((prev) =>
      prev.includes(dimensionId)
        ? prev.filter((d) => d !== dimensionId)
        : [...prev, dimensionId],
    );
  };

  const handleAddRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a report name");
      return;
    }

    if (selectedMetrics.length === 0) {
      alert("Please select at least one metric");
      return;
    }

    const query: AnalyticsQuery = {
      metrics: selectedMetrics,
      dimensions:
        selectedDimensions.length > 0 ? selectedDimensions : undefined,
    };

    const reportData: Partial<Report> = {
      name: name.trim(),
      description: description.trim(),
      type,
      format,
      query,
      schedule: scheduleEnabled ? schedule : undefined,
      recipients: recipients.length > 0 ? recipients : undefined,
      status: "active",
      createdBy: "current-user", // In real app, get from auth
    };

    if (report) {
      reportData.id = report.id;
    }

    onSave(reportData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {report ? "Edit Report" : "Create Report"}
                </h1>
                <p className="text-sm text-gray-500">
                  Configure report settings and schedule
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Report
              </button>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter report name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter report description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as Report["type"])
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="custom">Custom</option>
                      <option value="quality">Quality</option>
                      <option value="financial">Financial</option>
                      <option value="operational">Operational</option>
                      <option value="population">Population Health</option>
                      <option value="regulatory">Regulatory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Export Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) =>
                        setFormat(e.target.value as Report["format"])
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Metrics *
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableMetrics.map((metric) => (
                  <label
                    key={metric.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={() => handleMetricToggle(metric.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {metric.name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {metric.category}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Dimensions Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Group By (Optional)
              </h2>
              <div className="space-y-2">
                {availableDimensions.map((dimension) => (
                  <label
                    key={dimension.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDimensions.includes(dimension.id)}
                      onChange={() => handleDimensionToggle(dimension.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">
                      {dimension.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Schedule
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable</span>
                </label>
              </div>

              {scheduleEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={schedule.frequency}
                      onChange={(e) =>
                        setSchedule({
                          ...schedule,
                          frequency: e.target
                            .value as ReportSchedule["frequency"],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) =>
                        setSchedule({ ...schedule, time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {schedule.frequency === "weekly" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Week
                      </label>
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            dayOfWeek: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </div>
                  )}

                  {schedule.frequency === "monthly" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day of Month
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={schedule.dayOfMonth}
                        onChange={(e) =>
                          setSchedule({
                            ...schedule,
                            dayOfMonth: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recipients */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recipients
              </h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddRecipient()
                    }
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={handleAddRecipient}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {recipients.length > 0 && (
                  <div className="space-y-2">
                    {recipients.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{email}</span>
                        <button
                          onClick={() => handleRemoveRecipient(email)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
