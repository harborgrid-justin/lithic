"use client";

import { useState } from "react";
import { Denial } from "@/types/billing";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";

interface DenialManagerProps {
  denials: Denial[];
  onUpdateDenial?: (id: string, data: Partial<Denial>) => void;
  onAppeal?: (id: string, notes: string) => void;
}

export default function DenialManager({
  denials,
  onUpdateDenial,
  onAppeal,
}: DenialManagerProps) {
  const [selectedDenial, setSelectedDenial] = useState<Denial | null>(null);
  const [appealNotes, setAppealNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<Denial["status"] | "all">(
    "all",
  );
  const [filterPriority, setFilterPriority] = useState<
    Denial["priority"] | "all"
  >("all");

  const filteredDenials = denials.filter((denial) => {
    const matchesStatus =
      filterStatus === "all" || denial.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || denial.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const handleAppeal = (denialId: string) => {
    if (appealNotes.trim() && onAppeal) {
      onAppeal(denialId, appealNotes);
      setAppealNotes("");
      setSelectedDenial(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "in_progress":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "appealed":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "overturned":
      case "resubmitted":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const stats = {
    total: denials.length,
    pending: denials.filter((d) => d.status === "pending").length,
    inProgress: denials.filter((d) => d.status === "in_progress").length,
    appealed: denials.filter((d) => d.status === "appealed").length,
    totalAmount: denials.reduce((sum, d) => sum + d.deniedAmount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Denials</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Appealed</p>
          <p className="text-2xl font-bold text-orange-900">{stats.appealed}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Total Amount</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="appealed">Appealed</option>
              <option value="overturned">Overturned</option>
              <option value="upheld">Upheld</option>
              <option value="resubmitted">Resubmitted</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Priority
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Denials List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Claim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Denial Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDenials.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No denials found
                  </td>
                </tr>
              ) : (
                filteredDenials.map((denial) => (
                  <tr
                    key={denial.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedDenial(denial)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-primary-600">
                      {denial.claimNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {denial.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(denial.denialDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {denial.denialReason.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatCurrency(denial.deniedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(denial.priority)}`}
                      >
                        {denial.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(denial.status)}
                        <span className="text-sm capitalize">
                          {denial.status.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {denial.assignedTo || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(denial.status === "pending" ||
                        denial.status === "in_progress") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDenial(denial);
                          }}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Work
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Denial Detail Modal */}
      {selectedDenial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Denial Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Claim: {selectedDenial.claimNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDenial(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="font-medium text-gray-900">
                    {selectedDenial.patientName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Denial Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedDenial.denialDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Denied Amount</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(selectedDenial.deniedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Appeal Deadline</p>
                  <p className="font-medium text-gray-900">
                    {selectedDenial.appealDeadline
                      ? formatDate(selectedDenial.appealDeadline)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Denial Reason</p>
                <p className="font-medium text-gray-900">
                  {selectedDenial.denialReason.replace("_", " ")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Details</p>
                <p className="text-gray-900">{selectedDenial.denialDetails}</p>
              </div>

              {selectedDenial.appealNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Appeal Notes</p>
                  <p className="text-gray-900">{selectedDenial.appealNotes}</p>
                </div>
              )}

              {(selectedDenial.status === "pending" ||
                selectedDenial.status === "in_progress") && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appeal Notes
                  </label>
                  <textarea
                    value={appealNotes}
                    onChange={(e) => setAppealNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter appeal notes and supporting documentation details..."
                  />
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        onUpdateDenial?.(selectedDenial.id, {
                          status: "in_progress",
                        });
                        setSelectedDenial(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => handleAppeal(selectedDenial.id)}
                      disabled={!appealNotes.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Appeal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
