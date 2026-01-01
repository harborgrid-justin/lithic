"use client";

import { useState, useEffect } from "react";
import { imagingService, WorklistItem } from "@/services/imaging.service";

export default function RadiologyWorklist() {
  const [worklistItems, setWorklistItems] = useState<WorklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    modality: "",
    date: new Date().toISOString().split("T")[0],
    status: "",
  });

  useEffect(() => {
    loadWorklist();
  }, [filters]);

  const loadWorklist = async () => {
    try {
      setLoading(true);
      const data = await imagingService.getWorklist(filters);
      setWorklistItems(data);
    } catch (error) {
      console.error("Failed to load worklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await imagingService.updateWorklistItem(id, { status });
      await loadWorklist();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      CHECKED_IN: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      NO_SHOW: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      ROUTINE: "text-gray-600",
      URGENT: "text-orange-600 font-semibold",
      STAT: "text-red-600 font-bold",
      EMERGENCY: "text-red-700 font-bold",
    };
    return colors[priority] || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modality
            </label>
            <select
              value={filters.modality}
              onChange={(e) =>
                setFilters({ ...filters, modality: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Modalities</option>
              <option value="CT">CT</option>
              <option value="MR">MRI</option>
              <option value="XR">X-Ray</option>
              <option value="US">Ultrasound</option>
              <option value="NM">Nuclear Medicine</option>
              <option value="PT">PET</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Worklist Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Procedure
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Modality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {worklistItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {item.scheduledTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.patientName}
                  </div>
                  <div className="text-sm text-gray-500">
                    MRN: {item.patientMRN}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.patientSex} | DOB: {item.patientDOB}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{item.procedure}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {item.modality}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {item.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm ${getPriorityColor(item.priority)}`}
                  >
                    {item.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="CHECKED_IN">Check In</option>
                    <option value="IN_PROGRESS">Start</option>
                    <option value="COMPLETED">Complete</option>
                    <option value="NO_SHOW">No Show</option>
                    <option value="CANCELLED">Cancel</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
