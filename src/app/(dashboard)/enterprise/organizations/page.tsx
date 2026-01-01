"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Search,
  Settings,
  Users,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  Organization,
  OrganizationStatus,
  OrganizationType,
} from "@/types/enterprise";
import { OrganizationTree } from "@/components/enterprise/OrganizationTree";
import toast from "react-hot-toast";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "hierarchy">("list");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/enterprise/organizations");
      const data = await response.json();

      if (data.success) {
        setOrganizations(data.data);
      } else {
        toast.error("Failed to fetch organizations");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.npi.includes(searchQuery) ||
      org.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: OrganizationStatus) => {
    const colors = {
      [OrganizationStatus.ACTIVE]: "bg-green-100 text-green-800",
      [OrganizationStatus.TRIAL]: "bg-blue-100 text-blue-800",
      [OrganizationStatus.SUSPENDED]: "bg-red-100 text-red-800",
      [OrganizationStatus.INACTIVE]: "bg-gray-100 text-gray-800",
      [OrganizationStatus.PENDING_SETUP]: "bg-yellow-100 text-yellow-800",
      [OrganizationStatus.ARCHIVED]: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatOrganizationType = (type: OrganizationType) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your healthcare organization hierarchy and settings
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Organization
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                organizations.filter(
                  (o) => o.status === OrganizationStatus.ACTIVE,
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Operational organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                organizations.filter(
                  (o) => o.status === OrganizationStatus.TRIAL,
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Evaluation period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                organizations.filter(
                  (o) =>
                    o.status === OrganizationStatus.SUSPENDED ||
                    o.status === OrganizationStatus.PENDING_SETUP,
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Controls */}
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
          <Button
            variant={viewMode === "hierarchy" ? "default" : "outline"}
            onClick={() => setViewMode("hierarchy")}
          >
            Hierarchy View
          </Button>
        </div>
      </div>

      {/* Organizations Display */}
      {viewMode === "hierarchy" ? (
        <Card>
          <CardHeader>
            <CardTitle>Organization Hierarchy</CardTitle>
            <CardDescription>
              Visual representation of your organization structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationTree organizations={organizations} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              {filteredOrganizations.length} organization
              {filteredOrganizations.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{org.name}</h3>
                        <Badge className={getStatusColor(org.status)}>
                          {org.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{formatOrganizationType(org.type)}</span>
                        <span>NPI: {org.npi}</span>
                        <span>{org.subscription} Tier</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredOrganizations.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No organizations found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
