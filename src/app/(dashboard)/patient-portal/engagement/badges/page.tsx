/**
 * Badge Collection Page
 * View and track achievement badges
 */

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { BadgeGallery } from '@/components/engagement/badge-gallery';
import { Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Badge Collection | Patient Portal',
  description: 'View your achievement badges and unlock progress',
};

export default function BadgesPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/patient-portal/engagement"
            className="text-muted-foreground hover:text-foreground"
          >
            Engagement
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Badges</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
          <Award className="h-10 w-10" />
          Badge Collection
        </h1>
        <p className="text-muted-foreground mt-2">
          Unlock achievements by completing health activities and reaching milestones
        </p>
      </div>

      {/* Badge Gallery */}
      <BadgeGallery />
    </div>
  );
}
