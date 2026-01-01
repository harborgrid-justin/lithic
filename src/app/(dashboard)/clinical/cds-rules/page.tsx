"use client";

import { useState, useEffect } from "react";
import { CDSRule, RuleCategory, AlertSeverity } from "@/types/cds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CDSRuleEditor } from "@/components/clinical/CDSRuleEditor";
import { Plus, Edit, Trash2, Power, PowerOff, Search } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function CDSRulesPage() {
  const [rules, setRules] = useState<CDSRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<CDSRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [enabledFilter, setEnabledFilter] = useState<string>("ALL");
  const [selectedRule, setSelectedRule] = useState<CDSRule | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    filterRules();
  }, [rules, searchQuery, categoryFilter, severityFilter, enabledFilter]);

  const loadRules = async () => {
    setLoading(true);
    try {
      // In production, load from API
      // const response = await fetch('/api/cds/rules')
      // const data = await response.json()
      // setRules(data.rules)

      // Mock data for now
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const filterRules = () => {
    let filtered = [...rules];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rule) =>
          rule.name.toLowerCase().includes(query) ||
          rule.code.toLowerCase().includes(query) ||
          rule.description.toLowerCase().includes(query),
      );
    }

    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((rule) => rule.category === categoryFilter);
    }

    if (severityFilter !== "ALL") {
      filtered = filtered.filter((rule) => rule.severity === severityFilter);
    }

    if (enabledFilter !== "ALL") {
      const isEnabled = enabledFilter === "ENABLED";
      filtered = filtered.filter((rule) => rule.enabled === isEnabled);
    }

    setFilteredRules(filtered);
  };

  const handleCreate = () => {
    setSelectedRule(null);
    setEditorOpen(true);
  };

  const handleEdit = (rule: CDSRule) => {
    setSelectedRule(rule);
    setEditorOpen(true);
  };

  const handleSave = async (ruleData: Partial<CDSRule>) => {
    try {
      if (selectedRule) {
        // Update existing rule
        const response = await fetch(`/api/cds/rules/${selectedRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ruleData),
        });
        if (response.ok) {
          await loadRules();
          setEditorOpen(false);
        }
      } else {
        // Create new rule
        const response = await fetch("/api/cds/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ruleData),
        });
        if (response.ok) {
          await loadRules();
          setEditorOpen(false);
        }
      }
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  };

  const handleToggleEnabled = async (rule: CDSRule) => {
    try {
      const response = await fetch(`/api/cds/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDelete = async (rule: CDSRule) => {
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/cds/rules/${rule.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return "destructive";
      case AlertSeverity.HIGH:
        return "destructive";
      case AlertSeverity.MODERATE:
        return "warning";
      case AlertSeverity.LOW:
        return "secondary";
      case AlertSeverity.INFO:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Clinical Decision Support Rules
          </h1>
          <p className="text-gray-500 mt-1">
            Manage CDS rules and clinical guidelines
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.values(RuleCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severities</SelectItem>
                {Object.values(AlertSeverity).map((sev) => (
                  <SelectItem key={sev} value={sev}>
                    {sev}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={enabledFilter} onValueChange={setEnabledFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ENABLED">Enabled</SelectItem>
                <SelectItem value="DISABLED">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules ({filteredRules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading rules...</div>
          ) : filteredRules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No rules found</p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {rule.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.category.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      {rule.enabled ? (
                        <Badge variant="default">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(rule.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleEnabled(rule)}
                        >
                          {rule.enabled ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(rule)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? "Edit Rule" : "Create New Rule"}
            </DialogTitle>
          </DialogHeader>
          <CDSRuleEditor rule={selectedRule || undefined} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
