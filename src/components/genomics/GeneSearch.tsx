/**
 * Gene Search Component
 */

"use client";

import React, { useState } from "react";

interface GeneSearchProps {
  onSearch: (gene: string) => void;
}

export function GeneSearch({ onSearch }: GeneSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions] = useState([
    "BRCA1", "BRCA2", "TP53", "PTEN", "CYP2D6", "CYP2C19", "CYP2C9",
    "CFTR", "HLA-B", "APOE", "F5", "MTHFR", "TPMT", "DPYD"
  ]);

  const filteredSuggestions = query
    ? suggestions.filter(gene => gene.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSearch(query)}
          placeholder="Search genes (e.g., BRCA1, CYP2D6)..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => onSearch(query)}
          className="absolute right-2 top-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {filteredSuggestions.length > 0 && query && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((gene) => (
            <button
              key={gene}
              onClick={() => {
                setQuery(gene);
                onSearch(gene);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              {gene}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GeneSearch;
