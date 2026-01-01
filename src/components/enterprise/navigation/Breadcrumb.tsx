'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumb({
  items,
  showHome = true,
  separator = <ChevronRight className="w-4 h-4" />,
  className = '',
}: BreadcrumbProps) {
  const allItems = showHome
    ? [{ label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && (
                <span className="text-muted-foreground" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
