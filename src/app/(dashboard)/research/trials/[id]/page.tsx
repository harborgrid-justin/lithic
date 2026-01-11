/**
 * Trial Detail Page
 * Lithic Healthcare Platform v0.5
 */

"use client";

import { useTrial } from "@/hooks/useTrials";
import { CompliancePanel } from "@/components/research/CompliancePanel";

export default function TrialDetailPage({ params }: { params: { id: string } }) {
  const { trial, subjects, loading, error } = useTrial(params.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trial details...</p>
        </div>
      </div>
    );
  }

  if (error || !trial) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading trial: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{trial.title}</h1>
        <p className="text-gray-600 mt-2">{trial.trialId}</p>
        <div className="flex space-x-2 mt-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {trial.phase}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {trial.status}
          </span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Sponsor</label>
                <p className="font-medium">{trial.sponsorName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Indication</label>
                <p className="font-medium">{trial.indication}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <p className="font-medium">{trial.type}</p>
              </div>
            </div>
          </div>

          {/* Enrollment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Enrollment</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Current</p>
                <p className="text-2xl font-bold text-blue-900">
                  {trial.enrollment.currentEnrollment}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Target</p>
                <p className="text-2xl font-bold text-green-900">
                  {trial.enrollment.targetEnrollment}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Screening</p>
                <p className="text-2xl font-bold text-purple-900">
                  {trial.enrollment.screeningCount}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Sites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trial.locations.length}
                </p>
              </div>
            </div>
          </div>

          {/* Study Arms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Study Arms</h2>
            <div className="space-y-3">
              {trial.design.studyArms.map((arm) => (
                <div key={arm.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{arm.name}</h3>
                      <p className="text-sm text-gray-600">{arm.description}</p>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded mt-2 inline-block">
                        {arm.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Enrollment</p>
                      <p className="font-bold">
                        {arm.actualEnrollment} / {arm.targetEnrollment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CompliancePanel trialId={trial.id} />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full py-2 px-4 text-left border rounded-lg hover:bg-gray-50">
                Screen New Subject
              </button>
              <button className="w-full py-2 px-4 text-left border rounded-lg hover:bg-gray-50">
                Report Adverse Event
              </button>
              <button className="w-full py-2 px-4 text-left border rounded-lg hover:bg-gray-50">
                View Protocol
              </button>
              <button className="w-full py-2 px-4 text-left border rounded-lg hover:bg-gray-50">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
