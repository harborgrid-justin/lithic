"use client";

/**
 * CommandPalette - Quick Action Command Center (Cmd+K)
 * Provides fuzzy search and keyboard navigation for power users
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  User,
  Calendar,
  FileText,
  Activity,
  DollarSign,
  Settings,
  Search,
  Clock,
  Pill,
  Image as ImageIcon,
  Beaker,
  LayoutDashboard,
  Users,
  BarChart3,
  Shield,
} from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

// ============================================================================
// Component
// ============================================================================

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, toggleCommandPalette } = useDashboardStore();
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleCommandPalette]);

  const executeCommand = useCallback(
    (commandId: string, action: () => void) => {
      action();
      toggleCommandPalette();

      // Track recent commands
      setRecentCommands((prev) => {
        const updated = [
          commandId,
          ...prev.filter((id) => id !== commandId),
        ].slice(0, 5);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "lithic-recent-commands",
            JSON.stringify(updated),
          );
        }
        return updated;
      });
    },
    [toggleCommandPalette],
  );

  // Load recent commands
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lithic-recent-commands");
      if (stored) {
        try {
          setRecentCommands(JSON.parse(stored));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, []);

  // Define available commands
  const commands: CommandAction[] = [
    // Patient Management
    {
      id: "patient-search",
      label: "Search Patients",
      description: "Find patient records",
      icon: <Search className="w-4 h-4" />,
      category: "Patients",
      keywords: ["patient", "search", "find", "chart"],
      action: () => router.push("/patients"),
    },
    {
      id: "patient-new",
      label: "New Patient",
      description: "Register new patient",
      icon: <User className="w-4 h-4" />,
      category: "Patients",
      keywords: ["patient", "new", "register", "add"],
      action: () => router.push("/patients/new"),
    },

    // Scheduling
    {
      id: "schedule-view",
      label: "View Schedule",
      description: "Open appointment calendar",
      icon: <Calendar className="w-4 h-4" />,
      category: "Scheduling",
      keywords: ["schedule", "calendar", "appointments"],
      action: () => router.push("/scheduling"),
    },
    {
      id: "appointment-new",
      label: "New Appointment",
      description: "Schedule new appointment",
      icon: <Clock className="w-4 h-4" />,
      category: "Scheduling",
      keywords: ["appointment", "schedule", "new", "book"],
      action: () => router.push("/scheduling/new"),
    },

    // Clinical
    {
      id: "clinical-notes",
      label: "Clinical Notes",
      description: "View and create notes",
      icon: <FileText className="w-4 h-4" />,
      category: "Clinical",
      keywords: ["notes", "clinical", "documentation", "chart"],
      action: () => router.push("/clinical/notes"),
    },
    {
      id: "vitals-entry",
      label: "Enter Vitals",
      description: "Record patient vitals",
      icon: <Activity className="w-4 h-4" />,
      category: "Clinical",
      keywords: ["vitals", "vital signs", "bp", "temperature"],
      action: () => router.push("/clinical/vitals"),
    },

    // Orders
    {
      id: "lab-order",
      label: "Order Lab Tests",
      description: "Create laboratory order",
      icon: <Beaker className="w-4 h-4" />,
      category: "Orders",
      keywords: ["lab", "laboratory", "order", "tests"],
      action: () => router.push("/laboratory/orders/new"),
    },
    {
      id: "imaging-order",
      label: "Order Imaging",
      description: "Create imaging order",
      icon: <ImageIcon className="w-4 h-4" />,
      category: "Orders",
      keywords: ["imaging", "radiology", "xray", "order"],
      action: () => router.push("/imaging/orders/new"),
    },
    {
      id: "prescription-new",
      label: "New Prescription",
      description: "E-prescribe medication",
      icon: <Pill className="w-4 h-4" />,
      category: "Pharmacy",
      keywords: ["prescription", "medication", "rx", "prescribe"],
      action: () => router.push("/pharmacy/prescribe"),
    },

    // Billing
    {
      id: "billing-claims",
      label: "View Claims",
      description: "Manage billing claims",
      icon: <DollarSign className="w-4 h-4" />,
      category: "Billing",
      keywords: ["billing", "claims", "insurance", "revenue"],
      action: () => router.push("/billing/claims"),
    },

    // Analytics
    {
      id: "analytics-dashboard",
      label: "Analytics Dashboard",
      description: "View reports and metrics",
      icon: <BarChart3 className="w-4 h-4" />,
      category: "Analytics",
      keywords: ["analytics", "reports", "metrics", "dashboard"],
      action: () => router.push("/analytics"),
    },

    // Administration
    {
      id: "admin-users",
      label: "User Management",
      description: "Manage users and roles",
      icon: <Users className="w-4 h-4" />,
      category: "Administration",
      keywords: ["admin", "users", "roles", "permissions"],
      action: () => router.push("/admin/users"),
    },
    {
      id: "admin-security",
      label: "Security Dashboard",
      description: "View security and audit logs",
      icon: <Shield className="w-4 h-4" />,
      category: "Administration",
      keywords: ["security", "audit", "logs", "compliance"],
      action: () => router.push("/admin/security"),
    },

    // Dashboard
    {
      id: "dashboard-customize",
      label: "Customize Dashboard",
      description: "Personalize your dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      category: "Dashboard",
      keywords: ["dashboard", "customize", "widgets", "layout"],
      action: () => router.push("/dashboard/customize"),
    },
    {
      id: "settings",
      label: "Settings",
      description: "Application settings",
      icon: <Settings className="w-4 h-4" />,
      category: "System",
      keywords: ["settings", "preferences", "configuration"],
      action: () => router.push("/settings"),
    },
  ];

  // Group commands by category
  const categories = Array.from(
    new Set(commands.map((cmd) => cmd.category)),
  ).sort();

  const recentCommandObjects = recentCommands
    .map((id) => commands.find((cmd) => cmd.id === id))
    .filter(Boolean) as CommandAction[];

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={toggleCommandPalette}
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recent Commands */}
        {recentCommandObjects.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentCommandObjects.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => executeCommand(cmd.id, cmd.action)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                    {cmd.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-gray-500">{cmd.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {cmd.category}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* All Commands by Category */}
        {categories.map((category) => (
          <CommandGroup key={category} heading={category}>
            {commands
              .filter((cmd) => cmd.category === category)
              .map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => executeCommand(cmd.id, cmd.action)}
                  className="flex items-center gap-3 cursor-pointer"
                  keywords={cmd.keywords}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                    {cmd.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-gray-500">{cmd.description}</p>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
