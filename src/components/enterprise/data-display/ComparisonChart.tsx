'use client';

/**
 * Enterprise ComparisonChart Component
 *
 * Side-by-side comparison with:
 * - Two-column comparison
 * - Difference highlighting
 * - Visual indicators
 * - Custom rendering
 * - Responsive layout
 * - WCAG 2.1 AA compliant
 */

import React from 'react';
import { ArrowRight, Check, X, AlertCircle, Minus } from 'lucide-react';

export interface ComparisonItem {
  id: string;
  label: string;
  before: any;
  after: any;
  renderBefore?: (value: any) => React.ReactNode;
  renderAfter?: (value: any) => React.ReactNode;
  showDiff?: boolean;
  diffType?: 'numeric' | 'boolean' | 'text';
}

export interface ComparisonChartProps {
  items: ComparisonItem[];
  beforeLabel?: string;
  afterLabel?: string;
  highlightChanges?: boolean;
  showDiffColumn?: boolean;
  compact?: boolean;
  className?: string;
}

export function ComparisonChart({
  items,
  beforeLabel = 'Before',
  afterLabel = 'After',
  highlightChanges = true,
  showDiffColumn = true,
  compact = false,
  className = '',
}: ComparisonChartProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        {/* Header */}
        <thead className="bg-muted">
          <tr>
            <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-left text-sm font-semibold`}>
              Field
            </th>
            <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-left text-sm font-semibold`}>
              {beforeLabel}
            </th>
            {showDiffColumn && (
              <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-center text-sm font-semibold w-12`}>
                <span className="sr-only">Change indicator</span>
              </th>
            )}
            <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-left text-sm font-semibold`}>
              {afterLabel}
            </th>
            {showDiffColumn && (
              <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-right text-sm font-semibold`}>
                Difference
              </th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {items.map((item, index) => {
            const hasChanged = item.before !== item.after;
            const diff = calculateDiff(item.before, item.after, item.diffType);

            return (
              <tr
                key={item.id}
                className={`
                  border-t border-border
                  ${highlightChanges && hasChanged ? 'bg-warning/5' : ''}
                  ${index % 2 === 1 ? 'bg-muted/30' : ''}
                `}
              >
                {/* Label */}
                <td className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-sm font-medium`}>
                  {item.label}
                  {highlightChanges && hasChanged && (
                    <AlertCircle className="inline-block w-3 h-3 ml-2 text-warning" />
                  )}
                </td>

                {/* Before Value */}
                <td className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-sm`}>
                  {item.renderBefore ? item.renderBefore(item.before) : (
                    <span className={hasChanged ? 'text-muted-foreground line-through' : ''}>
                      {formatValue(item.before)}
                    </span>
                  )}
                </td>

                {/* Arrow Indicator */}
                {showDiffColumn && (
                  <td className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-center`}>
                    {hasChanged ? (
                      <ArrowRight className="w-4 h-4 text-primary mx-auto" />
                    ) : (
                      <Minus className="w-4 h-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                )}

                {/* After Value */}
                <td className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-sm`}>
                  {item.renderAfter ? item.renderAfter(item.after) : (
                    <span className={hasChanged ? 'font-semibold text-foreground' : ''}>
                      {formatValue(item.after)}
                    </span>
                  )}
                </td>

                {/* Difference */}
                {showDiffColumn && (
                  <td className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-sm text-right`}>
                    {diff && (
                      <DifferenceIndicator
                        diff={diff}
                        type={item.diffType || 'text'}
                      />
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DifferenceIndicator({
  diff,
  type,
}: {
  diff: any;
  type: 'numeric' | 'boolean' | 'text';
}) {
  if (type === 'numeric' && typeof diff === 'number') {
    const isPositive = diff > 0;
    const isNegative = diff < 0;

    return (
      <span
        className={`
          inline-flex items-center gap-1 text-xs font-semibold
          ${isPositive ? 'text-success' : ''}
          ${isNegative ? 'text-destructive' : ''}
        `}
      >
        {isPositive && '+'}
        {diff.toFixed(2)}
      </span>
    );
  }

  if (type === 'boolean') {
    return diff ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
        <Check className="w-3 h-3" />
        Changed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <Minus className="w-3 h-3" />
        No change
      </span>
    );
  }

  // Text type
  return (
    <span className="text-xs text-muted-foreground">
      Modified
    </span>
  );
}

function calculateDiff(
  before: any,
  after: any,
  type: 'numeric' | 'boolean' | 'text' = 'text'
): any {
  if (before === after) return null;

  if (type === 'numeric') {
    const beforeNum = Number(before);
    const afterNum = Number(after);
    if (!isNaN(beforeNum) && !isNaN(afterNum)) {
      return afterNum - beforeNum;
    }
  }

  if (type === 'boolean') {
    return before !== after;
  }

  return true; // Text changed
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
