"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ScheduleTemplateComponent from "@/components/scheduling/ScheduleTemplate";
import { schedulingService } from "@/services/scheduling.service";
import type { ScheduleTemplate, Provider } from "@/types/scheduling";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, providersData] = await Promise.all([
        schedulingService.getScheduleTemplates(),
        schedulingService.getProviders(),
      ]);

      setTemplates(templatesData);
      setProviders(providersData);
    } catch (error) {
      toast.error("Failed to load templates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: ScheduleTemplate) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await schedulingService.deleteScheduleTemplate(template.id);
      toast.success("Template deleted successfully");
      await loadData();
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const handleApply = async (template: ScheduleTemplate) => {
    if (!template.providerId) {
      toast.error("Template must have an assigned provider to apply");
      return;
    }

    try {
      // Apply template to provider schedule
      const startDate = new Date().toISOString().split("T")[0] || "";
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().split("T")[0] || "";

      await schedulingService.applyScheduleTemplate(
        template.id,
        template.providerId,
        startDate,
        endDateStr,
      );
      toast.success("Template applied successfully");
    } catch (error) {
      toast.error("Failed to apply template");
      console.error(error);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Templates</h1>
          <p className="text-gray-600 mt-1">
            Create and manage reusable scheduling templates
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-primary-600">
              {templates.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Total Templates</div>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {templates.filter((t) => t.isActive).length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Active</div>
          </div>
        </Card>

        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {templates.filter((t) => t.providerId).length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Assigned to Providers
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search templates..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-gray-500">No templates found</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <ScheduleTemplateComponent
              key={template.id}
              template={template}
              provider={providers.find((p) => p.id === template.providerId)}
              onDelete={handleDelete}
              onApply={handleApply}
            />
          ))
        )}
      </div>
    </div>
  );
}
