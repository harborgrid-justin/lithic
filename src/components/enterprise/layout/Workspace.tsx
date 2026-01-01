'use client';

import React from 'react';
import { TabNavigator, Tab } from '../navigation/TabNavigator';

export interface WorkspaceTab extends Tab {
  component: React.ReactNode;
}

export interface WorkspaceProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabClose?: (id: string) => void;
  className?: string;
}

export function Workspace({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  className = '',
}: WorkspaceProps) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <TabNavigator
        tabs={tabs}
        activeId={activeTabId}
        onChange={onTabChange}
        onClose={onTabClose}
        variant="pills"
      />
    </div>
  );
}
