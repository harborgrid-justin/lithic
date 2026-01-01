"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CareGapsDashboard } from "@/components/population-health/CareGapsDashboard";
import { Search, Filter, Download, Mail } from "lucide-react";

export default function CareGapsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Care Gaps Management
          </h1>
          <p className="text-gray-500 mt-1">
            Identify, track, and close care gaps across your patient population
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Bulk Outreach
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search patients or gaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Gaps</TabsTrigger>
          <TabsTrigger value="high-priority">High Priority</TabsTrigger>
          <TabsTrigger value="preventive">Preventive Care</TabsTrigger>
          <TabsTrigger value="chronic">Chronic Disease</TabsTrigger>
          <TabsTrigger value="closed">Recently Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CareGapsDashboard filter="all" searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="high-priority">
          <CareGapsDashboard filter="high-priority" searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="preventive">
          <CareGapsDashboard filter="preventive" searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="chronic">
          <CareGapsDashboard filter="chronic" searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="closed">
          <CareGapsDashboard filter="closed" searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
