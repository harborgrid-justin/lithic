"use client";

/**
 * Resource Finder Component
 *
 * Search and filter community resources
 */

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  CommunityResource,
  ResourceSearchParams,
  SDOHDomain,
} from "@/types/sdoh";

interface ResourceFinderProps {
  onSelectResource: (resource: CommunityResource) => void;
  initialDomains?: SDOHDomain[];
  patientLocation?: { latitude: number; longitude: number };
}

export function ResourceFinder({
  onSelectResource,
  initialDomains = [],
  patientLocation,
}: ResourceFinderProps) {
  const [searchParams, setSearchParams] = useState<ResourceSearchParams>({
    query: "",
    domains: initialDomains,
    radiusMiles: 25,
  });
  const [results, setResults] = useState<CommunityResource[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch("/api/sdoh/resources/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchParams),
      });
      const data = await response.json();
      setResults(data.resources || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Community Resources</h3>

          <div className="flex gap-3">
            <Input
              placeholder="Search resources by name or service..."
              value={searchParams.query || ""}
              onChange={(e) =>
                setSearchParams({ ...searchParams, query: e.target.value })
              }
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Radius:</span>
            <select
              className="text-sm border rounded px-2 py-1"
              value={searchParams.radiusMiles}
              onChange={(e) =>
                setSearchParams({
                  ...searchParams,
                  radiusMiles: Number(e.target.value),
                })
              }
            >
              <option value={5}>5 miles</option>
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-3">
        {results.length === 0 && !isSearching && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Enter search criteria to find resources
            </p>
          </Card>
        )}

        {results.map((resource) => (
          <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold">{resource.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {resource.description}
                </p>

                <div className="flex gap-2 mt-3">
                  {resource.domains.slice(0, 3).map((domain) => (
                    <Badge key={domain} variant="outline">
                      {domain.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3 text-sm">
                  <p>{resource.address.line1}</p>
                  <p>
                    {resource.address.city}, {resource.address.state}{" "}
                    {resource.address.postalCode}
                  </p>
                  <p className="text-primary">{resource.contactInfo.phone}</p>
                </div>
              </div>

              <Button onClick={() => onSelectResource(resource)}>
                Select
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
