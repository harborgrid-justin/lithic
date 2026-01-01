"use client"

import { PatientHistory } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { Activity, User, FileText, Shield, Users } from 'lucide-react';

interface PatientTimelineProps {
  history: PatientHistory[];
}

export function PatientTimeline({ history }: PatientTimelineProps) {
  const getIcon = (action: string) => {
    if (action.includes('create')) return <FileText className="h-4 w-4" />;
    if (action.includes('update')) return <Activity className="h-4 w-4" />;
    if (action.includes('insurance')) return <Shield className="h-4 w-4" />;
    if (action.includes('merge')) return <Users className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activity history available
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              {sortedHistory.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    {getIcon(item.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.action}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {item.performedBy}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(item.performedAt)}
                      </div>
                    </div>
                    {item.changes && Object.keys(item.changes).length > 0 && (
                      <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
                        <div className="font-medium text-gray-700 mb-1">Changes:</div>
                        <div className="space-y-1">
                          {Object.entries(item.changes).map(([key, value]) => (
                            <div key={key} className="text-gray-600">
                              <span className="font-medium">{key}:</span>{' '}
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        {item.ipAddress && <span>IP: {item.ipAddress}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
