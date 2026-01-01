"use client";

import { useState } from "react";
import { Organization, OrganizationStatus } from "@/types/enterprise";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Settings,
  Users,
  Plus,
} from "lucide-react";

interface OrganizationTreeProps {
  organizations: Organization[];
  onSelectOrganization?: (org: Organization) => void;
  onEditOrganization?: (org: Organization) => void;
  onAddChild?: (parentOrg: Organization) => void;
}

interface TreeNode {
  organization: Organization;
  children: TreeNode[];
}

export function OrganizationTree({
  organizations,
  onSelectOrganization,
  onEditOrganization,
  onAddChild,
}: OrganizationTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const buildTree = (): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes
    organizations.forEach((org) => {
      nodeMap.set(org.id, { organization: org, children: [] });
    });

    // Build tree structure
    organizations.forEach((org) => {
      const node = nodeMap.get(org.id)!;
      if (org.parentOrganizationId) {
        const parent = nodeMap.get(org.parentOrganizationId);
        if (parent) {
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusColor = (status: OrganizationStatus) => {
    const colors = {
      [OrganizationStatus.ACTIVE]: "bg-green-100 text-green-800",
      [OrganizationStatus.TRIAL]: "bg-blue-100 text-blue-800",
      [OrganizationStatus.SUSPENDED]: "bg-red-100 text-red-800",
      [OrganizationStatus.INACTIVE]: "bg-gray-100 text-gray-800",
      [OrganizationStatus.PENDING_SETUP]: "bg-yellow-100 text-yellow-800",
      [OrganizationStatus.ARCHIVED]: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const renderNode = (node: TreeNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.organization.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.organization.id}>
        <div
          className={`flex items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors ${
            level > 0 ? "ml-6" : ""
          }`}
          style={{ marginLeft: level * 24 }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.organization.id)}
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Organization Icon */}
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-4 w-4 text-primary" />
          </div>

          {/* Organization Info */}
          <div
            className="flex-1 cursor-pointer"
            onClick={() => onSelectOrganization?.(node.organization)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{node.organization.name}</span>
              <Badge className={getStatusColor(node.organization.status)}>
                {node.organization.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>{node.organization.type}</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {node.children.length} sub-orgs
              </span>
              <span>{node.organization.subscription}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            {onAddChild && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.organization);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {onEditOrganization && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditOrganization(node.organization);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  if (tree.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No organizations to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">{tree.map((node) => renderNode(node))}</div>
  );
}
