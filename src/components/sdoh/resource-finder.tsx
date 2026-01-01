/**
 * SDOH Resource Finder Component
 * Search interface with map view and filtering
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Globe, Star, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResourceCategory } from "@/lib/sdoh/resources/resource-database";

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  distance?: number;
  phone: string;
  website?: string;
  address: string;
  rating?: number;
  verified: boolean;
  acceptsReferrals: boolean;
}

interface ResourceFinderProps {
  onSelectResource: (resource: Resource) => void;
  onCreateReferral: (resource: Resource) => void;
  initialCategory?: ResourceCategory;
}

export function ResourceFinder({
  onSelectResource,
  onCreateReferral,
  initialCategory,
}: ResourceFinderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string>(initialCategory || "");
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sdoh/resources/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: searchTerm,
          categories: category ? [category] : undefined,
          radius: 25,
          verifiedOnly: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.data.results.map((r: any) => r.resource));
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {Object.values(ResourceCategory).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </Card>

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-8 text-center">
            <p>Searching resources...</p>
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No resources found. Try adjusting your search.</p>
          </Card>
        ) : (
          results.map((resource) => (
            <Card key={resource.id} className="p-4">
              <div className="flex justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{resource.name}</h3>
                    {resource.verified && (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    )}
                    {resource.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{resource.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {resource.category}
                  </Badge>
                  <p className="text-gray-700 mb-3">{resource.description}</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    {resource.distance && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{resource.distance} miles away</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{resource.phone}</span>
                    </div>
                    {resource.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a
                          href={resource.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={() => onCreateReferral(resource)}
                    disabled={!resource.acceptsReferrals}
                  >
                    Create Referral
                  </Button>
                  <Button variant="outline" onClick={() => onSelectResource(resource)}>
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
