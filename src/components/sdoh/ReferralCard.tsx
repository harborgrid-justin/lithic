"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SDOHReferral } from "@/types/sdoh";
import { formatReferralStatus, getStatusColor } from "@/lib/sdoh/referral-manager";

interface ReferralCardProps {
  referral: SDOHReferral;
  onViewDetails: () => void;
}

export function ReferralCard({ referral, onViewDetails }: ReferralCardProps) {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{referral.reason}</h4>
            <Badge
              style={{
                backgroundColor: getStatusColor(referral.status),
                color: "white",
              }}
            >
              {formatReferralStatus(referral.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {referral.domain.replace(/_/g, " ")}
          </p>
          <p className="text-sm mt-2">
            Referred: {new Date(referral.referredDate).toLocaleDateString()}
          </p>
          {referral.contactAttempts.length > 0 && (
            <p className="text-sm">
              Last contact: {referral.contactAttempts.length} attempts
            </p>
          )}
        </div>
        <Button variant="outline" onClick={onViewDetails}>
          Details
        </Button>
      </div>
    </Card>
  );
}
