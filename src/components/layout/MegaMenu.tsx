"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Search,
  Star,
  TrendingUp,
  Users,
  FileText,
  Activity,
  Calendar,
  Building2,
  Shield,
  DollarSign,
  Microscope,
  Scan,
  Pill,
  BarChart3,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MegaMenuItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  featured?: boolean;
}

interface MegaMenuCategory {
  title: string;
  items: MegaMenuItem[];
}

interface MegaMenuSection {
  title: string;
  categories: MegaMenuCategory[];
  quickLinks?: MegaMenuItem[];
}

interface MegaMenuProps {
  sections: MegaMenuSection[];
  className?: string;
}

const defaultSections: MegaMenuSection[] = [
  {
    title: "Clinical",
    categories: [
      {
        title: "Patient Care",
        items: [
          {
            title: "Patients",
            href: "/patients",
            description: "Search and manage patient records",
            icon: Users,
            badge: "234",
          },
          {
            title: "Appointments",
            href: "/appointments",
            description: "Schedule and manage appointments",
            icon: Calendar,
            badge: "12",
          },
          {
            title: "Medical Records",
            href: "/records",
            description: "Access patient medical records",
            icon: FileText,
          },
        ],
      },
      {
        title: "Clinical Workflow",
        items: [
          {
            title: "Encounters",
            href: "/clinical/encounters",
            description: "Patient encounters and visits",
            icon: Heart,
          },
          {
            title: "Orders",
            href: "/clinical/orders",
            description: "Lab and imaging orders",
            icon: FileText,
          },
          {
            title: "Vitals",
            href: "/clinical/vitals",
            description: "Record and track vital signs",
            icon: Activity,
          },
        ],
      },
    ],
    quickLinks: [
      {
        title: "New Patient",
        href: "/patients/new",
        icon: Users,
        featured: true,
      },
      {
        title: "Schedule Appointment",
        href: "/appointments/new",
        icon: Calendar,
        featured: true,
      },
    ],
  },
  {
    title: "Diagnostics",
    categories: [
      {
        title: "Imaging",
        items: [
          {
            title: "Radiology Worklist",
            href: "/imaging/worklist",
            description: "View pending imaging studies",
            icon: Scan,
          },
          {
            title: "DICOM Viewer",
            href: "/imaging/viewer",
            description: "View medical images",
            icon: Scan,
          },
          {
            title: "Imaging Orders",
            href: "/imaging/orders",
            description: "Order imaging studies",
            icon: FileText,
          },
        ],
      },
      {
        title: "Laboratory",
        items: [
          {
            title: "Lab Orders",
            href: "/laboratory/orders",
            description: "Order laboratory tests",
            icon: Microscope,
          },
          {
            title: "Results",
            href: "/laboratory/results",
            description: "View lab results",
            icon: FileText,
          },
          {
            title: "Specimens",
            href: "/laboratory/specimens",
            description: "Track specimens",
            icon: Microscope,
          },
        ],
      },
    ],
  },
  {
    title: "Operations",
    categories: [
      {
        title: "Financial",
        items: [
          {
            title: "Billing",
            href: "/billing",
            description: "Claims and billing management",
            icon: DollarSign,
          },
          {
            title: "Claims",
            href: "/billing/claims",
            description: "Submit and track claims",
            icon: FileText,
          },
          {
            title: "Revenue",
            href: "/billing/revenue",
            description: "Revenue cycle analytics",
            icon: TrendingUp,
          },
        ],
      },
      {
        title: "Management",
        items: [
          {
            title: "Analytics",
            href: "/analytics",
            description: "Reports and dashboards",
            icon: BarChart3,
          },
          {
            title: "Departments",
            href: "/admin/departments",
            description: "Manage departments",
            icon: Building2,
          },
          {
            title: "Security",
            href: "/admin/security",
            description: "Security and compliance",
            icon: Shield,
          },
        ],
      },
    ],
  },
];

export function MegaMenu({
  sections = defaultSections,
  className,
}: MegaMenuProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent, section: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveSection(activeSection === section ? null : section);
    } else if (event.key === "Escape") {
      setActiveSection(null);
    }
  };

  const filterItems = (items: MegaMenuItem[]) => {
    if (!searchQuery) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  return (
    <nav ref={menuRef} className={cn("relative hidden lg:block", className)}>
      <div className="flex items-center gap-1">
        {sections.map((section) => {
          const isActive = activeSection === section.title;

          return (
            <div key={section.title} className="relative">
              <button
                onClick={() =>
                  setActiveSection(isActive ? null : section.title)
                }
                onKeyDown={(e) => handleKeyDown(e, section.title)}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-md",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                )}
                aria-expanded={isActive}
                aria-haspopup="true"
              >
                {section.title}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isActive && "rotate-180",
                  )}
                />
              </button>

              {isActive && (
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-screen max-w-4xl rounded-lg border bg-popover p-6 shadow-lg"
                  role="menu"
                >
                  {/* Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={`Search in ${section.title}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        aria-label={`Search in ${section.title}`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Categories */}
                    {section.categories.map((category) => {
                      const filteredItems = filterItems(category.items);
                      if (filteredItems.length === 0) return null;

                      return (
                        <div key={category.title}>
                          <h3 className="mb-3 text-sm font-semibold">
                            {category.title}
                          </h3>
                          <ul className="space-y-2">
                            {filteredItems.map((item) => {
                              const Icon = item.icon;

                              return (
                                <li key={item.href}>
                                  <Link
                                    href={item.href}
                                    onClick={() => setActiveSection(null)}
                                    className="group flex items-start gap-3 rounded-md p-2 hover:bg-accent transition-colors"
                                  >
                                    {Icon && (
                                      <Icon className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent-foreground mt-0.5" />
                                    )}
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium group-hover:text-accent-foreground">
                                          {item.title}
                                        </span>
                                        {item.badge && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {item.badge}
                                          </Badge>
                                        )}
                                        {item.featured && (
                                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Links */}
                  {section.quickLinks && section.quickLinks.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="mb-3 text-sm font-semibold">
                        Quick Actions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {section.quickLinks.map((link) => {
                          const Icon = link.icon;

                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setActiveSection(null)}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                link.featured
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "bg-accent text-accent-foreground hover:bg-accent/80",
                              )}
                            >
                              {Icon && <Icon className="h-4 w-4" />}
                              {link.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
