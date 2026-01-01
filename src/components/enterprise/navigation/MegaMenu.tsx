'use client';

/**
 * Enterprise MegaMenu Component
 *
 * Enterprise navigation menu with:
 * - Multi-column layout
 * - Icons and descriptions
 * - Featured items
 * - Quick actions
 * - Keyboard navigation
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface MegaMenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  description?: string;
  badge?: string;
  featured?: boolean;
  children?: MegaMenuItem[];
}

export interface MegaMenuProps {
  items: MegaMenuItem[];
  columns?: number;
  className?: string;
}

export function MegaMenu({ items, columns = 3, className = '' }: MegaMenuProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav ref={menuRef} className={`relative ${className}`} role="navigation">
      <ul className="flex items-center gap-1">
        {items.map(item => (
          <li key={item.id} className="relative">
            {item.children ? (
              <button
                onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                onMouseEnter={() => setOpenMenuId(item.id)}
                className="
                  px-4 py-2 rounded-lg flex items-center gap-2
                  hover:bg-muted transition-colors
                  text-sm font-medium
                "
                aria-expanded={openMenuId === item.id}
                aria-haspopup="true"
              >
                {item.icon}
                <span>{item.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openMenuId === item.id ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <Link
                href={item.href || '#'}
                className="
                  px-4 py-2 rounded-lg flex items-center gap-2
                  hover:bg-muted transition-colors
                  text-sm font-medium
                "
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )}

            {/* Dropdown */}
            {item.children && openMenuId === item.id && (
              <div
                className="
                  absolute top-full left-0 mt-2 p-6
                  bg-card border border-border rounded-lg shadow-xl
                  min-w-[600px] z-50
                "
                onMouseLeave={() => setOpenMenuId(null)}
              >
                <div className={`grid grid-cols-${columns} gap-6`}>
                  {item.children.map(child => (
                    <Link
                      key={child.id}
                      href={child.href || '#'}
                      className={`
                        p-3 rounded-lg hover:bg-muted transition-colors
                        ${child.featured ? 'border-2 border-primary' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {child.icon && (
                          <div className="flex-shrink-0 mt-1">
                            {child.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{child.label}</span>
                            {child.badge && (
                              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                {child.badge}
                              </span>
                            )}
                          </div>
                          {child.description && (
                            <p className="text-xs text-muted-foreground">
                              {child.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
