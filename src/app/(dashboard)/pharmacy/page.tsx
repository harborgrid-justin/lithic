/**
 * Pharmacy Dashboard Page
 * Main pharmacy overview with key metrics and quick actions
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  prescriptionService,
  type Prescription,
} from "@/services/prescription.service";
import {
  pharmacyService,
  type InventoryItem,
} from "@/services/pharmacy.service";

interface PharmacyMetrics {
  prescriptionsPending: number;
  prescriptionsToday: number;
  dispensingQueueCount: number;
  refillRequestsPending: number;
  lowStockItems: number;
  expiringItems: number;
  controlledSubstanceDiscrepancies: number;
  ePrescribeMessages: number;
}

export default function PharmacyPage() {
  const [metrics, setMetrics] = useState<PharmacyMetrics>({
    prescriptionsPending: 0,
    prescriptionsToday: 0,
    dispensingQueueCount: 0,
    refillRequestsPending: 0,
    lowStockItems: 0,
    expiringItems: 0,
    controlledSubstanceDiscrepancies: 0,
    ePrescribeMessages: 0,
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState<
    Prescription[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load metrics in parallel
      const [prescriptions, inventory, queue, refills, eprescribe] =
        await Promise.all([
          prescriptionService.getPrescriptions({
            startDate: new Date().toISOString().split("T")[0] || "",
          }),
          pharmacyService.getInventory({ lowStock: true }),
          prescriptionService.getDispensingQueue({ status: "queued" }),
          prescriptionService.getRefillRequests({ status: "pending" }),
          prescriptionService.getEPrescribeMessages({ status: "received" }),
        ]);

      const pending = prescriptions.filter((p) => p.status === "pending");
      const expiringInventory = inventory.filter((item) => {
        const daysUntilExpiry = Math.floor(
          (new Date(item.expirationDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      });

      setMetrics({
        prescriptionsPending: pending.length,
        prescriptionsToday: prescriptions.length,
        dispensingQueueCount: queue.length,
        refillRequestsPending: refills.length,
        lowStockItems: inventory.length,
        expiringItems: expiringInventory.length,
        controlledSubstanceDiscrepancies: 0, // Would come from actual API
        ePrescribeMessages: eprescribe.length,
      });

      setRecentPrescriptions(prescriptions.slice(0, 10));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    status,
    href,
  }: {
    title: string;
    value: number;
    status?: "normal" | "warning" | "critical";
    href: string;
  }) => {
    const statusColors = {
      normal: "bg-green-50 border-green-200 text-green-700",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
      critical: "bg-red-50 border-red-200 text-red-700",
    };

    const bgColor = status
      ? statusColors[status]
      : "bg-blue-50 border-blue-200 text-blue-700";

    return (
      <Link
        href={href}
        className={`block p-6 rounded-lg border-2 ${bgColor} hover:shadow-lg transition-shadow`}
      >
        <div className="text-sm font-medium opacity-80 mb-1">{title}</div>
        <div className="text-3xl font-bold">{value}</div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading pharmacy dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pharmacy Dashboard
        </h1>
        <p className="text-gray-600">
          Manage prescriptions, dispensing, and pharmacy operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Pending Prescriptions"
          value={metrics.prescriptionsPending}
          status={metrics.prescriptionsPending > 20 ? "warning" : "normal"}
          href="/pharmacy/prescriptions?status=pending"
        />
        <MetricCard
          title="Dispensing Queue"
          value={metrics.dispensingQueueCount}
          status={metrics.dispensingQueueCount > 15 ? "warning" : "normal"}
          href="/pharmacy/dispensing"
        />
        <MetricCard
          title="Refill Requests"
          value={metrics.refillRequestsPending}
          href="/pharmacy/refills"
        />
        <MetricCard
          title="E-Prescribe Messages"
          value={metrics.ePrescribeMessages}
          status={metrics.ePrescribeMessages > 0 ? "warning" : "normal"}
          href="/pharmacy/prescriptions"
        />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockItems}
          status={metrics.lowStockItems > 0 ? "warning" : "normal"}
          href="/pharmacy/inventory?filter=low-stock"
        />
        <MetricCard
          title="Expiring Soon (90 days)"
          value={metrics.expiringItems}
          status={metrics.expiringItems > 0 ? "warning" : "normal"}
          href="/pharmacy/inventory?filter=expiring"
        />
        <MetricCard
          title="Controlled Substance Alerts"
          value={metrics.controlledSubstanceDiscrepancies}
          status={
            metrics.controlledSubstanceDiscrepancies > 0 ? "critical" : "normal"
          }
          href="/pharmacy/controlled"
        />
        <MetricCard
          title="Prescriptions Today"
          value={metrics.prescriptionsToday}
          href="/pharmacy/prescriptions"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/pharmacy/prescriptions/new"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Prescription
          </Link>
          <Link
            href="/pharmacy/dispensing"
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Dispensing Queue
          </Link>
          <Link
            href="/pharmacy/refills"
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Process Refills
          </Link>
          <Link
            href="/pharmacy/inventory"
            className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Inventory
          </Link>
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Prescriptions
          </h2>
          <Link
            href="/pharmacy/prescriptions"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rx Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Medication
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prescriber
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Written Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentPrescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/pharmacy/prescriptions/${rx.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {rx.rxNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {rx.patientName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {rx.medicationName} {rx.strength}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {rx.prescriberName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rx.status === "dispensed"
                          ? "bg-green-100 text-green-800"
                          : rx.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : rx.status === "active"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {rx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(rx.writtenDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
