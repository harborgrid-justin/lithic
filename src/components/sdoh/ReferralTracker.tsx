"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import type { SDOHReferral, ContactAttempt, ReferralOutcome } from "@/types/sdoh";

interface ReferralTrackerProps {
  referral: SDOHReferral;
}

export function ReferralTracker({ referral }: ReferralTrackerProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Referral Timeline</h3>
        <div className="space-y-4">
          {/* Referral Created */}
          <TimelineItem
            date={referral.referredDate}
            title="Referral Created"
            description={`By ${referral.referredBy}`}
          />

          {/* Contact Attempts */}
          {referral.contactAttempts.map((attempt) => (
            <TimelineItem
              key={attempt.id}
              date={attempt.date}
              title={`Contact Attempt - ${attempt.method}`}
              description={attempt.outcome}
            />
          ))}

          {/* Outcomes */}
          {referral.outcomes.map((outcome) => (
            <TimelineItem
              key={outcome.id}
              date={outcome.date}
              title={`Outcome: ${outcome.type}`}
              description={outcome.description}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function TimelineItem({
  date,
  title,
  description,
}: {
  date: Date;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
        {new Date(date).toLocaleDateString()}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
