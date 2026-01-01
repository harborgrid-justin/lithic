/**
 * Role Builder Component
 * Lithic v0.2 - Advanced RBAC System
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, X } from "lucide-react";
import toast from "react-hot-toast";

interface Permission {
  resource: string;
  action: string;
  scope: string;
  conditions?: any;
}

interface RoleBuilderProps {
  roleId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const RESOURCES = [
  "patient",
  "patient.demographics",
  "patient.insurance",
  "clinical.notes",
  "clinical.orders",
  "appointments",
  "billing.claims",
  "billing.payments",
  "lab.orders",
  "lab.results",
  "imaging.orders",
  "imaging.studies",
  "pharmacy.prescriptions",
  "admin.users",
  "admin.roles",
];

const ACTIONS = ["read", "create", "update", "delete", "execute", "admin", "*"];

const SCOPES = ["ALL", "ORGANIZATION", "DEPARTMENT", "LOCATION", "OWN"];

export default function RoleBuilder({
  roleId,
  onSave,
  onCancel,
}: RoleBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentRoleId, setParentRoleId] = useState<string>("");
  const [inheritPermissions, setInheritPermissions] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  useEffect(() => {
    fetchAvailableRoles();
    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch("/api/rbac/roles");
      const data = await response.json();

      if (data.success) {
        setAvailableRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchRole = async () => {
    if (!roleId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rbac/roles/${roleId}`);
      const data = await response.json();

      if (data.success) {
        setName(data.role.name);
        setDescription(data.role.description || "");
        setParentRoleId(data.role.parentRoleId || "");
        setInheritPermissions(data.role.inheritPermissions ?? true);
        setPermissions(data.role.permissions || []);
      } else {
        toast.error("Failed to load role");
      }
    } catch (error) {
      toast.error("Failed to load role");
    } finally {
      setLoading(false);
    }
  };

  const addPermission = () => {
    setPermissions([
      ...permissions,
      {
        resource: "patient",
        action: "read",
        scope: "ORGANIZATION",
      },
    ]);
  };

  const updatePermission = (
    index: number,
    field: keyof Permission,
    value: any,
  ) => {
    const updated = [...permissions];
    updated[index] = { ...updated[index], [field]: value };
    setPermissions(updated);
  };

  const removePermission = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (permissions.length === 0) {
      toast.error("At least one permission is required");
      return;
    }

    setSaving(true);
    try {
      const url = roleId ? `/api/rbac/roles/${roleId}` : "/api/rbac/roles";
      const method = roleId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          parentRoleId: parentRoleId || null,
          inheritPermissions,
          permissions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          roleId ? "Role updated successfully" : "Role created successfully",
        );
        onSave?.();
      } else {
        toast.error(data.error || "Failed to save role");
      }
    } catch (error) {
      toast.error("Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading role...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{roleId ? "Edit Role" : "Create New Role"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Senior Physician"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role and its responsibilities"
              rows={3}
            />
          </div>
        </div>

        <Separator />

        {/* Hierarchy */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Role Hierarchy</h3>

          <div>
            <Label htmlFor="parentRole">Parent Role (Optional)</Label>
            <Select value={parentRoleId} onValueChange={setParentRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {availableRoles
                  .filter((r) => r.id !== roleId)
                  .map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} (Level {role.level})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Child roles can inherit permissions from their parent
            </p>
          </div>

          {parentRoleId && (
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <Label htmlFor="inheritPermissions">Inherit Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically include all parent role permissions
                </p>
              </div>
              <Switch
                id="inheritPermissions"
                checked={inheritPermissions}
                onCheckedChange={setInheritPermissions}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Permissions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Permissions</h3>
            <Button onClick={addPermission} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Permission
            </Button>
          </div>

          <div className="space-y-3">
            {permissions.map((perm, index) => (
              <div key={index} className="p-4 border rounded space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline">Permission {index + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePermission(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Resource</Label>
                    <Select
                      value={perm.resource}
                      onValueChange={(value) =>
                        updatePermission(index, "resource", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCES.map((resource) => (
                          <SelectItem key={resource} value={resource}>
                            {resource}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Action</Label>
                    <Select
                      value={perm.action}
                      onValueChange={(value) =>
                        updatePermission(index, "action", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIONS.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Scope</Label>
                    <Select
                      value={perm.scope}
                      onValueChange={(value) =>
                        updatePermission(index, "scope", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCOPES.map((scope) => (
                          <SelectItem key={scope} value={scope}>
                            {scope}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            {permissions.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded">
                <p className="text-muted-foreground">
                  No permissions added yet. Click &quot;Add Permission&quot; to
                  get started.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Role"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
