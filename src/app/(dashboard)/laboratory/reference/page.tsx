"use client";

import React from "react";
import ReferenceRanges from "@/components/laboratory/ReferenceRanges";

export default function ReferencePage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reference Ranges</h1>
        <p className="text-muted-foreground mt-2">
          Laboratory test reference ranges and critical values
        </p>
      </div>

      <ReferenceRanges />
    </div>
  );
}
