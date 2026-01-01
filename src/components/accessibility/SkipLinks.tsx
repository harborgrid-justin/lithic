"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SkipLink {
  href: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { href: "#main-content", label: "Skip to main content" },
  { href: "#navigation", label: "Skip to navigation" },
  { href: "#footer", label: "Skip to footer" },
];

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

export function SkipLinks({
  links = defaultSkipLinks,
  className,
}: SkipLinksProps) {
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();

    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Set focus to the target element
      targetElement.setAttribute("tabindex", "-1");
      targetElement.focus();

      // Scroll to the target
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Remove tabindex after focusing
      setTimeout(() => {
        targetElement.removeAttribute("tabindex");
      }, 100);
    }
  };

  return (
    <div className={cn("fixed left-0 top-0 z-[9999]", className)}>
      <nav aria-label="Skip links" className="flex flex-col gap-1 p-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={(e) => handleClick(e, link.href)}
            className={cn(
              "sr-only rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              "focus:not-sr-only focus:absolute focus:left-2 focus:top-2",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "transition-all",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// Hook to register skip link targets
export function useSkipLinkTarget(id: string) {
  React.useEffect(() => {
    const element = document.getElementById(id);
    if (element) {
      // Ensure the element can receive focus
      if (!element.hasAttribute("tabindex")) {
        element.setAttribute("tabindex", "-1");
      }

      // Remove default outline for mouse users
      element.style.outline = "none";
    }
  }, [id]);
}
