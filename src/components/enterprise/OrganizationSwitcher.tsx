"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, Search, ChevronDown } from "lucide-react";
import { Organization } from "@/types/enterprise";
import { useOrganization } from "@/hooks/useOrganization";
import toast from "react-hot-toast";

export function OrganizationSwitcher() {
  const { context, switchOrganization, getAccessibleOrganizations } =
    useOrganization();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const orgs = await getAccessibleOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Error loading organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (organizationId: string) => {
    try {
      await switchOrganization({ organizationId });
      setOpen(false);
      toast.success("Organization switched successfully");
    } catch (error) {
      console.error("Error switching organization:", error);
      toast.error("Failed to switch organization");
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.npi.includes(searchQuery),
  );

  if (!context) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No organization</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{context.organization.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading organizations...
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No organizations found
            </div>
          ) : (
            <div className="p-2">
              {filteredOrganizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <Check
                    className={`h-4 w-4 shrink-0 ${
                      context.organizationId === org.id
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{org.name}</span>
                      {org.status === "TRIAL" && (
                        <Badge variant="outline" className="text-xs">
                          Trial
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {org.type} • {org.subscription}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {context.facility && (
          <div className="p-3 border-t bg-muted/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Current Context
            </div>
            <div className="space-y-1 text-sm">
              {context.facility && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{context.facility.name}</span>
                </div>
              )}
              {context.department && (
                <div className="flex items-center gap-2 ml-5">
                  <span className="text-muted-foreground truncate">
                    {context.department.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
