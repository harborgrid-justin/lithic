"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResourceSchedule from "@/components/scheduling/ResourceSchedule";
import { schedulingService } from "@/services/scheduling.service";
import type { Resource } from "@/types/scheduling";
import { toast } from "sonner";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await schedulingService.getResources();
      setResources(data);
      if (data.length > 0) {
        setSelectedResource(data[0]);
      }
    } catch (error) {
      toast.error("Failed to load resources");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesType = filterType === "all" || resource.type === filterType;
    const matchesSearch =
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-gray-600 mt-1">
            Manage rooms, equipment, and other resources
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {resources.filter((r) => r.type === "room").length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Rooms</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {resources.filter((r) => r.type === "equipment").length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Equipment</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {resources.filter((r) => r.isAvailable).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">Available</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {resources.filter((r) => !r.isAvailable).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">In Use</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search resources..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="room">Rooms</option>
            <option value="equipment">Equipment</option>
            <option value="facility">Facilities</option>
            <option value="vehicle">Vehicles</option>
          </Select>
          <Input
            type="date"
            value={selectedDate.toISOString().split("T")[0] || ""}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-4 gap-6">
        {/* Resource List */}
        <div className="col-span-1 space-y-2">
          <h3 className="font-semibold text-lg mb-3">
            Resources ({filteredResources.length})
          </h3>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No resources found
            </div>
          ) : (
            filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className={`cursor-pointer transition-all ${
                  selectedResource?.id === resource.id
                    ? "border-primary-600 bg-primary-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedResource(resource)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{resource.name}</span>
                    <Badge
                      variant={resource.isAvailable ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {resource.isAvailable ? "Available" : "In Use"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {resource.location}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs capitalize">
                    {resource.type}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Resource Schedule */}
        <div className="col-span-3">
          {selectedResource ? (
            <ResourceSchedule resource={selectedResource} date={selectedDate} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Select a resource to view its schedule
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
