/**
 * Enhanced Permission Matrix Component
 * Lithic v0.2 - Advanced RBAC System
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Search,
  Filter,
  Edit,
  Save,
  Download,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  userCount: number;
  permissions: Permission[];
  parentRoleName?: string;
}

interface Permission {
  resource: string;
  action: string;
  scope: string;
  inherited?: boolean;
}

export default function PermissionMatrix() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [changes, setChanges] = useState<Map<string, Set<string>>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScope, setFilterScope] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    fetchMatrix();
    fetchConflicts();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rbac/permission-matrix");
      const data = await response.json();

      if (data.success) {
        setRoles(data.roles || []);
        setResources(data.resources || []);
        setActions(data.actions || []);
      } else {
        toast.error(data.error || "Failed to fetch permission matrix");
      }
    } catch (error) {
      toast.error("Failed to fetch permission matrix");
    } finally {
      setLoading(false);
    }
  };

  const fetchConflicts = async () => {
    try {
      const response = await fetch("/api/rbac/role-conflicts");
      const data = await response.json();

      if (data.success) {
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error("Failed to fetch conflicts:", error);
    }
  };

  const hasPermission = (
    role: Role,
    resource: string,
    action: string,
  ): { has: boolean; inherited: boolean } => {
    const perm = role.permissions?.find(
      (p) =>
        (p.resource === resource || p.resource === "*") &&
        (p.action === action || p.action === "*" || p.action === "admin"),
    );

    return {
      has: !!perm,
      inherited: perm?.inherited || false,
    };
  };

  const togglePermission = (
    roleId: string,
    resource: string,
    action: string,
  ) => {
    if (!editMode) return;

    const key = `${roleId}:${resource}:${action}`;
    const newChanges = new Map(changes);

    if (newChanges.has(roleId)) {
      const roleChanges = newChanges.get(roleId)!;
      if (roleChanges.has(key)) {
        roleChanges.delete(key);
      } else {
        roleChanges.add(key);
      }
    } else {
      newChanges.set(roleId, new Set([key]));
    }

    setChanges(newChanges);
  };

  const saveChanges = async () => {
    try {
      const updates = Array.from(changes.entries()).map(([roleId, perms]) => ({
        roleId,
        changes: Array.from(perms).map((key) => {
          const [, resource, action] = key.split(":");
          return { resource, action };
        }),
      }));

      const response = await fetch("/api/rbac/update-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Permissions updated successfully");
        setEditMode(false);
        setChanges(new Map());
        fetchMatrix();
      } else {
        toast.error(data.error || "Failed to update permissions");
      }
    } catch (error) {
      toast.error("Failed to update permissions");
    }
  };

  const exportMatrix = async () => {
    try {
      const response = await fetch("/api/rbac/export-matrix");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `permission-matrix-${new Date().toISOString()}.csv`;
      a.click();
      toast.success("Permission matrix exported");
    } catch (error) {
      toast.error("Failed to export matrix");
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredResources =
    filterScope === "all"
      ? resources
      : resources.filter((r) => r.startsWith(filterScope));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading permission matrix...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permission Matrix</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage role-based permissions across your organization
              </p>
            </div>
            <div className="flex gap-2">
              {conflicts.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowConflicts(true)}
                  className="gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  {conflicts.length} Conflicts
                </Button>
              )}
              <Button
                variant="outline"
                onClick={exportMatrix}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              {editMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setChanges(new Map());
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveChanges} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="lab">Laboratory</SelectItem>
                <SelectItem value="imaging">Imaging</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="admin">Administration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Granted</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              <span>Inherited</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-gray-300" />
              <span>Denied</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10">
                    Role
                  </TableHead>
                  <TableHead className="text-center">Level</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  {filteredResources.slice(0, 10).map((resource) => (
                    <TableHead
                      key={resource}
                      className="text-center min-w-[100px]"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{resource}</span>
                        <span className="text-xs text-muted-foreground">
                          read/write
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedRole(role)}
                  >
                    <TableCell className="sticky left-0 bg-white z-10">
                      <div>
                        <div className="font-medium">{role.name}</div>
                        {role.parentRoleName && (
                          <div className="text-xs text-muted-foreground">
                            Inherits from {role.parentRoleName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{role.level}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{role.userCount}</Badge>
                    </TableCell>
                    {filteredResources.slice(0, 10).map((resource) => {
                      const readPerm = hasPermission(role, resource, "read");
                      const writePerm = hasPermission(role, resource, "write");

                      return (
                        <TableCell key={resource} className="text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePermission(role.id, resource, "read");
                              }}
                              disabled={!editMode}
                              className={`${
                                !editMode ? "cursor-default" : "cursor-pointer"
                              }`}
                            >
                              {readPerm.has ? (
                                <Check
                                  className={`h-4 w-4 ${
                                    readPerm.inherited
                                      ? "text-blue-600"
                                      : "text-green-600"
                                  }`}
                                />
                              ) : (
                                <X className="h-4 w-4 text-gray-300" />
                              )}
                            </button>
                            <span className="text-muted-foreground">/</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePermission(role.id, resource, "write");
                              }}
                              disabled={!editMode}
                              className={`${
                                !editMode ? "cursor-default" : "cursor-pointer"
                              }`}
                            >
                              {writePerm.has ? (
                                <Check
                                  className={`h-4 w-4 ${
                                    writePerm.inherited
                                      ? "text-blue-600"
                                      : "text-green-600"
                                  }`}
                                />
                              ) : (
                                <X className="h-4 w-4 text-gray-300" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No roles match your search
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Details Dialog */}
      {selectedRole && (
        <Dialog
          open={!!selectedRole}
          onOpenChange={() => setSelectedRole(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRole.name}</DialogTitle>
              <DialogDescription>{selectedRole.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hierarchy Level</Label>
                  <p className="text-sm">{selectedRole.level}</p>
                </div>
                <div>
                  <Label>Active Users</Label>
                  <p className="text-sm">{selectedRole.userCount}</p>
                </div>
                {selectedRole.parentRoleName && (
                  <div>
                    <Label>Parent Role</Label>
                    <p className="text-sm">{selectedRole.parentRoleName}</p>
                  </div>
                )}
              </div>
              <div>
                <Label>Permissions ({selectedRole.permissions.length})</Label>
                <div className="mt-2 max-h-[300px] overflow-y-auto space-y-1">
                  {selectedRole.permissions.map((perm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm p-2 rounded border"
                    >
                      <span>
                        {perm.resource} - {perm.action}
                      </span>
                      <div className="flex gap-2">
                        <Badge variant="outline">{perm.scope}</Badge>
                        {perm.inherited && (
                          <Badge variant="secondary">Inherited</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRole(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Conflicts Dialog */}
      <Dialog open={showConflicts} onOpenChange={setShowConflicts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role Conflicts</DialogTitle>
            <DialogDescription>
              Detected conflicts in role hierarchy and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="p-3 border rounded space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{conflict.conflictType}</span>
                  <Badge
                    variant={
                      conflict.severity === "CRITICAL"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {conflict.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {conflict.description}
                </p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflicts(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
