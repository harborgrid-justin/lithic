"use client";

import { useState, useEffect } from "react";
import { CPTCode, ICDCode } from "@/types/billing";
import { Search, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CodingWorksheetProps {
  onCodesSelected?: (cptCodes: CPTCode[], icdCodes: ICDCode[]) => void;
}

export default function CodingWorksheet({
  onCodesSelected,
}: CodingWorksheetProps) {
  const [cptSearch, setCptSearch] = useState("");
  const [icdSearch, setIcdSearch] = useState("");
  const [cptResults, setCptResults] = useState<CPTCode[]>([]);
  const [icdResults, setIcdResults] = useState<ICDCode[]>([]);
  const [selectedCPT, setSelectedCPT] = useState<CPTCode[]>([]);
  const [selectedICD, setSelectedICD] = useState<ICDCode[]>([]);

  // Search CPT codes
  useEffect(() => {
    if (cptSearch.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/billing/coding?type=cpt&q=${encodeURIComponent(cptSearch)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setCptResults(data);
          }
        } catch (error) {
          console.error("Error searching CPT codes:", error);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCptResults([]);
    }
  }, [cptSearch]);

  // Search ICD codes
  useEffect(() => {
    if (icdSearch.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/billing/coding?type=icd&q=${encodeURIComponent(icdSearch)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setIcdResults(data);
          }
        } catch (error) {
          console.error("Error searching ICD codes:", error);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIcdResults([]);
    }
  }, [icdSearch]);

  const addCPTCode = (code: CPTCode) => {
    if (!selectedCPT.find((c) => c.code === code.code)) {
      const updated = [...selectedCPT, code];
      setSelectedCPT(updated);
      onCodesSelected?.(updated, selectedICD);
    }
    setCptSearch("");
    setCptResults([]);
  };

  const removeCPTCode = (code: string) => {
    const updated = selectedCPT.filter((c) => c.code !== code);
    setSelectedCPT(updated);
    onCodesSelected?.(updated, selectedICD);
  };

  const addICDCode = (code: ICDCode) => {
    if (!selectedICD.find((c) => c.code === code.code)) {
      const updated = [...selectedICD, code];
      setSelectedICD(updated);
      onCodesSelected?.(selectedCPT, updated);
    }
    setIcdSearch("");
    setIcdResults([]);
  };

  const removeICDCode = (code: string) => {
    const updated = selectedICD.filter((c) => c.code !== code);
    setSelectedICD(updated);
    onCodesSelected?.(selectedCPT, updated);
  };

  return (
    <div className="space-y-6">
      {/* CPT/HCPCS Codes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Procedure Codes (CPT/HCPCS)
        </h3>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search CPT codes..."
            value={cptSearch}
            onChange={(e) => setCptSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {cptResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {cptResults.map((code) => (
                <div
                  key={code.code}
                  onClick={() => addCPTCode(code)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary-600">
                          {code.code}
                        </code>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {code.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {code.description}
                      </p>
                    </div>
                    <span className="ml-4 font-semibold text-gray-900">
                      {formatCurrency(code.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected CPT Codes */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Codes:</p>
          {selectedCPT.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No codes selected</p>
          ) : (
            <div className="space-y-2">
              {selectedCPT.map((code) => (
                <div
                  key={code.code}
                  className="flex items-start justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-primary-700">
                        {code.code}
                      </code>
                      <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
                        {code.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {code.description}
                    </p>
                    <p className="text-sm font-semibold text-primary-900 mt-1">
                      {formatCurrency(code.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCPTCode(code.code)}
                    className="ml-4 p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ICD-10 Codes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Diagnosis Codes (ICD-10)</h3>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search ICD-10 codes..."
            value={icdSearch}
            onChange={(e) => setIcdSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {icdResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {icdResults.map((code) => (
                <div
                  key={code.code}
                  onClick={() => addICDCode(code)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <code className="font-mono font-bold text-green-600">
                      {code.code}
                    </code>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {code.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{code.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected ICD Codes */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected Codes:</p>
          {selectedICD.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No codes selected</p>
          ) : (
            <div className="space-y-2">
              {selectedICD.map((code) => (
                <div
                  key={code.code}
                  className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-green-700">
                        {code.code}
                      </code>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                        {code.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {code.description}
                    </p>
                  </div>
                  <button
                    onClick={() => removeICDCode(code.code)}
                    className="ml-4 p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {(selectedCPT.length > 0 || selectedICD.length > 0) && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">CPT Codes Selected</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedCPT.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ICD Codes Selected</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedICD.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Charges</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(
                  selectedCPT.reduce((sum, code) => sum + code.price, 0),
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
