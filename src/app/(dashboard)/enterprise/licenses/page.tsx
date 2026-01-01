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
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Key,
  TrendingUp,
  Users,
  AlertCircle,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { LicenseAllocation, LicenseType } from "@/types/enterprise";
import { useOrganization } from "@/hooks/useOrganization";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";

export default function LicensesPage() {
  const { organization } = useOrganization();
  const [licenses, setLicenses] = useState<LicenseAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (organization) {
      fetchLicenses();
    }
  }, [organization]);

  const fetchLicenses = async () => {
    if (!organization) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/enterprise/licenses?organizationId=${organization.id}`,
      );
      const data = await response.json();

      if (data.success) {
        setLicenses(data.data);
      } else {
        toast.error("Failed to fetch licenses");
      }
    } catch (error) {
      console.error("Error fetching licenses:", error);
      toast.error("Failed to fetch licenses");
    } finally {
      setLoading(false);
    }
  };

  const calculateUtilization = (license: LicenseAllocation) => {
    return (license.allocatedLicenses / license.totalLicenses) * 100;
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const formatLicenseType = (type: LicenseType) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getDaysUntilExpiry = (expiryDate: Date | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalLicenses = licenses.reduce((sum, l) => sum + l.totalLicenses, 0);
  const totalAllocated = licenses.reduce(
    (sum, l) => sum + l.allocatedLicenses,
    0,
  );
  const totalAvailable = licenses.reduce(
    (sum, l) => sum + l.availableLicenses,
    0,
  );
  const avgUtilization =
    licenses.reduce((sum, l) => sum + calculateUtilization(l), 0) /
      licenses.length || 0;

  const activeUsers = licenses.reduce(
    (sum, l) => sum + l.assignments.filter((a) => a.status === "ACTIVE").length,
    0,
  );

  const totalCost = licenses.reduce(
    (sum, l) => sum + l.totalLicenses * l.costPerLicense,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading licenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">License Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor license usage, allocations, and renewals
          </p>
        </div>
        <Button>
          <Key className="h-4 w-4 mr-2" />
          Purchase Licenses
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Licenses
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAvailable} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAllocated} allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across all types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Annual Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalCost / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total license spend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* License Allocations */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>License Allocations</CardTitle>
              <CardDescription>
                Manage and monitor your license usage by type
              </CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search licenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {licenses.map((license) => {
              const utilization = calculateUtilization(license);
              const daysUntilExpiry = getDaysUntilExpiry(license.expiryDate);
              const isExpiringSoon =
                daysUntilExpiry !== null && daysUntilExpiry <= 30;
              const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

              return (
                <div key={license.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {formatLicenseType(license.licenseType)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {license.billingCycle} billing
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {license.allocatedLicenses}/{license.totalLicenses}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {license.availableLicenses} available
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className={getUtilizationColor(utilization)}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={utilization} className="h-2" />
                  </div>

                  {/* License Details Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Active Users
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {
                          license.assignments.filter(
                            (a) => a.status === "ACTIVE",
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Cost per License
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        ${license.costPerLicense}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Cost
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        $
                        {(
                          license.totalLicenses * license.costPerLicense
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Expiry Date
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {license.expiryDate
                          ? format(new Date(license.expiryDate), "MMM dd, yyyy")
                          : "No expiry"}
                      </p>
                    </div>
                  </div>

                  {/* Expiry Warning */}
                  {(isExpiringSoon || isExpired) && (
                    <div
                      className={`p-3 rounded-lg flex items-center gap-2 ${
                        isExpired
                          ? "bg-red-50 text-red-800"
                          : "bg-yellow-50 text-yellow-800"
                      }`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {isExpired
                          ? "License has expired!"
                          : `License expires in ${daysUntilExpiry} days`}
                      </span>
                      {license.autoRenew && (
                        <Badge variant="outline" className="ml-auto">
                          Auto-renewal enabled
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      View Assignments
                    </Button>
                    <Button variant="outline" size="sm">
                      Manage Users
                    </Button>
                    {license.expiryDate && !license.autoRenew && (
                      <Button variant="outline" size="sm" className="ml-auto">
                        <Calendar className="h-4 w-4 mr-2" />
                        Renew
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {licenses.length === 0 && (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No licenses found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Purchase licenses to enable features for your organization
                </p>
                <Button>
                  <Key className="h-4 w-4 mr-2" />
                  Purchase Licenses
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent License Assignments</CardTitle>
          <CardDescription>
            Latest license allocations and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {licenses
              .flatMap((license) =>
                license.assignments
                  .sort(
                    (a, b) =>
                      new Date(b.assignedAt).getTime() -
                      new Date(a.assignedAt).getTime(),
                  )
                  .slice(0, 5)
                  .map((assignment) => (
                    <div
                      key={`${license.id}-${assignment.userId}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          {assignment.status === "ACTIVE" ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{assignment.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.userEmail} • {assignment.role}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {formatLicenseType(license.licenseType)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(assignment.assignedAt))}{" "}
                          ago
                        </p>
                      </div>
                    </div>
                  )),
              )
              .slice(0, 10)}

            {licenses.every((l) => l.assignments.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No license assignments yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
