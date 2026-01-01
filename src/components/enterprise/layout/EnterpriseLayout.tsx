'use client';

import React, { useState } from 'react';
import { Menu, X, Bell, User, Settings } from 'lucide-react';

export interface EnterpriseLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  showSidebar?: boolean;
  sidebarCollapsible?: boolean;
}

export function EnterpriseLayout({
  children,
  sidebar,
  header,
  footer,
  showSidebar = true,
  sidebarCollapsible = true,
}: EnterpriseLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 h-16">
          {showSidebar && sidebarCollapsible && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-lg lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <div className="flex-1">{header}</div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-lg" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg" aria-label="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg" aria-label="Profile">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <aside
            className={`
              ${sidebarOpen ? 'w-64' : 'w-0'}
              lg:w-64 border-r border-border bg-card
              transition-all duration-300 overflow-hidden
            `}
          >
            <div className="p-4">{sidebar}</div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-border bg-card px-6 py-4">
          {footer}
        </footer>
      )}
    </div>
  );
}
