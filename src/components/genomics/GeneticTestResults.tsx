/**
 * Genetic Test Results Component
 * Displays detailed genetic test results with variant details
 */

"use client";

import React from "react";
import type { GenomicData } from "@/types/genomics";

interface GeneticTestResultsProps {
  testData: GenomicData;
  onVariantClick?: (variantId: string) => void;
}

export function GeneticTestResults({ testData, onVariantClick }: GeneticTestResultsProps) {
  const pathogenicCount = testData.variants.filter(
    (v) => v.interpretation?.classification === "PATHOGENIC"
  ).length;

  const likelyPathogenicCount = testData.variants.filter(
    (v) => v.interpretation?.classification === "LIKELY_PATHOGENIC"
  ).length;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {testData.testType.replace(/_/g, " ")}
            </h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">
                Test ID: {testData.testId}
              </p>
              <p className="text-sm text-gray-500">
                Performed: {new Date(testData.performedDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Laboratory: {testData.laboratory}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${testData.status === "FINAL" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
            `}>
              {testData.status}
            </span>
            {testData.reportPdfUrl && (
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                Download Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{testData.variants.length}</div>
            <div className="text-sm text-gray-500">Total Variants</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{pathogenicCount}</div>
            <div className="text-sm text-gray-500">Pathogenic</div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{likelyPathogenicCount}</div>
            <div className="text-sm text-gray-500">Likely Pathogenic</div>
          </div>
        </div>
      </div>

      {/* Variants Table */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Identified Variants</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gene
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant (HGVS)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clinical Significance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zygosity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testData.variants.map((variant) => (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {variant.gene}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      {variant.hgvsProtein && <div>{variant.hgvsProtein}</div>}
                      {variant.hgvsCoding && (
                        <div className="text-xs text-gray-400">{variant.hgvsCoding}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
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
                      {variant.interpretation?.classification?.replace(/_/g, " ") || "Not Classified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.interpretation?.clinicalSignificance?.replace(/_/g, " ") || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.zygosity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => onVariantClick?.(variant.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
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

export default GeneticTestResults;
