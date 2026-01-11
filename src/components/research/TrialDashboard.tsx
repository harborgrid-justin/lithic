/**
 * Trials Dashboard Component
 * Lithic Healthcare Platform v0.5
 */

"use client";

import { useState } from "react";
import { useTrials } from "@/hooks/useTrials";
import { TrialCard } from "./TrialCard";
import { TrialPhase, TrialStatus } from "@/types/research";

interface TrialDashboardProps {
  organizationId: string;
}

export function TrialDashboard({ organizationId }: TrialDashboardProps) {
  const { trials, loading, error, fetchTrials } = useTrials(organizationId);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPhase, setFilterPhase] = useState<TrialPhase | "">("");
  const [filterStatus, setFilterStatus] = useState<TrialStatus | "">("");

  const handleSearch = () => {
    fetchTrials({
      query: searchQuery,
      phase: filterPhase ? [filterPhase] : undefined,
      status: filterStatus ? [filterStatus] : undefined,
    });
  };

  if (loading && trials.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinical Trials</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor clinical research studies
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New Trial
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search trials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value as TrialPhase)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Phases</option>
              <option value={TrialPhase.PHASE_I}>Phase I</option>
              <option value={TrialPhase.PHASE_II}>Phase II</option>
              <option value={TrialPhase.PHASE_III}>Phase III</option>
              <option value={TrialPhase.PHASE_IV}>Phase IV</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TrialStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value={TrialStatus.RECRUITING}>Recruiting</option>
              <option value={TrialStatus.ACTIVE}>Active</option>
              <option value={TrialStatus.COMPLETED}>Completed</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Trials"
          value={trials.length}
          color="blue"
        />
        <StatCard
          label="Recruiting"
          value={trials.filter((t) => t.status === TrialStatus.RECRUITING).length}
          color="green"
        />
        <StatCard
          label="Active"
          value={trials.filter((t) => t.status === TrialStatus.ACTIVE).length}
          color="purple"
        />
        <StatCard
          label="Completed"
          value={trials.filter((t) => t.status === TrialStatus.COMPLETED).length}
          color="gray"
        />
      </div>

      {/* Trials List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {trials.map((trial) => (
          <TrialCard key={trial.id} trial={trial} />
        ))}
      </div>

      {trials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No trials found</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    gray: "bg-gray-50 text-gray-700",
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-4`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
