/**
 * Search Results Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar } from 'lucide-react';

interface SearchResult {
  id: string;
  entityType: string;
  score: number;
  data: any;
  highlights: Record<string, string[]>;
}

interface SearchResultsProps {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

export function SearchResults({
  results,
  total,
  page,
  pageSize,
  onPageChange,
  onResultClick,
  className = '',
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / pageSize);

  const getIcon = (type: string) => {
    switch (type) {
      case 'patient': return <User className="h-5 w-5 text-blue-500" />;
      case 'document': return <FileText className="h-5 w-5 text-green-500" />;
      case 'appointment': return <Calendar className="h-5 w-5 text-purple-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {results.length} of {total} results
        </p>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <Card
            key={result.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onResultClick?.(result)}
          >
            <div className="flex items-start gap-3">
              {getIcon(result.entityType)}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">
                    {result.data.name || result.data.title || 'Untitled'}
                  </h4>
                  <Badge variant="secondary">{result.entityType}</Badge>
                </div>

                {result.highlights && Object.keys(result.highlights).length > 0 && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {Object.entries(result.highlights).map(([field, highlights]) => (
                      <div key={field} dangerouslySetInnerHTML={{ __html: highlights[0] || '' }} />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Relevance: {(result.score * 100).toFixed(0)}%</span>
                  {result.data.createdAt && (
                    <span>Created: {new Date(result.data.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange?.(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No results found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
}
