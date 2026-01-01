/**
 * SMART App Gallery Component
 * Displays available SMART on FHIR apps with launch buttons and permission display
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  Rocket,
} from "lucide-react";
import type { SMARTAppRegistration } from "@/lib/smart/app-registry";
import type { LaunchType } from "@/lib/smart/app-launcher";

interface SMARTApp {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  launchUrl: string;
  launchType: LaunchType;
  scope: string[];
  fhirVersions?: string[];
  status: "active" | "inactive" | "revoked";
  vendor?: string;
  category?: string[];
}

interface AppGalleryProps {
  apps: SMARTApp[];
  patientId?: string;
  encounterId?: string;
  onLaunch?: (app: SMARTApp) => void;
}

export function AppGallery({ apps, patientId, encounterId, onLaunch }: AppGalleryProps) {
  const [selectedApp, setSelectedApp] = useState<SMARTApp | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const categories = Array.from(new Set(apps.flatMap((app) => app.category || [])));

  const filteredApps = apps.filter((app) => {
    if (filter === "all") return true;
    return app.category?.includes(filter);
  });

  const handleLaunchApp = (app: SMARTApp) => {
    if (onLaunch) {
      onLaunch(app);
    } else {
      // Default launch behavior
      const params = new URLSearchParams({
        iss: window.location.origin + "/api/fhir",
        launch: "demo-launch-token",
      });

      if (patientId) {
        params.set("patient", patientId);
      }

      if (encounterId) {
        params.set("encounter", encounterId);
      }

      window.open(`${app.launchUrl}?${params.toString()}`, "_blank");
    }
  };

  const handleShowPermissions = (app: SMARTApp) => {
    setSelectedApp(app);
    setShowPermissions(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SMART App Gallery</h2>
          <p className="text-muted-foreground">
            Launch integrated healthcare applications
          </p>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Apps
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => (
          <Card key={app.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {app.logoUrl ? (
                    <img
                      src={app.logoUrl}
                      alt={app.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                      <Rocket className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    {app.vendor && (
                      <p className="text-sm text-muted-foreground">{app.vendor}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    app.status === "active"
                      ? "default"
                      : app.status === "inactive"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {app.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="line-clamp-3">
                {app.description}
              </CardDescription>

              {/* Categories */}
              {app.category && app.category.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-3">
                  {app.category.map((cat) => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}

              {/* FHIR Versions */}
              {app.fhirVersions && app.fhirVersions.length > 0 && (
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>FHIR: {app.fhirVersions.join(", ")}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleLaunchApp(app)}
                disabled={app.status !== "active"}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Launch
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShowPermissions(app)}
              >
                <Shield className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No apps available in this category</p>
        </div>
      )}

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>App Permissions</DialogTitle>
            <DialogDescription>
              This app requests the following permissions to access your health data
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {/* App Info */}
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  {selectedApp.logoUrl ? (
                    <img
                      src={selectedApp.logoUrl}
                      alt={selectedApp.name}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center">
                      <Rocket className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{selectedApp.name}</h3>
                    {selectedApp.vendor && (
                      <p className="text-sm text-muted-foreground">
                        {selectedApp.vendor}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Permissions */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Requested Permissions
                  </h4>
                  <div className="space-y-2">
                    {selectedApp.scope.map((scope) => (
                      <div
                        key={scope}
                        className="flex items-start gap-2 p-2 rounded border"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{scope}</p>
                          <p className="text-xs text-muted-foreground">
                            {getScopeDescription(scope)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Launch Type */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Launch Information
                  </h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Launch Type:</span>{" "}
                      {selectedApp.launchType === "ehr-launch"
                        ? "EHR Launch (Contextual)"
                        : "Standalone Launch"}
                    </p>
                    {selectedApp.fhirVersions && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">FHIR Versions:</span>{" "}
                        {selectedApp.fhirVersions.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Security Notice
                    </p>
                    <p className="text-amber-800 dark:text-amber-200 mt-1">
                      Only grant access to trusted applications. You can revoke
                      access at any time from your account settings.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissions(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedApp) {
                handleLaunchApp(selectedApp);
                setShowPermissions(false);
              }
            }}>
              Launch App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Get human-readable scope description
 */
function getScopeDescription(scope: string): string {
  // Parse scope pattern
  const match = scope.match(/^(patient|user|system)\/([^.]+)\.(.+)$/);

  if (!match) {
    return scope;
  }

  const [, context, resource, permission] = match;

  const contextMap: Record<string, string> = {
    patient: "Patient-specific",
    user: "User-specific",
    system: "System-wide",
  };

  const permissionMap: Record<string, string> = {
    read: "read access",
    write: "read and write access",
    "*": "full access",
  };

  const resourceName = resource === "*" ? "all resources" : resource;
  const permissionText = permissionMap[permission] || permission;

  return `${contextMap[context]} ${permissionText} to ${resourceName}`;
}
