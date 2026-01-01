"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import WaitlistManager from "@/components/scheduling/WaitlistManager";
import { schedulingService } from "@/services/scheduling.service";
import type { WaitlistEntry, Provider } from "@/types/scheduling";
import { toast } from "sonner";

export default function WaitlistPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterProvider]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterStatus !== "all") {
        filters.status = filterStatus;
      }
      if (filterProvider !== "all") {
        filters.providerId = filterProvider;
      }

      const [entriesData, providersData] = await Promise.all([
        schedulingService.getWaitlist(filters),
        schedulingService.getProviders(),
      ]);

      setEntries(entriesData);
      setProviders(providersData);
    } catch (error) {
      toast.error("Failed to load waitlist");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = (entry: WaitlistEntry) => {
    // Navigate to new appointment page with pre-filled data
    const params = new URLSearchParams({
      patientId: entry.patientId,
      providerId: entry.providerId || "",
      type: entry.appointmentType,
      waitlistId: entry.id,
    });
    router.push(`/scheduling/appointments/new?${params.toString()}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waitlist</h1>
          <p className="text-gray-600 mt-1">
            Manage patients waiting for appointments
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add to Waitlist
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="contacted">Contacted</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
          >
            <option value="all">All Providers</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </Select>
          <Select>
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      </Card>

      {/* Waitlist */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading waitlist...
        </div>
      ) : (
        <WaitlistManager
          entries={entries}
          providers={providers}
          onEntryUpdate={loadData}
          onSchedule={handleSchedule}
        />
      )}
    </div>
  );
}
