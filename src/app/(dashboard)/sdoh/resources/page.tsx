/**
 * SDOH Resources Page
 */

"use client";

import React, { useState } from "react";
import { ResourceFinder } from "@/components/sdoh/ResourceFinder";
import type { CommunityResource } from "@/types/sdoh";

export default function ResourcesPage() {
  const [selectedResource, setSelectedResource] = useState<CommunityResource | null>(null);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Community Resources</h1>

      <ResourceFinder
        onSelectResource={(resource) => setSelectedResource(resource)}
        initialDomains={[]}
      />

      {selectedResource && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Selected Resource</h2>
          <p className="text-muted-foreground">{selectedResource.name}</p>
        </div>
      )}
    </div>
  );
}
