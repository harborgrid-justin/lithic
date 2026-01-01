/**
 * Enterprise Audit Log Viewer
 * Advanced audit log search and analysis
 * Lithic Enterprise Healthcare Platform v0.3
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter } from "lucide-react";

export default function AuditLogViewerPage() {
  const [logs, _setLogs] = useState([
    {
      id: "1",
      timestamp: new Date(),
      userId: "user123",
      userEmail: "john.doe@example.com",
      action: "PHI_READ",
      resource: "Patient",
      resourceId: "pat123",
      success: true,
      phiAccessed: true,
    },
  ]);

  const [filters, setFilters] = useState({
    search: "",
    action: "",
    dateRange: "today",
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Comprehensive audit trail of all system activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search audit logs..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{log.action}</p>
                    {log.phiAccessed && (
                      <Badge variant="danger">PHI</Badge>
                    )}
                    {log.success ? (
                      <Badge variant="default">Success</Badge>
                    ) : (
                      <Badge variant="danger">Failed</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log.userEmail} accessed {log.resource} ({log.resourceId})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
