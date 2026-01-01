"use client";

import Link from "next/link";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface BreadcrumbItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  maxItems?: number;
  truncateFrom?: "start" | "middle" | "end";
  showHome?: boolean;
}

export function Breadcrumbs({
  items,
  className,
  maxItems = 5,
  truncateFrom = "middle",
  showHome = true,
}: BreadcrumbsProps) {
  const truncateItems = (
    items: BreadcrumbItem[],
  ): {
    visible: BreadcrumbItem[];
    hidden: BreadcrumbItem[];
  } => {
    if (items.length <= maxItems) {
      return { visible: items, hidden: [] };
    }

    if (truncateFrom === "start") {
      return {
        visible: items.slice(items.length - maxItems),
        hidden: items.slice(0, items.length - maxItems),
      };
    } else if (truncateFrom === "end") {
      return {
        visible: items.slice(0, maxItems),
        hidden: items.slice(maxItems),
      };
    } else {
      // middle
      const keepStart = Math.floor(maxItems / 2);
      const keepEnd = maxItems - keepStart - 1;
      return {
        visible: [
          ...items.slice(0, keepStart),
          ...items.slice(items.length - keepEnd),
        ],
        hidden: items.slice(keepStart, items.length - keepEnd),
      };
    }
  };

  const { visible, hidden } = truncateItems(items);

  const renderBreadcrumbItem = (
    item: BreadcrumbItem,
    index: number,
    isLast: boolean,
  ) => {
    const Icon = item.icon;

    const content = (
      <>
        {Icon && <Icon className="h-4 w-4 mr-1" />}
        <span className="max-w-[200px] truncate">{item.title}</span>
      </>
    );

    if (item.href && !isLast) {
      return (
        <Link
          href={item.href}
          className="flex items-center hover:text-foreground transition-colors"
          aria-label={`Navigate to ${item.title}`}
        >
          {content}
        </Link>
      );
    }

    return (
      <span
        className={cn(
          "flex items-center",
          isLast && "font-medium text-foreground",
        )}
        aria-current={isLast ? "page" : undefined}
      >
        {content}
      </span>
    );
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground",
        className,
      )}
    >
      <ol className="flex items-center space-x-1">
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center hover:text-foreground transition-colors"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
        )}

        {truncateFrom === "middle" && hidden.length > 0 && (
          <>
            {visible.slice(0, Math.floor(maxItems / 2)).map((item, index) => (
              <li key={`start-${index}`} className="flex items-center">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                {renderBreadcrumbItem(item, index, false)}
              </li>
            ))}

            <li className="flex items-center">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1"
                    aria-label={`Show ${hidden.length} more items`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {hidden.map((item, index) => (
                    <DropdownMenuItem key={index} asChild>
                      {item.href ? (
                        <Link href={item.href} className="flex items-center">
                          {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                          {item.title}
                        </Link>
                      ) : (
                        <span className="flex items-center">
                          {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                          {item.title}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>

            {visible.slice(Math.floor(maxItems / 2)).map((item, index) => {
              const isLast =
                index === visible.slice(Math.floor(maxItems / 2)).length - 1;
              return (
                <li key={`end-${index}`} className="flex items-center">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  {renderBreadcrumbItem(item, index, isLast)}
                </li>
              );
            })}
          </>
        )}

        {truncateFrom !== "middle" && hidden.length > 0 && (
          <>
            {truncateFrom === "start" && (
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      aria-label={`Show ${hidden.length} more items`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {hidden.map((item, index) => (
                      <DropdownMenuItem key={index} asChild>
                        {item.href ? (
                          <Link href={item.href} className="flex items-center">
                            {item.icon && (
                              <item.icon className="h-4 w-4 mr-2" />
                            )}
                            {item.title}
                          </Link>
                        ) : (
                          <span className="flex items-center">
                            {item.icon && (
                              <item.icon className="h-4 w-4 mr-2" />
                            )}
                            {item.title}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )}

            {visible.map((item, index) => {
              const isLast = index === visible.length - 1;
              return (
                <li key={index} className="flex items-center">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  {renderBreadcrumbItem(item, index, isLast)}
                </li>
              );
            })}

            {truncateFrom === "end" && (
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      aria-label={`Show ${hidden.length} more items`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {hidden.map((item, index) => (
                      <DropdownMenuItem key={index} asChild>
                        {item.href ? (
                          <Link href={item.href} className="flex items-center">
                            {item.icon && (
                              <item.icon className="h-4 w-4 mr-2" />
                            )}
                            {item.title}
                          </Link>
                        ) : (
                          <span className="flex items-center">
                            {item.icon && (
                              <item.icon className="h-4 w-4 mr-2" />
                            )}
                            {item.title}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )}
          </>
        )}

        {truncateFrom !== "middle" &&
          hidden.length === 0 &&
          visible.map((item, index) => {
            const isLast = index === visible.length - 1;
            return (
              <li key={index} className="flex items-center">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                {renderBreadcrumbItem(item, index, isLast)}
              </li>
            );
          })}
      </ol>
    </nav>
  );
}
