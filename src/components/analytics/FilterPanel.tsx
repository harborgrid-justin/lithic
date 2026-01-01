"use client";

import { useState } from "react";
import { FilterConfig } from "@/services/analytics.service";
import { DateRangePicker } from "./DateRangePicker";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface FilterPanelProps {
  filters: FilterConfig;
  onChange: (filters: FilterConfig) => void;
  availableFilters?: {
    departments?: string[];
    providers?: string[];
    locations?: string[];
    payors?: string[];
  };
  className?: string;
  collapsible?: boolean;
}

export function FilterPanel({
  filters,
  onChange,
  availableFilters = {},
  className = "",
  collapsible = false,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDateRangeChange = (
    dateRange: NonNullable<FilterConfig["dateRange"]>,
  ) => {
    onChange({
      ...filters,
      dateRange,
    });
  };

  const handleMultiSelectChange = (
    field: keyof FilterConfig,
    value: string,
  ) => {
    const currentValues = (filters[field] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onChange({
      ...filters,
      [field]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const handleClearFilter = (field: keyof FilterConfig) => {
    onChange({
      ...filters,
      [field]: undefined,
    });
  };

  const handleClearAll = () => {
    onChange({
      dateRange: filters.dateRange, // Keep date range
    });
  };

  const activeFilterCount = [
    filters.departments?.length || 0,
    filters.providers?.length || 0,
    filters.locations?.length || 0,
    filters.payors?.length || 0,
  ].reduce((a, b) => a + b, 0);

  if (collapsible && isCollapsed) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 ${className}`}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        {/* Date Range */}
        {filters.dateRange && (
          <DateRangePicker
            value={filters.dateRange}
            onChange={handleDateRangeChange}
          />
        )}

        {/* Departments */}
        {availableFilters.departments &&
          availableFilters.departments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Departments
                </label>
                {filters.departments && filters.departments.length > 0 && (
                  <button
                    onClick={() => handleClearFilter("departments")}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableFilters.departments.map((dept) => (
                  <label
                    key={dept}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.departments?.includes(dept) || false}
                      onChange={() =>
                        handleMultiSelectChange("departments", dept)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{dept}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

        {/* Providers */}
        {availableFilters.providers &&
          availableFilters.providers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Providers
                </label>
                {filters.providers && filters.providers.length > 0 && (
                  <button
                    onClick={() => handleClearFilter("providers")}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableFilters.providers.map((provider) => (
                  <label
                    key={provider}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.providers?.includes(provider) || false}
                      onChange={() =>
                        handleMultiSelectChange("providers", provider)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{provider}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

        {/* Locations */}
        {availableFilters.locations &&
          availableFilters.locations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Locations
                </label>
                {filters.locations && filters.locations.length > 0 && (
                  <button
                    onClick={() => handleClearFilter("locations")}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableFilters.locations.map((location) => (
                  <label
                    key={location}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.locations?.includes(location) || false}
                      onChange={() =>
                        handleMultiSelectChange("locations", location)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{location}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

        {/* Payors */}
        {availableFilters.payors && availableFilters.payors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Payors
              </label>
              {filters.payors && filters.payors.length > 0 && (
                <button
                  onClick={() => handleClearFilter("payors")}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableFilters.payors.map((payor) => (
                <label
                  key={payor}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.payors?.includes(payor) || false}
                    onChange={() => handleMultiSelectChange("payors", payor)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{payor}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
