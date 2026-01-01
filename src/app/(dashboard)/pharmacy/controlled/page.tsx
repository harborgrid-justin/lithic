/**
 * Controlled Substance Log Page
 * Track and manage controlled substance transactions
 */

"use client";

import { useEffect, useState } from "react";
import {
  pharmacyService,
  type ControlledSubstanceLog,
} from "@/services/pharmacy.service";
import { ControlledSubstanceLog as ControlledSubstanceLogComponent } from "@/components/pharmacy/ControlledSubstanceLog";

export default function ControlledSubstancePage() {
  const [logs, setLogs] = useState<ControlledSubstanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    transactionType: "",
    drugId: "",
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getControlledSubstanceLog({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        transactionType: filters.transactionType || undefined,
        drugId: filters.drugId || undefined,
      });
      setLogs(data);
    } catch (error) {
      console.error("Failed to load controlled substance logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: logs.length,
    receive: logs.filter((l) => l.transactionType === "receive").length,
    dispense: logs.filter((l) => l.transactionType === "dispense").length,
    waste: logs.filter((l) => l.transactionType === "waste").length,
    transfer: logs.filter((l) => l.transactionType === "transfer").length,
    inventoryCount: logs.filter((l) => l.transactionType === "inventory-count")
      .length,
  };

  const scheduleBreakdown = {
    scheduleII: logs.filter((l) => l.drug?.deaSchedule === "II").length,
    scheduleIII: logs.filter((l) => l.drug?.deaSchedule === "III").length,
    scheduleIV: logs.filter((l) => l.drug?.deaSchedule === "IV").length,
    scheduleV: logs.filter((l) => l.drug?.deaSchedule === "V").length,
  };

  const handleExportLog = () => {
    // Create CSV export
    const headers = [
      "Date/Time",
      "Transaction Type",
      "Drug Name",
      "NDC",
      "DEA Schedule",
      "Quantity",
      "Lot Number",
      "Dispensed By",
      "Verified By",
      "Patient ID",
      "Prescription ID",
      "Notes",
    ];

    const rows = logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.transactionType,
      log.drug?.name || "",
      log.ndc,
      log.drug?.deaSchedule || "",
      log.quantity,
      log.lotNumber,
      log.dispensedBy || "",
      log.verifiedBy || "",
      log.patientId || "",
      log.prescriptionId || "",
      log.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `controlled-substance-log-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Controlled Substance Log
            </h1>
            <p className="text-gray-600">
              Track all controlled substance transactions and inventory
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportLog}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Export Log
            </button>
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Received</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.receive}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Dispensed</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.dispense}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-orange-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Wasted</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.waste}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Transferred</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.transfer}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Inventory Counts</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inventoryCount}
            </div>
          </div>
        </div>

        {/* Schedule Breakdown */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Schedule II</div>
            <div className="text-2xl font-bold text-red-700">
              {scheduleBreakdown.scheduleII}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg border-2 border-orange-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Schedule III</div>
            <div className="text-2xl font-bold text-orange-700">
              {scheduleBreakdown.scheduleIII}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Schedule IV</div>
            <div className="text-2xl font-bold text-yellow-700">
              {scheduleBreakdown.scheduleIV}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Schedule V</div>
            <div className="text-2xl font-bold text-green-700">
              {scheduleBreakdown.scheduleV}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              value={filters.transactionType}
              onChange={(e) =>
                setFilters({ ...filters, transactionType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="receive">Receive</option>
              <option value="dispense">Dispense</option>
              <option value="waste">Waste</option>
              <option value="transfer">Transfer</option>
              <option value="inventory-count">Inventory Count</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  endDate: new Date().toISOString().split("T")[0],
                  transactionType: "",
                  drugId: "",
                })
              }
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading controlled substance log...
          </div>
        ) : (
          <ControlledSubstanceLogComponent logs={logs} onRefresh={loadLogs} />
        )}
      </div>
    </div>
  );
}
