"use client";

/**
 * Lithic Enterprise v0.3 - Denial Workflow Component
 */

import { useState } from "react";
import type { Denial, DenialStatus } from "@/types/billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Send, XCircle, CheckCircle, AlertCircle } from "lucide-react";

interface DenialWorkflowProps {
  denial: Denial;
  onAction: (action: string, data: any) => Promise<void>;
}

export function DenialWorkflow({ denial, onAction }: DenialWorkflowProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAppeal = async () => {
    setLoading(true);
    try {
      await onAction("appeal", { notes });
    } finally {
      setLoading(false);
    }
  };

  const statusColors: { [key in DenialStatus]: string } = {
    NEW: "bg-blue-100 text-blue-800",
    WORKING: "bg-yellow-100 text-yellow-800",
    APPEALED: "bg-purple-100 text-purple-800",
    RESUBMITTED: "bg-indigo-100 text-indigo-800",
    RESOLVED: "bg-green-100 text-green-800",
    WRITTEN_OFF: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Denial Details</CardTitle>
            <Badge className={statusColors[denial.status]}>
              {denial.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Denial Date</div>
              <div className="font-medium">
                {new Date(denial.denialDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Amount</div>
              <div className="font-medium text-lg">
                ${denial.amount.toFixed(2)}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500">Denial Reason</div>
              <div className="font-medium">{denial.denialReason}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Denial Code</div>
              <div className="font-medium">{denial.denialCode}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Category</div>
              <div className="font-medium">{denial.denialCategory}</div>
            </div>
          </div>

          {denial.appealable && denial.appealDeadline && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-semibold text-yellow-900">
                    Appeal Deadline
                  </div>
                  <div className="text-sm text-yellow-700">
                    {new Date(denial.appealDeadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Work Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes about this denial..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            {denial.appealable && (
              <Button onClick={handleAppeal} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Generate Appeal
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onAction("resubmit", { notes })}
              disabled={loading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Resubmit Corrected
            </Button>
            <Button
              variant="danger"
              onClick={() => onAction("write-off", { notes })}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Write Off
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
