"use client";

/**
 * Lithic Enterprise v0.3 - Claims Workqueue
 * Prioritized claim worklist with bulk actions
 */

import { useState } from "react";
import type { WorkqueueItem, WorkqueueType, Priority } from "@/types/billing-enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  CheckSquare,
  Clock,
  Filter,
  Search,
  User,
  DollarSign,
  FileText,
} from "lucide-react";

export default function ClaimsWorkqueue() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - in production, fetch from API
  const workqueueItems: WorkqueueItem[] = [
    {
      id: "1",
      type: "DENIAL_RESOLUTION" as WorkqueueType,
      claimId: "CLM-001",
      patientName: "John Doe",
      patientId: "PAT-001",
      priority: "CRITICAL" as Priority,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignedTo: null,
      status: "NEW",
      amount: 2500,
      agingDays: 5,
      description: "Authorization denial - Appeal deadline in 2 days",
      createdAt: new Date(),
      lastActionAt: new Date(),
      flags: ["APPEAL_DEADLINE"],
    },
    {
      id: "2",
      type: "CODING_REVIEW" as WorkqueueType,
      claimId: "CLM-002",
      patientName: "Jane Smith",
      patientId: "PAT-002",
      priority: "HIGH" as Priority,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assignedTo: "USER-123",
      status: "IN_PROGRESS",
      amount: 1850,
      agingDays: 12,
      description: "Coding validation required before submission",
      createdAt: new Date(),
      lastActionAt: new Date(),
      flags: [],
    },
    {
      id: "3",
      type: "UNDERPAYMENT" as WorkqueueType,
      claimId: "CLM-003",
      patientName: "Bob Johnson",
      patientId: "PAT-003",
      priority: "MEDIUM" as Priority,
      dueDate: null,
      assignedTo: null,
      status: "NEW",
      amount: 750,
      agingDays: 3,
      description: "Underpayment detected - $750 variance",
      createdAt: new Date(),
      lastActionAt: new Date(),
      flags: ["CONTRACT_VARIANCE"],
    },
    {
      id: "4",
      type: "AUTHORIZATION_NEEDED" as WorkqueueType,
      claimId: "CLM-004",
      patientName: "Alice Williams",
      patientId: "PAT-004",
      priority: "HIGH" as Priority,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assignedTo: null,
      status: "NEW",
      amount: 5200,
      agingDays: 1,
      description: "Prior authorization needed - Surgery scheduled tomorrow",
      createdAt: new Date(),
      lastActionAt: new Date(),
      flags: ["URGENT"],
    },
  ];

  const priorityColors = {
    CRITICAL: "bg-red-100 text-red-800 border-red-300",
    HIGH: "bg-orange-100 text-orange-800 border-orange-300",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
    LOW: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const typeIcons = {
    CLAIM_EDIT: FileText,
    DENIAL_RESOLUTION: AlertCircle,
    AUTHORIZATION_NEEDED: CheckSquare,
    CODING_REVIEW: FileText,
    PAYMENT_POSTING: DollarSign,
    UNDERPAYMENT: DollarSign,
    APPEAL: AlertCircle,
    PATIENT_FOLLOW_UP: User,
  };

  const filteredItems = workqueueItems.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterPriority !== "all" && item.priority !== filterPriority) return false;
    if (searchQuery && !item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.claimId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on ${selectedItems.size} items`);
    // In production, would call API
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claims Workqueue</h1>
          <p className="text-gray-600 mt-2">
            Prioritized worklist with {workqueueItems.length} items requiring attention
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name or claim number..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DENIAL_RESOLUTION">Denials</SelectItem>
                <SelectItem value="CODING_REVIEW">Coding Review</SelectItem>
                <SelectItem value="AUTHORIZATION_NEEDED">Authorization</SelectItem>
                <SelectItem value="UNDERPAYMENT">Underpayment</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.size} selected
                </span>
                <Button size="sm" onClick={() => handleBulkAction("assign")}>
                  Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("complete")}
                >
                  Complete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workqueue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Work Items ({filteredItems.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedItems.size === filteredItems.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const TypeIcon = typeIcons[item.type];
              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    item.priority === "CRITICAL"
                      ? "border-l-4 border-l-red-500"
                      : item.priority === "HIGH"
                        ? "border-l-4 border-l-orange-500"
                        : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleSelection(item.id)}
                      className="mt-1"
                    />

                    {/* Icon */}
                    <div className="p-2 bg-gray-100 rounded-full">
                      <TypeIcon className="h-5 w-5 text-gray-600" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {item.patientName}
                            </h3>
                            <Badge
                              className={priorityColors[item.priority]}
                              variant="outline"
                            >
                              {item.priority}
                            </Badge>
                            {item.flags.map((flag) => (
                              <Badge key={flag} variant="outline">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Claim: {item.claimId}</span>
                            <span>•</span>
                            <span>Amount: ${item.amount.toLocaleString()}</span>
                            <span>•</span>
                            <span>{item.agingDays} days old</span>
                            {item.assignedTo && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Assigned
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {item.dueDate && (
                            <div className="flex items-center gap-1 text-sm text-orange-600">
                              <Clock className="h-4 w-4" />
                              Due{" "}
                              {Math.ceil(
                                (new Date(item.dueDate).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )}{" "}
                              days
                            </div>
                          )}
                          <Button size="sm">Work Item</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No items match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Critical</div>
            <div className="text-2xl font-bold text-red-600">
              {workqueueItems.filter((i) => i.priority === "CRITICAL").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">High Priority</div>
            <div className="text-2xl font-bold text-orange-600">
              {workqueueItems.filter((i) => i.priority === "HIGH").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {workqueueItems.filter((i) => i.status === "IN_PROGRESS").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Value</div>
            <div className="text-2xl font-bold text-green-600">
              ${workqueueItems.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
