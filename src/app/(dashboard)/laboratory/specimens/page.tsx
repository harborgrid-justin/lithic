'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Barcode } from 'lucide-react';
import SpecimenTracker from '@/components/laboratory/SpecimenTracker';
import BarcodeScanner from '@/components/laboratory/BarcodeScanner';

export default function SpecimensPage() {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Specimen Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage laboratory specimens
          </p>
        </div>
        <Button onClick={() => setShowScanner(!showScanner)}>
          <Barcode className="h-4 w-4 mr-2" />
          {showScanner ? 'Hide' : 'Show'} Scanner
        </Button>
      </div>

      {showScanner && (
        <BarcodeScanner
          onSpecimenFound={(specimen) => {
            console.log('Found specimen:', specimen);
          }}
        />
      )}

      <SpecimenTracker />
    </div>
  );
}
