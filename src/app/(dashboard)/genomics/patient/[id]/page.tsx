/**
 * Patient Genomics Page
 * Patient-specific genomics dashboard
 */

"use client";

import React from "react";
import { useParams } from "next/navigation";
import { GenomicsDashboard } from "@/components/genomics/GenomicsDashboard";
import { usePrecisionMedicine } from "@/hooks/usePrecisionMedicine";

export default function PatientGenomicsPage() {
  const params = useParams();
  const patientId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <a href="/genomics" className="text-gray-400 hover:text-gray-500">
                    Genomics
                  </a>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">Patient {patientId}</span>
                  </div>
                </li>
              </ol>
            </nav>

            <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:text-4xl sm:truncate">
              Patient Genomics Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive genomic data and precision medicine recommendations
            </p>
          </div>

          {/* Patient Dashboard */}
          <GenomicsDashboard patientId={patientId} />
        </div>
      </div>
    </div>
  );
}

// Placeholder hook
function usePrecisionMedicine(patientId: string) {
  return { loading: false, profile: null };
}
