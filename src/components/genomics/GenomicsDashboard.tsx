/**
 * Genomics Dashboard Component
 * Main dashboard for genomics and precision medicine
 */

"use client";

import React, { useState } from "react";
import { useGenomics } from "@/hooks/useGenomics";
import { usePGx } from "@/hooks/usePGx";
import type { GenomicData } from "@/types/genomics";

interface GenomicsDashboardProps {
  patientId: string;
}

export function GenomicsDashboard({ patientId }: GenomicsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "variants" | "pgx" | "risks">("overview");
  const { genomicData, variants, riskAssessments, loading: genomicsLoading } = useGenomics(patientId);
  const { recommendations, activeAlerts, loading: pgxLoading } = usePGx(patientId);

  const loading = genomicsLoading || pgxLoading;

  // Calculate summary statistics
  const pathogenicVariants = variants.filter(
    (v) => v.interpretation?.classification === "PATHOGENIC"
  ).length;

  const actionableVariants = variants.filter(
    (v) =>
      v.interpretation?.classification === "PATHOGENIC" ||
      v.interpretation?.classification === "LIKELY_PATHOGENIC" ||
      v.interpretation?.clinicalSignificance === "DRUG_RESPONSE"
  ).length;

  const highRiskConditions = riskAssessments.filter(
    (r) => r.riskCategory === "HIGH" || r.riskCategory === "VERY_HIGH"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Genomics & Precision Medicine</h1>
        <p className="mt-2 text-sm text-gray-600">
          Comprehensive genomic insights and personalized medicine recommendations
        </p>
      </div>

      {/* Alert Banner */}
      {(activeAlerts.length > 0 || pathogenicVariants > 0) && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Action Required</h3>
              <div className="mt-2 text-sm text-amber-700">
                <ul className="list-disc list-inside space-y-1">
                  {pathogenicVariants > 0 && (
                    <li>{pathogenicVariants} pathogenic variant(s) requiring clinical review</li>
                  )}
                  {activeAlerts.length > 0 && (
                    <li>{activeAlerts.length} pharmacogenomic alert(s) for current medications</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Genetic Tests</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{genomicData.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pathogenic Variants</dt>
                  <dd className="text-2xl font-semibold text-red-600">{pathogenicVariants}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">PGx Alerts</dt>
                  <dd className="text-2xl font-semibold text-blue-600">{activeAlerts.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Risk Conditions</dt>
                  <dd className="text-2xl font-semibold text-orange-600">{highRiskConditions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: "overview", name: "Overview" },
              { id: "variants", name: "Variants" },
              { id: "pgx", name: "Pharmacogenomics" },
              { id: "risks", name: "Risk Assessment" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Tests</h3>
                {genomicData.length === 0 ? (
                  <p className="text-gray-500">No genetic tests on file</p>
                ) : (
                  <div className="space-y-4">
                    {genomicData.slice(0, 3).map((test) => (
                      <div key={test.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{test.testType.replace(/_/g, " ")}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Performed: {new Date(test.performedDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Laboratory: {test.laboratory}
                            </p>
                          </div>
                          <span className={`
                            px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${test.status === "FINAL" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                          `}>
                            {test.status}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Variants:</span>
                            <span className="ml-2 font-medium">{test.variants.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">PGx Recs:</span>
                            <span className="ml-2 font-medium">{test.pgxRecommendations.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Risk Assessments:</span>
                            <span className="ml-2 font-medium">{test.riskAssessments.length}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Identified Variants</h3>
              {variants.length === 0 ? (
                <p className="text-gray-500">No variants identified</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gene
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Classification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Zygosity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {variants.slice(0, 10).map((variant) => (
                        <tr key={variant.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {variant.gene}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.hgvsProtein || variant.hgvsCoding || variant.hgvsGenomic}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`
                              px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${
                                variant.interpretation?.classification === "PATHOGENIC"
                                  ? "bg-red-100 text-red-800"
                                  : variant.interpretation?.classification === "LIKELY_PATHOGENIC"
                                  ? "bg-orange-100 text-orange-800"
                                  : variant.interpretation?.classification === "UNCERTAIN_SIGNIFICANCE"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-green-100 text-green-800"
                              }
                            `}>
                              {variant.interpretation?.classification?.replace(/_/g, " ") || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {variant.zygosity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "pgx" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pharmacogenomic Recommendations</h3>
              {recommendations.length === 0 ? (
                <p className="text-gray-500">No PGx data available</p>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {rec.gene} - {rec.phenotype.description}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Diplotype: {rec.diplotype}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-700">{rec.recommendations}</p>
                        {rec.drugs.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">Affected Medications:</p>
                            <ul className="mt-2 space-y-2">
                              {rec.drugs.slice(0, 3).map((drug, idx) => (
                                <li key={idx} className="text-sm text-gray-600">
                                  <span className="font-medium">{drug.drug}:</span> {drug.recommendationText}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "risks" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Genetic Risk Assessments</h3>
              {riskAssessments.length === 0 ? (
                <p className="text-gray-500">No risk assessments available</p>
              ) : (
                <div className="space-y-4">
                  {riskAssessments.map((risk) => (
                    <div key={risk.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{risk.condition}</h4>
                        </div>
                        <span className={`
                          px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            risk.riskCategory === "VERY_HIGH"
                              ? "bg-red-100 text-red-800"
                              : risk.riskCategory === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : risk.riskCategory === "MODERATE"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }
                        `}>
                          {risk.riskCategory} RISK
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{risk.interpretation}</p>
                      {risk.screeningGuidelines && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-blue-900">Screening Guidelines:</p>
                          <p className="text-sm text-blue-700 mt-1">{risk.screeningGuidelines}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenomicsDashboard;
