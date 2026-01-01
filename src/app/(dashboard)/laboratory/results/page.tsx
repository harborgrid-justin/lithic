'use client';

import React from 'react';
import ResultViewer from '@/components/laboratory/ResultViewer';

export default function ResultsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laboratory Results</h1>
        <p className="text-muted-foreground mt-2">
          View and manage laboratory test results
        </p>
      </div>

      <ResultViewer />
    </div>
  );
}
