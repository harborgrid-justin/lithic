/**
 * Workflow Designer Page
 * Visual workflow builder with drag-and-drop interface
 */

"use client";

import React from "react";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { useWorkflowStore } from "@/stores/workflow-store";
import { Button } from "@/components/ui/button";
import { Card as _Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowCategory, WorkflowStatus, WorkflowTriggerType } from "@/types/workflow";
import { Save, Play, Settings as _Settings, FileText as _FileText } from "lucide-react";

export default function WorkflowDesignerPage() {
  const {
    selectedWorkflow,
    setSelectedWorkflow: _setSelectedWorkflow,
    designerNodes,
    designerEdges,
    clearDesigner: _clearDesigner,
  } = useWorkflowStore();

  const [workflowName, setWorkflowName] = React.useState(
    selectedWorkflow?.name || "New Workflow"
  );
  const [workflowDescription, setWorkflowDescription] = React.useState(
    selectedWorkflow?.description || ""
  );
  const [workflowCategory, setWorkflowCategory] = React.useState<WorkflowCategory>(
    selectedWorkflow?.category || WorkflowCategory.CUSTOM
  );
  const [triggerType, setTriggerType] = React.useState<WorkflowTriggerType>(
    selectedWorkflow?.trigger.type || WorkflowTriggerType.MANUAL
  );

  const handleSave = async () => {
    const workflow = {
      id: selectedWorkflow?.id || `wf-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      version: selectedWorkflow?.version || 1,
      status: WorkflowStatus.DRAFT,
      trigger: {
        type: triggerType,
        config: {},
      },
      nodes: designerNodes,
      edges: designerEdges,
      variables: [],
      timeout: null,
      retryPolicy: null,
      tags: [],
      isTemplate: false,
      parentTemplateId: null,
      metadata: {},
      organizationId: "default",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: "current-user",
      updatedBy: "current-user",
    };

    console.log("Saving workflow:", workflow);
    // In production, this would save to the database via API
    alert("Workflow saved successfully!");
  };

  const handleTest = () => {
    console.log("Testing workflow with nodes:", designerNodes);
    alert("Workflow test started. Check console for details.");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflow Designer</h1>
            <p className="text-sm text-gray-600 mt-1">
              Design and configure automated workflows
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTest}>
              <Play className="h-4 w-4 mr-2" />
              Test Workflow
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="border-b bg-gray-50 px-6 py-3">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="workflow-name" className="text-xs">
              Workflow Name
            </Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="mt-1"
              placeholder="Enter workflow name"
            />
          </div>
          <div>
            <Label htmlFor="workflow-category" className="text-xs">
              Category
            </Label>
            <Select
              value={workflowCategory}
              onValueChange={(value) => setWorkflowCategory(value as WorkflowCategory)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(WorkflowCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="trigger-type" className="text-xs">
              Trigger Type
            </Label>
            <Select
              value={triggerType}
              onValueChange={(value) => setTriggerType(value as WorkflowTriggerType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(WorkflowTriggerType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="workflow-description" className="text-xs">
              Description
            </Label>
            <Input
              id="workflow-description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="mt-1"
              placeholder="Enter description"
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas />
      </div>

      {/* Stats Bar */}
      <div className="border-t bg-white px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex gap-4">
            <span>Nodes: {designerNodes.length}</span>
            <span>Connections: {designerEdges.length}</span>
            <span>
              Status:{" "}
              {selectedWorkflow ? selectedWorkflow.status : WorkflowStatus.DRAFT}
            </span>
          </div>
          <div>
            Last saved: {selectedWorkflow ? "Just now" : "Never"}
          </div>
        </div>
      </div>
    </div>
  );
}
