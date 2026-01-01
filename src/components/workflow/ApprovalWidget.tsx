/**
 * Approval Widget - Approval Actions Component
 */

"use client";

import React from "react";
import { ApprovalRequest, ApprovalStatus } from "@/types/workflow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, MessageSquare, Clock } from "lucide-react";
import { format } from "date-fns";

interface ApprovalWidgetProps {
  approval: ApprovalRequest;
  onApprove?: (comments?: string) => void;
  onReject?: (reason: string, comments?: string) => void;
  onComment?: (text: string) => void;
  canApprove?: boolean;
}

export function ApprovalWidget({
  approval,
  onApprove,
  onReject,
  onComment,
  canApprove = true,
}: ApprovalWidgetProps) {
  const [showComments, setShowComments] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");

  const statusColors = {
    [ApprovalStatus.PENDING]: "bg-yellow-500",
    [ApprovalStatus.APPROVED]: "bg-green-500",
    [ApprovalStatus.REJECTED]: "bg-red-500",
    [ApprovalStatus.CANCELLED]: "bg-gray-500",
    [ApprovalStatus.EXPIRED]: "bg-orange-500",
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{approval.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{approval.description}</p>
          </div>
          <Badge className={statusColors[approval.status]}>
            {approval.status}
          </Badge>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <span className="font-medium">Requested by:</span> {approval.requestedBy}
          </div>
          <div>
            <span className="font-medium">Level:</span> {approval.currentLevel} of {approval.config.levels.length}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {format(new Date(approval.requestedAt), "MMM d, yyyy HH:mm")}
          </div>
          {approval.dueDate && (
            <div className="text-red-600">
              Due: {format(new Date(approval.dueDate), "MMM d")}
            </div>
          )}
        </div>

        {/* Approval History */}
        {approval.approvals.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Approvals ({approval.approvals.length})</h4>
            <div className="space-y-1">
              {approval.approvals.slice(0, 3).map((app) => (
                <div key={app.id} className="text-sm flex items-center gap-2">
                  <ThumbsUp className="h-3 w-3 text-green-600" />
                  <span>{app.approverName}</span>
                  <span className="text-gray-500">
                    {format(new Date(app.approvedAt), "MMM d, HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {canApprove && approval.status === ApprovalStatus.PENDING && (
          <div className="space-y-2 pt-3 border-t">
            <div className="flex gap-2">
              <Button
                onClick={() => onApprove && onApprove(comment)}
                className="flex-1"
                variant="default"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => {
                  if (rejectReason && onReject) {
                    onReject(rejectReason, comment);
                  }
                }}
                className="flex-1"
                variant="danger"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>

            <Button
              onClick={() => setShowComments(!showComments)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>

            {showComments && (
              <div className="space-y-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your comments..."
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        {approval.comments.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Comments ({approval.comments.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {approval.comments.map((c) => (
                <div key={c.id} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="font-medium">{c.authorName}</div>
                  <div className="text-gray-600 mt-1">{c.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(c.createdAt), "MMM d, HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
