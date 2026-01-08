/**
 * Consent History Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { ConsentAuditEntry } from '@/lib/consent/consent-manager';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConsentHistoryProps {
  auditLog: ConsentAuditEntry[];
  className?: string;
}

export function ConsentHistory({ auditLog, className = '' }: ConsentHistoryProps) {
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: 'bg-blue-500',
      granted: 'bg-green-500',
      denied: 'bg-red-500',
      withdrawn: 'bg-orange-500',
      modified: 'bg-yellow-500',
      expired: 'bg-gray-500',
    };
    return colors[action] || 'bg-gray-400';
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Consent History</h3>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

        <div className="space-y-4">
          {auditLog.map((entry) => (
            <div key={entry.id} className="relative pl-10">
              <div className={`absolute left-2 w-4 h-4 rounded-full ${getActionColor(entry.action)}`} />

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                  </span>
                </div>

                <p className="text-sm font-medium mb-1">{entry.performedByName}</p>
                <p className="text-xs text-muted-foreground">{entry.performedByRole}</p>

                {Object.keys(entry.details).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {JSON.stringify(entry.details)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
