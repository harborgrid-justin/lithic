"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Users, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ProviderSchedule from "@/components/scheduling/ProviderSchedule";
import { schedulingService } from "@/services/scheduling.service";
import type { Provider, Appointment } from "@/types/scheduling";
import { toast } from "sonner";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await schedulingService.getProviders();
      setProviders(data);
      if (data.length > 0) {
        setSelectedProvider(data[0]);
      }
    } catch (error) {
      toast.error("Failed to load providers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      setSelectedProvider(provider);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Schedules</h1>
          <p className="text-gray-600 mt-1">
            View and manage provider availability
          </p>
        </div>
      </div>

      {/* Provider Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Providers</p>
                <p className="text-3xl font-bold mt-1">{providers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Today</p>
                <p className="text-3xl font-bold mt-1">
                  {
                    providers.filter((p) =>
                      p.availability.some(
                        (a) =>
                          a.dayOfWeek === new Date().getDay() && a.isActive,
                      ),
                    ).length
                  }
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-3xl font-bold mt-1">
                  {new Set(providers.map((p) => p.department)).size}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Selection and Schedule */}
      <div className="grid grid-cols-4 gap-6">
        {/* Provider List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : providers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No providers found
              </div>
            ) : (
              providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProvider?.id === provider.id
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedProvider(provider)}
                >
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-gray-500">
                    {provider.specialty}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {provider.department}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Provider Schedule */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Select Date
                  </label>
                  <Input
                    type="date"
                    value={selectedDate.toISOString().split("T")[0] || ""}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedProvider ? (
            <ProviderSchedule provider={selectedProvider} date={selectedDate} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                Select a provider to view their schedule
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
