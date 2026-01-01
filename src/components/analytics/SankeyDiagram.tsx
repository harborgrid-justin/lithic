"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SankeyNode {
  id: string;
  label: string;
  level: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

export interface SankeyDiagramProps {
  title?: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
  className?: string;
}

export function SankeyDiagram({
  title,
  nodes,
  links,
  height = 400,
  className,
}: SankeyDiagramProps) {
  // Calculate node positions and widths
  const levels = Math.max(...nodes.map((n) => n.level)) + 1;
  const nodesByLevel = new Map<number, SankeyNode[]>();

  nodes.forEach((node) => {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  });

  // Calculate node values (sum of incoming/outgoing links)
  const nodeValues = new Map<string, number>();
  links.forEach((link) => {
    nodeValues.set(
      link.source,
      (nodeValues.get(link.source) || 0) + link.value
    );
    nodeValues.set(
      link.target,
      (nodeValues.get(link.target) || 0) + link.value
    );
  });

  const maxNodeValue = Math.max(...Array.from(nodeValues.values()));

  // Layout constants
  const nodeWidth = 40;
  const levelWidth = 100 / levels;
  const padding = 20;

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="relative w-full" style={{ height: `${height}px` }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="link-gradient"
                gradientUnits="userSpaceOnUse"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Render links */}
            {links.map((link, index) => {
              const sourceNode = nodes.find((n) => n.id === link.source);
              const targetNode = nodes.find((n) => n.id === link.target);

              if (!sourceNode || !targetNode) return null;

              const sourceLevel = nodesByLevel.get(sourceNode.level) || [];
              const targetLevel = nodesByLevel.get(targetNode.level) || [];

              const sourceIndex = sourceLevel.indexOf(sourceNode);
              const targetIndex = targetLevel.indexOf(targetNode);

              const sourceX = sourceNode.level * levelWidth + nodeWidth / 2;
              const targetX = targetNode.level * levelWidth + nodeWidth / 2;

              const sourceY =
                ((sourceIndex + 0.5) / sourceLevel.length) * (height - padding * 2) +
                padding;
              const targetY =
                ((targetIndex + 0.5) / targetLevel.length) * (height - padding * 2) +
                padding;

              const linkWidth = (link.value / maxNodeValue) * 20;

              return (
                <path
                  key={index}
                  d={`
                    M ${sourceX} ${sourceY - linkWidth / 2}
                    C ${(sourceX + targetX) / 2} ${sourceY - linkWidth / 2},
                      ${(sourceX + targetX) / 2} ${targetY - linkWidth / 2},
                      ${targetX} ${targetY - linkWidth / 2}
                    L ${targetX} ${targetY + linkWidth / 2}
                    C ${(sourceX + targetX) / 2} ${targetY + linkWidth / 2},
                      ${(sourceX + targetX) / 2} ${sourceY + linkWidth / 2},
                      ${sourceX} ${sourceY + linkWidth / 2}
                    Z
                  `}
                  fill={link.color || "url(#link-gradient)"}
                  opacity="0.6"
                  className="transition-opacity hover:opacity-100"
                >
                  <title>
                    {sourceNode.label} → {targetNode.label}: {link.value.toLocaleString()}
                  </title>
                </path>
              );
            })}

            {/* Render nodes */}
            {Array.from(nodesByLevel.entries()).map(([level, levelNodes]) =>
              levelNodes.map((node, index) => {
                const x = level * levelWidth;
                const y =
                  ((index + 0.5) / levelNodes.length) * (height - padding * 2) +
                  padding;
                const nodeHeight =
                  ((nodeValues.get(node.id) || 0) / maxNodeValue) * 60;

                return (
                  <g key={node.id}>
                    <rect
                      x={x}
                      y={y - nodeHeight / 2}
                      width={nodeWidth}
                      height={nodeHeight}
                      fill="rgb(59, 130, 246)"
                      rx="4"
                      className="transition-all hover:fill-blue-600"
                    >
                      <title>
                        {node.label}: {(nodeValues.get(node.id) || 0).toLocaleString()}
                      </title>
                    </rect>
                  </g>
                );
              })
            )}
          </svg>

          {/* Node labels */}
          {Array.from(nodesByLevel.entries()).map(([level, levelNodes]) =>
            levelNodes.map((node, index) => {
              const x = (level * levelWidth * window.innerWidth) / 100;
              const y =
                ((index + 0.5) / levelNodes.length) * (height - padding * 2) +
                padding;

              return (
                <div
                  key={`label-${node.id}`}
                  className="absolute text-xs font-medium whitespace-nowrap"
                  style={{
                    left: `${level * levelWidth}%`,
                    top: `${y}px`,
                    transform: "translateY(-50%)",
                  }}
                >
                  <div className="ml-12">
                    {node.label}
                    <div className="text-muted-foreground">
                      {(nodeValues.get(node.id) || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
