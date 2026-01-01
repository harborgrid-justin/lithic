/**
 * Drug Search Component
 * Search for medications by name, generic, or NDC
 */

"use client";

import { useState } from "react";
import { pharmacyService, type Drug } from "@/services/pharmacy.service";

interface DrugSearchProps {
  onSelect: (drug: Drug) => void;
  selectedDrugs?: Drug[];
}

export function DrugSearch({ onSelect, selectedDrugs = [] }: DrugSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dosageForm: "",
    controlled: false,
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const drugs = await pharmacyService.searchDrugs(query, {
        dosageForm: filters.dosageForm || undefined,
        controlled: filters.controlled || undefined,
      });
      setResults(drugs);
    } catch (error) {
      console.error("Failed to search drugs:", error);
      alert("Failed to search medications");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isSelected = (drugId: string) => {
    return selectedDrugs.some((d) => d.id === drugId);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search by Drug Name, Generic Name, or NDC
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter medication name or NDC..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dosage Form
          </label>
          <select
            value={filters.dosageForm}
            onChange={(e) =>
              setFilters({ ...filters, dosageForm: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Forms</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Solution">Solution</option>
            <option value="Injection">Injection</option>
            <option value="Cream">Cream</option>
            <option value="Ointment">Ointment</option>
          </select>
        </div>
        <div>
          <label className="flex items-center pt-7">
            <input
              type="checkbox"
              checked={filters.controlled}
              onChange={(e) =>
                setFilters({ ...filters, controlled: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Controlled Substances Only
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {results.map((drug) => (
            <div
              key={drug.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                isSelected(drug.id) ? "bg-blue-50" : ""
              }`}
              onClick={() => onSelect(drug)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {drug.brandName || drug.name}
                    {drug.deaSchedule && (
                      <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800">
                        C-{drug.deaSchedule}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {drug.genericName} {drug.strength}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-mono">NDC: {drug.ndc}</span>
                    <span className="mx-2">|</span>
                    <span>{drug.dosageForm}</span>
                    <span className="mx-2">|</span>
                    <span>{drug.manufacturer}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {drug.therapeutic_class}
                  </div>
                </div>
                {isSelected(drug.id) && (
                  <div className="ml-4 text-blue-600">
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-8 text-gray-500">
          No medications found for &quot;{query}&quot;
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Enter a medication name or NDC to search
        </div>
      )}
    </div>
  );
}
