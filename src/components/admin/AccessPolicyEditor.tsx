/**
 * Access Policy Editor Component
 * Lithic v0.2 - Advanced RBAC System
 */

"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, Save, X, TestTube } from "lucide-react";
import toast from "react-hot-toast";

interface PolicyRule {
  resource: string;
  actions: string[];
  effect: string;
  conditions?: any;
  priority: number;
}

interface AccessPolicyEditorProps {
  policyId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const POLICY_EFFECTS = [
  { value: "ALLOW", label: "Allow", color: "text-green-600" },
  { value: "DENY", label: "Deny", color: "text-red-600" },
  { value: "REQUIRE_MFA", label: "Require MFA", color: "text-blue-600" },
  {
    value: "REQUIRE_APPROVAL",
    label: "Require Approval",
    color: "text-yellow-600",
  },
  { value: "AUDIT_ONLY", label: "Audit Only", color: "text-gray-600" },
];

export default function AccessPolicyEditor({
  policyId,
  onSave,
  onCancel,
}: AccessPolicyEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(100);
  const [enabled, setEnabled] = useState(true);
  const [effect, setEffect] = useState<string>("ALLOW");
  const [rules, setRules] = useState<PolicyRule[]>([]);

  useEffect(() => {
    if (policyId) {
      fetchPolicy();
    }
  }, [policyId]);

  const fetchPolicy = async () => {
    if (!policyId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rbac/policies/${policyId}`);
      const data = await response.json();

      if (data.success) {
        setName(data.policy.name);
        setDescription(data.policy.description || "");
        setPriority(data.policy.priority);
        setEnabled(data.policy.enabled);
        setEffect(data.policy.effect);
        setRules(data.policy.rules || []);
      } else {
        toast.error("Failed to load policy");
      }
    } catch (error) {
      toast.error("Failed to load policy");
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setRules([
      ...rules,
      {
        resource: "patient",
        actions: ["read"],
        effect: effect,
        priority: rules.length + 1,
      },
    ]);
  };

  const updateRule = (index: number, field: keyof PolicyRule, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const testPolicy = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/rbac/test-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules,
          effect,
          testScenarios: [
            { resource: "patient", action: "read" },
            { resource: "patient", action: "write" },
          ],
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Policy test completed. ${data.passedTests}/${data.totalTests} scenarios passed.`,
        );
      } else {
        toast.error("Policy test failed");
      }
    } catch (error) {
      toast.error("Failed to test policy");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Policy name is required");
      return;
    }

    if (rules.length === 0) {
      toast.error("At least one rule is required");
      return;
    }

    setSaving(true);
    try {
      const url = policyId
        ? `/api/rbac/policies/${policyId}`
        : "/api/rbac/policies";
      const method = policyId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          priority,
          enabled,
          effect,
          rules,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          policyId
            ? "Policy updated successfully"
            : "Policy created successfully",
        );
        onSave?.();
      } else {
        toast.error(data.error || "Failed to save policy");
      }
    } catch (error) {
      toast.error("Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading policy...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{policyId ? "Edit Policy" : "Create New Policy"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Policy Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., After Hours Access Policy"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when and how this policy should be applied"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower numbers = higher priority
              </p>
            </div>

            <div>
              <Label htmlFor="effect">Default Effect</Label>
              <Select value={effect} onValueChange={setEffect}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_EFFECTS.map((eff) => (
                    <SelectItem key={eff.value} value={eff.value}>
                      <span className={eff.color}>{eff.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Policy Rules</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={testPolicy}
                disabled={testing || rules.length === 0}
                size="sm"
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
                Test Policy
              </Button>
              <Button onClick={addRule} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div key={index} className="p-4 border rounded space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Rule {index + 1}</Badge>
                    <Badge
                      variant={
                        rule.effect === "ALLOW"
                          ? "default"
                          : rule.effect === "DENY"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {rule.effect}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Resource Pattern</Label>
                    <Input
                      value={rule.resource}
                      onChange={(e) =>
                        updateRule(index, "resource", e.target.value)
                      }
                      placeholder="e.g., patient.* or specific resource"
                    />
                  </div>

                  <div>
                    <Label>Actions (comma-separated)</Label>
                    <Input
                      value={rule.actions.join(", ")}
                      onChange={(e) =>
                        updateRule(
                          index,
                          "actions",
                          e.target.value.split(",").map((a) => a.trim()),
                        )
                      }
                      placeholder="e.g., read, write, delete"
                    />
                  </div>
                </div>

                <div>
                  <Label>Conditions (JSON)</Label>
                  <Textarea
                    value={
                      rule.conditions
                        ? JSON.stringify(rule.conditions, null, 2)
                        : ""
                    }
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateRule(index, "conditions", parsed);
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='{"timeRestrictions": [], "ipRestrictions": []}'
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded">
                <p className="text-muted-foreground">
                  No rules added yet. Click &quot;Add Rule&quot; to get started.
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
            {saving ? "Saving..." : "Save Policy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
