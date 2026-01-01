/**
 * Prescriptions List Page
 * View and manage all prescriptions with filtering and search
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  prescriptionService,
  type Prescription,
} from "@/services/prescription.service";
import { PrescriptionList } from "@/components/pharmacy/PrescriptionList";

export const dynamic = "force-dynamic";

export default function PrescriptionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    patientId: searchParams.get("patientId") || "",
    prescriberId: searchParams.get("prescriberId") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  });

  useEffect(() => {
    loadPrescriptions();
  }, [filters]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getPrescriptions({
        status: filters.status || undefined,
        patientId: filters.patientId || undefined,
        prescriberId: filters.prescriberId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setPrescriptions(data);
    } catch (error) {
      console.error("Failed to load prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      patientId: "",
      prescriberId: "",
      startDate: "",
      endDate: "",
    });
    router.push("/pharmacy/prescriptions");
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      rx.rxNumber.toLowerCase().includes(query) ||
      rx.patientName.toLowerCase().includes(query) ||
      rx.medicationName.toLowerCase().includes(query) ||
      rx.prescriberName.toLowerCase().includes(query) ||
      rx.ndc.includes(query)
    );
  });

  const stats = {
    total: filteredPrescriptions.length,
    pending: filteredPrescriptions.filter((rx) => rx.status === "pending")
      .length,
    active: filteredPrescriptions.filter((rx) => rx.status === "active").length,
    dispensed: filteredPrescriptions.filter((rx) => rx.status === "dispensed")
      .length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prescriptions
            </h1>
            <p className="text-gray-600">Manage and track all prescriptions</p>
          </div>
          <Link
            href="/pharmacy/prescriptions/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Prescription
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.active}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Dispensed</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.dispensed}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
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
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Rx#, patient, medication, prescriber, or NDC..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading prescriptions...
          </div>
        ) : (
          <PrescriptionList
            prescriptions={filteredPrescriptions}
            onRefresh={loadPrescriptions}
          />
        )}
      </div>
    </div>
  );
}
