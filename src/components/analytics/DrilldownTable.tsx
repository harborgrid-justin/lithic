"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface DrilldownRow {
  id: string;
  [key: string]: any;
  children?: DrilldownRow[];
}

interface DrilldownTableProps {
  columns: Column[];
  data: DrilldownRow[];
  defaultExpanded?: boolean;
  onRowClick?: (row: DrilldownRow) => void;
  onExport?: () => void;
  loading?: boolean;
}

export function DrilldownTable({
  columns,
  data,
  defaultExpanded = false,
  onRowClick,
  onExport,
  loading = false,
}: DrilldownTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    defaultExpanded ? new Set(data.map((row) => row.id)) : new Set(),
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const toggleRow = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig((current) => {
      if (current?.key === columnKey) {
        return current.direction === "asc"
          ? { key: columnKey, direction: "desc" }
          : null;
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters((current) => ({
      ...current,
      [columnKey]: value,
    }));
  };

  // Recursive function to filter and sort data
  const processData = (rows: DrilldownRow[]): DrilldownRow[] => {
    let processed = [...rows];

    // Apply search filter
    if (searchQuery) {
      processed = processed.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return String(value)
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        }),
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        processed = processed.filter((row) =>
          String(row[key]).toLowerCase().includes(filterValue.toLowerCase()),
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      processed.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortConfig.direction === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    // Process children recursively
    return processed.map((row) => ({
      ...row,
      children: row.children ? processData(row.children) : undefined,
    }));
  };

  const processedData = useMemo(
    () => processData(data),
    [data, filters, sortConfig, searchQuery],
  );

  const renderRow = (row: DrilldownRow, level: number = 0): React.ReactNode => {
    const hasChildren = row.children && row.children.length > 0;
    const isExpanded = expandedRows.has(row.id);

    return (
      <React.Fragment key={row.id}>
        <tr
          className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer"
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((column, colIndex) => (
            <td
              key={column.key}
              className="px-6 py-4 text-sm text-gray-900"
              style={{ width: column.width }}
            >
              {colIndex === 0 ? (
                <div
                  className="flex items-center gap-2"
                  style={{ paddingLeft: `${level * 24}px` }}
                >
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(row.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  )}
                  {!hasChildren && <div className="w-6"></div>}
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </div>
              ) : column.render ? (
                column.render(row[column.key], row)
              ) : (
                row[column.key]
              )}
            </td>
          ))}
        </tr>
        {hasChildren &&
          isExpanded &&
          row.children!.map((child) => renderRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const expandAll = () => {
    const getAllIds = (rows: DrilldownRow[]): string[] => {
      return rows.flatMap((row) => [
        row.id,
        ...(row.children ? getAllIds(row.children) : []),
      ]);
    };
    setExpandedRows(new Set(getAllIds(data)));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {/* Column Filters */}
        {columns.some((col) => col.filterable) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {columns
              .filter((col) => col.filterable)
              .map((column) => (
                <div key={column.key}>
                  <Input
                    type="text"
                    placeholder={`Filter ${column.label}...`}
                    value={filters[column.key] || ""}
                    onChange={(e) =>
                      handleFilterChange(column.key, e.target.value)
                    }
                    className="text-sm"
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      {column.label}
                      {sortConfig?.key === column.key && (
                        <>
                          {sortConfig.direction === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                        </>
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              processedData.map((row) => renderRow(row, 0))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Showing {processedData.length}{" "}
          {processedData.length === 1 ? "row" : "rows"}
        </div>
      </div>
    </div>
  );
}
