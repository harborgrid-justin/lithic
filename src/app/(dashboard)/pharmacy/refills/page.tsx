/**
 * Refill Management Page
 * Manage prescription refill requests and processing
 */

"use client";

import { useEffect, useState } from "react";
import {
  prescriptionService,
  type RefillRequest,
} from "@/services/prescription.service";
import { RefillManager } from "@/components/pharmacy/RefillManager";

export default function RefillsPage() {
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "pending",
  });

  useEffect(() => {
    loadRefillRequests();
  }, [filter]);

  const loadRefillRequests = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getRefillRequests({
        status: filter.status || undefined,
      });
      setRefillRequests(data);
    } catch (error) {
      console.error("Failed to load refill requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefill = async (
    id: string,
    action: "approve" | "deny",
    notes?: string,
    denialReason?: string,
  ) => {
    try {
      await prescriptionService.processRefillRequest(id, action, {
        processedBy: "Current Pharmacist", // Would come from auth context
        notes,
        denialReason,
      });
      alert(`Refill request ${action}d successfully`);
      loadRefillRequests();
    } catch (error) {
      console.error(`Failed to ${action} refill request:`, error);
      alert(`Failed to ${action} refill request`);
    }
  };

  const stats = {
    total: refillRequests.length,
    pending: refillRequests.filter((r) => r.status === "pending").length,
    approved: refillRequests.filter((r) => r.status === "approved").length,
    denied: refillRequests.filter((r) => r.status === "denied").length,
    processing: refillRequests.filter((r) => r.status === "processing").length,
    completed: refillRequests.filter((r) => r.status === "completed").length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Refill Requests
            </h1>
            <p className="text-gray-600">
              Process and manage prescription refill requests
            </p>
          </div>
          <button
            onClick={loadRefillRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Processing</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.processing}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Denied</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.denied}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.completed}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: "" })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Refill Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading refill requests...
          </div>
        ) : (
          <RefillManager
            refillRequests={refillRequests}
            onProcess={handleProcessRefill}
            onRefresh={loadRefillRequests}
          />
        )}
      </div>
    </div>
  );
}
