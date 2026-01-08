"use client";

import { useState } from "react";
import { Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FilterConfig } from "@/services/analytics.service";
import { QualityMetrics } from "@/components/analytics/QualityMetrics";
import { FilterPanel } from "@/components/analytics/FilterPanel";

export default function QualityMetricsPage() {
  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0] || "",
      end: new Date().toISOString().split("T")[0] || "",
      preset: "quarter",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quality Metrics
              </h1>
              <p className="text-gray-500 mt-1">
                Patient outcomes, satisfaction, and CMS quality measures
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              availableFilters={{
                departments: [
                  "Cardiology",
                  "Oncology",
                  "Emergency",
                  "Surgery",
                  "ICU",
                ],
                providers: ["Dr. Smith", "Dr. Johnson", "Dr. Williams"],
                locations: ["Main Campus", "North Clinic", "South Clinic"],
              }}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <QualityMetrics filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
