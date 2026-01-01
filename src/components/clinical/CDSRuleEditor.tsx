"use client";

import { useState } from "react";
import {
  CDSRule,
  RuleCategory,
  AlertSeverity,
  EvidenceLevel,
  RuleCondition,
  RuleAction,
  ConditionType,
  ConditionOperator,
  ActionType,
} from "@/types/cds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, TestTube } from "lucide-react";

interface CDSRuleEditorProps {
  rule?: CDSRule;
  onSave: (rule: Partial<CDSRule>) => Promise<void>;
  onTest?: (rule: Partial<CDSRule>) => Promise<void>;
}

export function CDSRuleEditor({ rule, onSave, onTest }: CDSRuleEditorProps) {
  const [formData, setFormData] = useState<Partial<CDSRule>>(
    rule || {
      name: "",
      code: "",
      category: RuleCategory.CLINICAL_GUIDELINE,
      description: "",
      rationale: "",
      enabled: true,
      priority: 1,
      severity: AlertSeverity.MODERATE,
      conditions: [],
      actions: [],
      evidenceLevel: EvidenceLevel.C,
      references: [],
      version: "1.0",
    },
  );

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    setLoading(true);
    try {
      await onTest(formData);
    } finally {
      setLoading(false);
    }
  };

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: `condition-${Date.now()}`,
      type: ConditionType.PATIENT_AGE,
      field: "",
      operator: ConditionOperator.GREATER_THAN,
      value: "",
      valueType: "number",
    };
    setFormData({
      ...formData,
      conditions: [...(formData.conditions || []), newCondition],
    });
  };

  const removeCondition = (id: string) => {
    setFormData({
      ...formData,
      conditions: formData.conditions?.filter((c) => c.id !== id),
    });
  };

  const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
    setFormData({
      ...formData,
      conditions: formData.conditions?.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    });
  };

  const addAction = () => {
    const newAction: RuleAction = {
      id: `action-${Date.now()}`,
      type: ActionType.ALERT,
      message: "",
      recommendation: null,
      alternatives: null,
      requiresOverride: false,
      overrideReasons: null,
      notifyProvider: false,
      escalate: false,
      escalationLevel: null,
    };
    setFormData({
      ...formData,
      actions: [...(formData.actions || []), newAction],
    });
  };

  const removeAction = (id: string) => {
    setFormData({
      ...formData,
      actions: formData.actions?.filter((a) => a.id !== id),
    });
  };

  const updateAction = (id: string, updates: Partial<RuleAction>) => {
    setFormData({
      ...formData,
      actions: formData.actions?.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rule Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="code">Rule Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as RuleCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RuleCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  setFormData({ ...formData, severity: value as AlertSeverity })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AlertSeverity).map((sev) => (
                    <SelectItem key={sev} value={sev}>
                      {sev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="rationale">Clinical Rationale *</Label>
            <Textarea
              id="rationale"
              value={formData.rationale}
              onChange={(e) =>
                setFormData({ ...formData, rationale: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="evidenceLevel">Evidence Level</Label>
              <Select
                value={formData.evidenceLevel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    evidenceLevel: value as EvidenceLevel,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EvidenceLevel).map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conditions</CardTitle>
            <Button type="button" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-1" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.conditions && formData.conditions.length > 0 ? (
            formData.conditions.map((condition, idx) => (
              <div key={condition.id} className="border p-4 rounded space-y-3">
                <div className="flex items-center justify-between">
                  <Badge>Condition {idx + 1}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCondition(condition.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Condition Type</Label>
                    <Select
                      value={condition.type}
                      onValueChange={(value) =>
                        updateCondition(condition.id, {
                          type: value as ConditionType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ConditionType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        updateCondition(condition.id, {
                          operator: value as ConditionOperator,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ConditionOperator).map((op) => (
                          <SelectItem key={op} value={op}>
                            {op.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Value</Label>
                    <Input
                      value={condition.value}
                      onChange={(e) =>
                        updateCondition(condition.id, { value: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              No conditions added yet
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actions</CardTitle>
            <Button type="button" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.actions && formData.actions.length > 0 ? (
            formData.actions.map((action, idx) => (
              <div key={action.id} className="border p-4 rounded space-y-3">
                <div className="flex items-center justify-between">
                  <Badge>Action {idx + 1}</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAction(action.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label>Action Type</Label>
                  <Select
                    value={action.type}
                    onValueChange={(value) =>
                      updateAction(action.id, { type: value as ActionType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ActionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Message *</Label>
                  <Textarea
                    value={action.message}
                    onChange={(e) =>
                      updateAction(action.id, { message: e.target.value })
                    }
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <Label>Recommendation</Label>
                  <Textarea
                    value={action.recommendation || ""}
                    onChange={(e) =>
                      updateAction(action.id, {
                        recommendation: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={action.requiresOverride}
                      onCheckedChange={(checked) =>
                        updateAction(action.id, { requiresOverride: checked })
                      }
                    />
                    <Label>Requires Override</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={action.notifyProvider}
                      onCheckedChange={(checked) =>
                        updateAction(action.id, { notifyProvider: checked })
                      }
                    />
                    <Label>Notify Provider</Label>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              No actions added yet
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Rule"}
        </Button>
        {onTest && (
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={loading}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test Rule
          </Button>
        )}
      </div>
    </form>
  );
}
