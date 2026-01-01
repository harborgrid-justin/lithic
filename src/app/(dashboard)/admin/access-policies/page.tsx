/**
 * Access Policies Management Page
 * Lithic v0.2 - Advanced RBAC System
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import AccessPolicyEditor from "@/components/admin/AccessPolicyEditor";

interface Policy {
  id: string;
  name: string;
  description: string;
  priority: number;
  effect: string;
  enabled: boolean;
  rules: any[];
  createdAt: Date;
  updatedAt: Date;
}

export default function AccessPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<
    string | undefined
  >();
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchPolicies();
    fetchStats();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rbac/policies");
      const data = await response.json();

      if (data.success) {
        setPolicies(data.policies || []);
      } else {
        toast.error("Failed to fetch policies");
      }
    } catch (error) {
      toast.error("Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/rbac/policy-stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleCreatePolicy = () => {
    setSelectedPolicyId(undefined);
    setShowEditor(true);
  };

  const handleEditPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setShowEditor(true);
  };

  const handleDeletePolicy = async () => {
    if (!policyToDelete) return;

    try {
      const response = await fetch(`/api/rbac/policies/${policyToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Policy deleted successfully");
        fetchPolicies();
        fetchStats();
      } else {
        toast.error(data.error || "Failed to delete policy");
      }
    } catch (error) {
      toast.error("Failed to delete policy");
    } finally {
      setPolicyToDelete(null);
    }
  };

  const handleTogglePolicy = async (policyId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/rbac/policies/${policyId}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Policy ${enabled ? "enabled" : "disabled"} successfully`,
        );
        fetchPolicies();
      } else {
        toast.error("Failed to update policy");
      }
    } catch (error) {
      toast.error("Failed to update policy");
    }
  };

  const filteredPolicies = policies.filter((policy) =>
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getEffectBadge = (effect: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      ALLOW: { variant: "default", icon: CheckCircle },
      DENY: { variant: "destructive", icon: AlertTriangle },
      REQUIRE_MFA: { variant: "secondary", icon: Shield },
      REQUIRE_APPROVAL: { variant: "outline", icon: Clock },
    };

    const config = variants[effect] || { variant: "default", icon: Shield };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {effect.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Policies</h1>
          <p className="text-muted-foreground">
            Configure advanced access control policies with conditions and rules
          </p>
        </div>
        <Button onClick={handleCreatePolicy} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Policy
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.enabled}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Allow Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.allowPolicies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Deny Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.denyPolicies}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Policies List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading policies...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Effect</TableHead>
                    <TableHead>Rules</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{policy.name}</div>
                          {policy.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {policy.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.priority}</Badge>
                      </TableCell>
                      <TableCell>{getEffectBadge(policy.effect)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{policy.rules.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={policy.enabled ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() =>
                            handleTogglePolicy(policy.id, !policy.enabled)
                          }
                        >
                          {policy.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(policy.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditPolicy(policy.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleTogglePolicy(policy.id, !policy.enabled)
                              }
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              {policy.enabled ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setPolicyToDelete(policy)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPolicies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No policies match your search"
                    : "No policies created yet"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AccessPolicyEditor
            policyId={selectedPolicyId}
            onSave={() => {
              setShowEditor(false);
              fetchPolicies();
              fetchStats();
            }}
            onCancel={() => setShowEditor(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!policyToDelete}
        onOpenChange={() => setPolicyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {policyToDelete?.name}? This
              action cannot be undone and may affect existing access controls.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePolicy}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
