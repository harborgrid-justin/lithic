'use client';

import React from 'react';
import QualityControl from '@/components/laboratory/QualityControl';
import CriticalAlerts from '@/components/laboratory/CriticalAlerts';

export default function QCPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quality Control</h1>
        <p className="text-muted-foreground mt-2">
          Quality control records and critical alerts monitoring
        </p>
      </div>

      <CriticalAlerts />
      <QualityControl />
    </div>
  );
}
