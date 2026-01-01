/**
 * Z-Code Selector Component
 * ICD-10-CM Z-code selection with documentation helper
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, FileText, DollarSign } from "lucide-react";
import { Z_CODE_DATABASE, ZCodeCategory } from "@/lib/sdoh/screening/z-code-mapper";
import type { ZCode } from "@/lib/sdoh/screening/z-code-mapper";

interface ZCodeSelectorProps {
  identifiedNeeds: string[];
  selectedCodes: string[];
  onCodesChange: (codes: string[]) => void;
  onGenerateDocumentation?: (codes: ZCode[]) => void;
}

export function ZCodeSelector({
  identifiedNeeds,
  selectedCodes,
  onCodesChange,
  onGenerateDocumentation,
}: ZCodeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ZCodeCategory | "">("");

  // Filter Z-codes based on search and category
  const filteredCodes = Z_CODE_DATABASE.filter((zCode) => {
    const matchesSearch =
      !searchTerm ||
      zCode.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zCode.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zCode.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !categoryFilter || zCode.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const toggleCode = (code: string) => {
    if (selectedCodes.includes(code)) {
      onCodesChange(selectedCodes.filter((c) => c !== code));
    } else {
      onCodesChange([...selectedCodes, code]);
    }
  };

  const selectedZCodes = Z_CODE_DATABASE.filter((z) =>
    selectedCodes.includes(z.code)
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search Z-codes, descriptions, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="border rounded-md px-3 py-2"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ZCodeCategory | "")}
          >
            <option value="">All Categories</option>
            {Object.values(ZCodeCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Suggested codes based on identified needs */}
        {identifiedNeeds.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Suggested Codes:</h4>
            <div className="flex flex-wrap gap-2">
              {Z_CODE_DATABASE.filter((z) =>
                identifiedNeeds.some((need) =>
                  z.keywords.some((k) => k.toLowerCase().includes(need.toLowerCase()))
                )
              )
                .slice(0, 5)
                .map((code) => (
                  <Badge
                    key={code.code}
                    variant={selectedCodes.includes(code.code) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCode(code.code)}
                  >
                    {code.code} - {code.description.substring(0, 40)}...
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </Card>

      {/* Selected Z-Codes Summary */}
      {selectedCodes.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">
              Selected Z-Codes ({selectedCodes.length})
            </h3>
            {onGenerateDocumentation && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateDocumentation(selectedZCodes)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Documentation
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {selectedZCodes.map((zCode) => (
              <div
                key={zCode.code}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <span className="font-mono font-semibold">{zCode.code}</span> -{" "}
                  {zCode.description}
                  {zCode.billable && (
                    <DollarSign className="inline h-4 w-4 text-green-600 ml-2" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleCode(zCode.code)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Z-Code List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Available Z-Codes</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCodes.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No Z-codes found</p>
          ) : (
            filteredCodes.map((zCode) => (
              <div
                key={zCode.code}
                className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleCode(zCode.code)}
              >
                <Checkbox
                  checked={selectedCodes.includes(zCode.code)}
                  onCheckedChange={() => toggleCode(zCode.code)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold">{zCode.code}</span>
                    <Badge variant="outline">{zCode.category}</Badge>
                    {zCode.billable && (
                      <Badge className="bg-green-100 text-green-800">Billable</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{zCode.description}</p>
                  {zCode.clinicalNotes && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {zCode.clinicalNotes}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {zCode.keywords.slice(0, 5).map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
