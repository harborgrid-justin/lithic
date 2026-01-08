/**
 * Variant Viewer Component
 * Detailed view of a single genetic variant with interpretation
 */

"use client";

import React from "react";
import type { Variant } from "@/types/genomics";

interface VariantViewerProps {
  variant: Variant;
}

export function VariantViewer({ variant }: VariantViewerProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{variant.gene} Variant</h2>
        <p className="text-gray-600 mt-1">{variant.hgvsProtein || variant.hgvsCoding || variant.hgvsGenomic}</p>
      </div>

      {/* Variant Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Variant Details</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Gene</dt>
            <dd className="mt-1 text-sm text-gray-900">{variant.gene}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{variant.variantType}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Chromosome</dt>
            <dd className="mt-1 text-sm text-gray-900">{variant.chromosome}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Position</dt>
            <dd className="mt-1 text-sm text-gray-900">{variant.position.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Reference Allele</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{variant.referenceAllele}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Alternate Allele</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{variant.alternateAllele}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Zygosity</dt>
            <dd className="mt-1 text-sm text-gray-900">{variant.zygosity}</dd>
          </div>
          {variant.dbSnpId && (
            <div>
              <dt className="text-sm font-medium text-gray-500">dbSNP ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{variant.dbSnpId}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Classification */}
      {variant.interpretation && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Classification</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">ACMG Classification:</span>
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${
                  variant.interpretation.classification === "PATHOGENIC"
                    ? "bg-red-100 text-red-800"
                    : variant.interpretation.classification === "LIKELY_PATHOGENIC"
                    ? "bg-orange-100 text-orange-800"
                    : variant.interpretation.classification === "UNCERTAIN_SIGNIFICANCE"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-green-100 text-green-800"
                }
              `}>
                {variant.interpretation.classification.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Clinical Significance:</span>
              <span className="text-sm text-gray-900">{variant.interpretation.clinicalSignificance}</span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-700">{variant.interpretation.interpretation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Population Frequency */}
      {variant.gnomadFrequency !== null && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Population Frequency</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">gnomAD Frequency:</span>{" "}
              {variant.gnomadFrequency.toExponential(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VariantViewer;
