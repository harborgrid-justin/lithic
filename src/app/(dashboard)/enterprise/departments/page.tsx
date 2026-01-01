"use client";

import { useState, useEffect, useCallback } from "react";
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
  Plus,
  Search,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Department,
  DepartmentStatus,
  DepartmentType,
} from "@/types/enterprise";
import { DepartmentConfig } from "@/components/enterprise/DepartmentConfig";
import { useOrganization } from "@/hooks/useOrganization";
import toast from "react-hot-toast";

export default function DepartmentsPage() {
  const { facility } = useOrganization();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [showDepartmentConfig, setShowDepartmentConfig] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (facility) {
      fetchDepartments();
    }
  }, [facility]);

  const fetchDepartments = async () => {
    if (!facility) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/enterprise/departments?facilityId=${facility.id}`,
      );
      const data = await response.json();

      if (data.success) {
        setDepartments(data.data);
      } else {
        toast.error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (deptId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepartments(newExpanded);
  };

  const getStatusColor = (status: DepartmentStatus) => {
    const colors = {
      [DepartmentStatus.ACTIVE]: "bg-green-100 text-green-800",
      [DepartmentStatus.INACTIVE]: "bg-gray-100 text-gray-800",
      [DepartmentStatus.RESTRUCTURING]: "bg-yellow-100 text-yellow-800",
      [DepartmentStatus.MERGED]: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDepartmentType = (type: DepartmentType) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderDepartmentTree = (parentId: string | null, level: number = 0) => {
    const childDepts = departments.filter(
      (d) => d.parentDepartmentId === parentId,
    );

    return childDepts.map((dept) => {
      const hasChildren = departments.some(
        (d) => d.parentDepartmentId === dept.id,
      );
      const isExpanded = expandedDepartments.has(dept.id);

      return (
        <div key={dept.id}>
          <div
            className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer ${
              level > 0 ? "ml-8 mt-2" : "mt-3"
            }`}
            style={{ marginLeft: level * 32 }}
          >
            <div className="flex items-center gap-3 flex-1">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(dept.id);
                  }}
                  className="p-1 hover:bg-accent rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-6" />}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{dept.name}</h3>
                  <Badge className={getStatusColor(dept.status)}>
                    {dept.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {dept.code}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span>{formatDepartmentType(dept.type)}</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {dept.staffMembers.length} staff
                  </span>
                  {dept.budget && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />$
                      {(dept.budget.totalBudget / 1000000).toFixed(1)}M
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDepartment(dept);
                setShowDepartmentConfig(true);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>

          {hasChildren &&
            isExpanded &&
            renderDepartmentTree(dept.id, level + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Facility Selected</h3>
          <p className="text-muted-foreground">
            Please select a facility to view departments
          </p>
        </div>
      </div>
    );
  }

  const totalStaff = departments.reduce(
    (sum, d) => sum + d.staffMembers.length,
    0,
  );
  const totalBudget = departments.reduce(
    (sum, d) => sum + (d.budget?.totalBudget || 0),
    0,
  );
  const avgUtilization =
    departments.reduce((sum, d) => {
      if (!d.budget) return sum;
      return sum + (d.budget.currentSpend / d.budget.totalBudget) * 100;
    }, 0) / departments.filter((d) => d.budget).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure departments, assign staff, and manage budgets
          </p>
        </div>
        <Button onClick={() => setShowDepartmentConfig(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Department
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Departments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Assigned members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalBudget / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Annual allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Utilization
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Budget usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Department Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Department Hierarchy</CardTitle>
          <CardDescription>
            Organizational structure at {facility.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <div className="space-y-2">{renderDepartmentTree(null, 0)}</div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No departments found
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first department
              </p>
              <Button onClick={() => setShowDepartmentConfig(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Config Modal */}
      {showDepartmentConfig && (
        <DepartmentConfig
          department={selectedDepartment}
          facilityId={facility.id}
          onClose={() => {
            setShowDepartmentConfig(false);
            setSelectedDepartment(null);
          }}
          onSave={() => {
            fetchDepartments();
            setShowDepartmentConfig(false);
            setSelectedDepartment(null);
          }}
        />
      )}
    </div>
  );
}
