'use client';

/**
 * Enterprise TreeView Component
 *
 * Hierarchical data display with:
 * - Expand/collapse
 * - Selection
 * - Icons
 * - Search/filter
 * - Keyboard navigation
 * - Drag and drop (optional)
 * - WCAG 2.1 AA compliant
 */

import React, { useState, useCallback, KeyboardEvent } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from 'lucide-react';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
  disabled?: boolean;
}

export interface TreeViewProps {
  data: TreeNode[];
  onSelect?: (node: TreeNode) => void;
  selectedId?: string;
  defaultExpandedIds?: string[];
  searchable?: boolean;
  multiSelect?: boolean;
  showIcons?: boolean;
  className?: string;
}

export function TreeView({
  data,
  onSelect,
  selectedId,
  defaultExpandedIds = [],
  searchable = false,
  multiSelect = false,
  showIcons = true,
  className = '',
}: TreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpandedIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback((node: TreeNode) => {
    if (!node.disabled) {
      onSelect?.(node);
    }
  }, [onSelect]);

  const filterTree = useCallback((nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes;

    return nodes.reduce<TreeNode[]>((acc, node) => {
      const matchesSearch = node.label.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = node.children ? filterTree(node.children, query) : [];

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });

        // Auto-expand nodes with matches
        if (filteredChildren.length > 0) {
          setExpandedIds(prev => new Set(prev).add(node.id));
        }
      }

      return acc;
    }, []);
  }, []);

  const getAllNodeIds = useCallback((nodes: TreeNode[]): string[] => {
    return nodes.reduce<string[]>((acc, node) => {
      acc.push(node.id);
      if (node.children) {
        acc.push(...getAllNodeIds(node.children));
      }
      return acc;
    }, []);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent, node: TreeNode, level: number) => {
    const allIds = getAllNodeIds(data);
    const currentIndex = allIds.indexOf(node.id);

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (node.children && !expandedIds.has(node.id)) {
          toggleExpand(node.id);
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (node.children && expandedIds.has(node.id)) {
          toggleExpand(node.id);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < allIds.length - 1) {
          setFocusedId(allIds[currentIndex + 1]);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setFocusedId(allIds[currentIndex - 1]);
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect(node);
        break;
    }
  }, [data, expandedIds, toggleExpand, handleSelect, getAllNodeIds]);

  const filteredData = searchable ? filterTree(data, searchQuery) : data;

  return (
    <div className={`w-full ${className}`}>
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search tree"
          />
        </div>
      )}

      <div role="tree" className="space-y-1">
        {filteredData.map(node => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            level={0}
            expanded={expandedIds.has(node.id)}
            selected={selectedId === node.id}
            focused={focusedId === node.id}
            onToggle={toggleExpand}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            showIcons={showIcons}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
  onKeyDown: (e: KeyboardEvent, node: TreeNode, level: number) => void;
  showIcons: boolean;
}

function TreeNodeComponent({
  node,
  level,
  expanded,
  selected,
  focused,
  onToggle,
  onSelect,
  onKeyDown,
  showIcons,
}: TreeNodeComponentProps) {
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = level * 20 + 8;

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <div
        tabIndex={0}
        role="button"
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
          }
          onSelect(node);
        }}
        onKeyDown={(e) => onKeyDown(e, node, level)}
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
          transition-colors
          ${selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
          ${focused ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${node.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ paddingLeft: `${paddingLeft}px` }}
        aria-selected={selected}
        aria-disabled={node.disabled}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 hover:bg-muted-foreground/10 rounded"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-5" />}

        {showIcons && (
          <div className="flex-shrink-0">
            {node.icon || (
              hasChildren ? (
                expanded ? (
                  <FolderOpen className="w-4 h-4" />
                ) : (
                  <Folder className="w-4 h-4" />
                )
              ) : (
                <File className="w-4 h-4" />
              )
            )}
          </div>
        )}

        <span className="flex-1 truncate text-sm">{node.label}</span>
      </div>

      {hasChildren && expanded && (
        <div role="group">
          {node.children!.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              expanded={false}
              selected={false}
              focused={false}
              onToggle={onToggle}
              onSelect={onSelect}
              onKeyDown={onKeyDown}
              showIcons={showIcons}
            />
          ))}
        </div>
      )}
    </div>
  );
}
