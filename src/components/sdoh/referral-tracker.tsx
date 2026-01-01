/**
 * SDOH Referral Status Tracker Component
 * Timeline view with communication history
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, Send, MessageSquare } from "lucide-react";
import { ReferralStatus } from "@/lib/sdoh/referrals/referral-engine";

interface StatusUpdate {
  status: ReferralStatus;
  timestamp: string;
  updatedBy: string;
  notes?: string;
}

interface Referral {
  id: string;
  resourceName: string;
  needCategory: string;
  status: ReferralStatus;
  sentDate?: string;
  statusHistory: StatusUpdate[];
  urgency: string;
  receivingOrganizationName: string;
}

interface ReferralTrackerProps {
  referral: Referral;
  onUpdateStatus: (status: ReferralStatus, notes?: string) => void;
  onSendMessage: () => void;
}

export function ReferralTracker({
  referral,
  onUpdateStatus,
  onSendMessage,
}: ReferralTrackerProps) {
  const getStatusColor = (status: ReferralStatus) => {
    const colors = {
      [ReferralStatus.DRAFT]: "bg-gray-100 text-gray-800",
      [ReferralStatus.PENDING]: "bg-blue-100 text-blue-800",
      [ReferralStatus.SENT]: "bg-purple-100 text-purple-800",
      [ReferralStatus.RECEIVED]: "bg-indigo-100 text-indigo-800",
      [ReferralStatus.ACCEPTED]: "bg-green-100 text-green-800",
      [ReferralStatus.REJECTED]: "bg-red-100 text-red-800",
      [ReferralStatus.IN_PROGRESS]: "bg-yellow-100 text-yellow-800",
      [ReferralStatus.COMPLETED]: "bg-emerald-100 text-emerald-800",
      [ReferralStatus.CANCELLED]: "bg-gray-100 text-gray-800",
      [ReferralStatus.EXPIRED]: "bg-orange-100 text-orange-800",
    };
    return colors[status] || colors[ReferralStatus.PENDING];
  };

  const getStatusIcon = (status: ReferralStatus) => {
    switch (status) {
      case ReferralStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case ReferralStatus.REJECTED:
      case ReferralStatus.CANCELLED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case ReferralStatus.SENT:
        return <Send className="h-5 w-5 text-purple-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{referral.resourceName}</h2>
            <div className="flex gap-2 mb-3">
              <Badge className={getStatusColor(referral.status)}>
                {referral.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline">{referral.needCategory}</Badge>
              <Badge variant="outline" className="capitalize">
                {referral.urgency}
              </Badge>
            </div>
            <p className="text-gray-600">
              To: {referral.receivingOrganizationName}
            </p>
            {referral.sentDate && (
              <p className="text-sm text-gray-500 mt-1">
                Sent: {new Date(referral.sentDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button onClick={onSendMessage} variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </Card>

      {/* Status Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Status Timeline</h3>
        <div className="space-y-4">
          {referral.statusHistory
            .slice()
            .reverse()
            .map((update, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getStatusIcon(update.status)}
                  {index < referral.statusHistory.length - 1 && (
                    <div className="w-0.5 h-16 bg-gray-200 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {update.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(update.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Updated by: {update.updatedBy}
                  </p>
                  {update.notes && (
                    <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                      {update.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Actions */}
      {referral.status !== ReferralStatus.COMPLETED &&
        referral.status !== ReferralStatus.CANCELLED && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Update Status</h3>
            <div className="flex gap-2 flex-wrap">
              {referral.status === ReferralStatus.SENT && (
                <Button
                  variant="outline"
                  onClick={() => onUpdateStatus(ReferralStatus.RECEIVED)}
                >
                  Mark as Received
                </Button>
              )}
              {referral.status === ReferralStatus.RECEIVED && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onUpdateStatus(ReferralStatus.ACCEPTED)}
                  >
                    Accept Referral
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onUpdateStatus(ReferralStatus.REJECTED)}
                  >
                    Reject Referral
                  </Button>
                </>
              )}
              {(referral.status === ReferralStatus.ACCEPTED ||
                referral.status === ReferralStatus.IN_PROGRESS) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onUpdateStatus(ReferralStatus.IN_PROGRESS)}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    onClick={() => onUpdateStatus(ReferralStatus.COMPLETED)}
                  >
                    Mark as Completed
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                onClick={() => onUpdateStatus(ReferralStatus.CANCELLED)}
              >
                Cancel Referral
              </Button>
            </div>
          </Card>
        )}
    </div>
  );
}
