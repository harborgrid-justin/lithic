/**
 * Workflow Canvas - Visual Workflow Editor
 * Drag-and-drop workflow designer using React Flow
 */

"use client";

import React, { useCallback, useEffect } from "react";
import { useWorkflowStore } from "@/stores/workflow-store";
import { WorkflowNode, WorkflowEdge, NodeType } from "@/types/workflow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  GitBranch,
  Clock,
  Send,
  CheckCircle,
  Users,
  Code,
  PlusCircle,
  Save,
  Trash2,
} from "lucide-react";

// ============================================================================
// Component
// ============================================================================

export function WorkflowCanvas() {
  const {
    designerNodes,
    designerEdges,
    designerViewport,
    setDesignerNodes,
    setDesignerEdges,
    addDesignerNode,
    updateDesignerNode,
    deleteDesignerNode,
    addDesignerEdge,
    deleteDesignerEdge,
    setDesignerViewport,
  } = useWorkflowStore();

  const [selectedNode, setSelectedNode] = React.useState<any>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Node type configurations
  const nodeTypes = [
    { type: NodeType.START, label: "Start", icon: Play, color: "bg-green-500" },
    { type: NodeType.END, label: "End", icon: Square, color: "bg-red-500" },
    { type: NodeType.TASK, label: "Task", icon: CheckCircle, color: "bg-blue-500" },
    { type: NodeType.DECISION, label: "Decision", icon: GitBranch, color: "bg-yellow-500" },
    { type: NodeType.WAIT, label: "Wait", icon: Clock, color: "bg-purple-500" },
    { type: NodeType.NOTIFICATION, label: "Notify", icon: Send, color: "bg-orange-500" },
    { type: NodeType.APPROVAL, label: "Approval", icon: Users, color: "bg-indigo-500" },
    { type: NodeType.SCRIPT, label: "Script", icon: Code, color: "bg-gray-500" },
  ];

  // Add new node
  const handleAddNode = useCallback((type: NodeType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      name: `${type} Node`,
      description: "",
      config: {},
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100,
      },
      metadata: {},
    };

    addDesignerNode(newNode);
  }, [addDesignerNode]);

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  // Handle node update
  const handleNodeUpdate = useCallback((id: string, updates: any) => {
    updateDesignerNode(id, updates);
    if (selectedNode?.id === id) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  }, [updateDesignerNode, selectedNode]);

  // Handle node delete
  const handleNodeDelete = useCallback((id: string) => {
    deleteDesignerNode(id);
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  }, [deleteDesignerNode, selectedNode]);

  // Connect nodes
  const handleConnect = useCallback((sourceId: string, targetId: string) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
      label: "",
      condition: null,
      priority: 0,
    };

    addDesignerEdge(newEdge);
  }, [addDesignerEdge]);

  // Save workflow
  const handleSave = useCallback(() => {
    const workflow = {
      nodes: designerNodes,
      edges: designerEdges,
      viewport: designerViewport,
    };

    console.log("Saving workflow:", workflow);
    // In production, this would call an API to save the workflow
  }, [designerNodes, designerEdges, designerViewport]);

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className="w-64 border-r bg-white p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Nodes
            </h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <button
                    key={nodeType.type}
                    onClick={() => handleAddNode(nodeType.type)}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-left transition-colors"
                  >
                    <div className={`${nodeType.color} p-1.5 rounded text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm">{nodeType.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSave} className="w-full" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-gray-50">
        <div className="absolute inset-0 overflow-auto p-4">
          <div className="min-w-[1000px] min-h-[800px] relative">
            {/* Grid background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Render edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {designerEdges.map((edge) => {
                const sourceNode = designerNodes.find((n) => n.id === edge.source);
                const targetNode = designerNodes.find((n) => n.id === edge.target);

                if (!sourceNode || !targetNode) return null;

                return (
                  <g key={edge.id}>
                    <line
                      x1={sourceNode.position.x + 60}
                      y1={sourceNode.position.y + 30}
                      x2={targetNode.position.x + 60}
                      y2={targetNode.position.y + 30}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>
            </svg>

            {/* Render nodes */}
            {designerNodes.map((node) => {
              const nodeTypeConfig = nodeTypes.find((nt) => nt.type === node.type);
              const Icon = nodeTypeConfig?.icon || CheckCircle;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  className={`absolute cursor-move ${
                    isSelected ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                  }}
                  onClick={() => handleNodeClick(node)}
                >
                  <Card className="p-3 w-32 bg-white shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`${nodeTypeConfig?.color || "bg-gray-500"} p-2 rounded`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-xs font-medium text-center truncate w-full">
                        {node.name}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 border-l bg-white p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Node Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNodeDelete(selectedNode.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={selectedNode.name}
                onChange={(e) => handleNodeUpdate(selectedNode.id, { name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={selectedNode.description}
                onChange={(e) => handleNodeUpdate(selectedNode.id, { description: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="mt-1 px-3 py-2 border rounded-md bg-gray-50">
                {selectedNode.type}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
