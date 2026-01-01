/**
 * Formulary Management Page
 * Search and manage drug formulary information
 */

"use client";

import { useState } from "react";
import {
  pharmacyService,
  type FormularyEntry,
} from "@/services/pharmacy.service";
import { FormularySearch } from "@/components/pharmacy/FormularySearch";

export default function FormularyPage() {
  const [results, setResults] = useState<FormularyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    tier: "",
    status: "",
    priorAuthRequired: "",
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const data = await pharmacyService.searchFormulary(searchQuery, {
        tier: filters.tier ? parseInt(filters.tier) : undefined,
        status: filters.status || undefined,
        priorAuthRequired: filters.priorAuthRequired
          ? filters.priorAuthRequired === "true"
          : undefined,
      });
      setResults(data);
    } catch (error) {
      console.error("Failed to search formulary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Drug Formulary
        </h1>
        <p className="text-gray-600">
          Search formulary and check coverage information
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Drug Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter drug name or NDC..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier
            </label>
            <select
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tiers</option>
              <option value="1">Tier 1 (Generic)</option>
              <option value="2">Tier 2 (Preferred Brand)</option>
              <option value="3">Tier 3 (Non-Preferred Brand)</option>
              <option value="4">Tier 4 (Specialty)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="preferred">Preferred</option>
              <option value="non-preferred">Non-Preferred</option>
              <option value="restricted">Restricted</option>
              <option value="not-covered">Not Covered</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prior Authorization
            </label>
            <select
              value={filters.priorAuthRequired}
              onChange={(e) =>
                setFilters({ ...filters, priorAuthRequired: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Required</option>
              <option value="false">Not Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Searching formulary...
          </div>
        ) : results.length > 0 ? (
          <FormularySearch results={results} />
        ) : searchQuery ? (
          <div className="p-8 text-center text-gray-500">
            No formulary entries found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Enter a drug name to search the formulary
          </div>
        )}
      </div>
    </div>
  );
}
