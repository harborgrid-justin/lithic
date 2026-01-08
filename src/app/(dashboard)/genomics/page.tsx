/**
 * Genomics Dashboard Page
 * Main genomics and precision medicine dashboard
 */

"use client";

import React, { useState } from "react";
import { GenomicsDashboard } from "@/components/genomics/GenomicsDashboard";
import { GeneSearch } from "@/components/genomics/GeneSearch";

export default function GenomicsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchGene, setSearchGene] = useState<string>("");

  // In real implementation, get patient ID from context/session
  const defaultPatientId = "patient-123";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl sm:truncate">
                Genomics & Precision Medicine
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive genomic analysis and personalized medicine insights
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Order Genetic Test
              </button>
            </div>
          </div>

          {/* Gene Search */}
          <div className="mb-6">
            <GeneSearch onSearch={setSearchGene} />
          </div>

          {/* Main Dashboard */}
          <GenomicsDashboard patientId={selectedPatientId || defaultPatientId} />
        </div>
      </div>
    </div>
  );
}
