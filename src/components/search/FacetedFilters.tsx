/**
 * Faceted Filters Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { FacetResult } from '@/lib/search/advanced-search';

interface FacetedFiltersProps {
  facets: FacetResult[];
  onFilterChange?: (facetField: string, value: string, selected: boolean) => void;
  onClearAll?: () => void;
  className?: string;
}

export function FacetedFilters({
  facets,
  onFilterChange,
  onClearAll,
  className = '',
}: FacetedFiltersProps) {
  const [expandedFacets, setExpandedFacets] = useState<Set<string>>(
    new Set(facets.map((f) => f.field))
  );

  const toggleFacet = (field: string) => {
    setExpandedFacets((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const selectedCount = facets.reduce(
    (count, facet) => count + facet.values.filter((v) => v.selected).length,
    0
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
          >
            <X className="h-4 w-4 mr-1" />
            Clear All ({selectedCount})
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {facets.map((facet) => (
          <div key={facet.field} className="border-b pb-4 last:border-0">
            <button
              onClick={() => toggleFacet(facet.field)}
              className="flex items-center justify-between w-full text-left mb-2"
            >
              <span className="font-medium text-sm">
                {facet.field.replace('_', ' ').toUpperCase()}
              </span>
              {expandedFacets.has(facet.field) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedFacets.has(facet.field) && (
              <div className="space-y-2 mt-2">
                {facet.values.slice(0, 10).map((value) => (
                  <div key={value.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        id={`${facet.field}-${value.value}`}
                        checked={value.selected}
                        onCheckedChange={(checked) =>
                          onFilterChange?.(facet.field, value.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`${facet.field}-${value.value}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {value.value}
                      </label>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {value.count}
                    </Badge>
                  </div>
                ))}

                {facet.values.length > 10 && (
                  <Button variant="link" size="sm" className="text-xs">
                    Show more
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
