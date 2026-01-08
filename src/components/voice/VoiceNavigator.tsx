"use client";

/**
 * Voice Navigator Component
 * Voice-controlled navigation with visual route display
 */

import React, { useState } from "react";
import { Navigation, MapPin, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { VoiceNavigationShortcut } from "@/types/voice";

interface VoiceNavigatorProps {
  shortcuts: VoiceNavigationShortcut[];
  pendingNavigation?: VoiceNavigationShortcut | null;
  onConfirm: () => void;
  onCancel: () => void;
  onNavigate: (shortcut: VoiceNavigationShortcut) => void;
  className?: string;
}

export function VoiceNavigator({
  shortcuts,
  pendingNavigation,
  onConfirm,
  onCancel,
  onNavigate,
  className,
}: VoiceNavigatorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShortcuts = shortcuts.filter(
    (shortcut) =>
      searchQuery === "" ||
      shortcut.phrases.some((phrase) =>
        phrase.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      shortcut.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    const firstWord = shortcut.phrases[0].split(" ")[0];
    if (!acc[firstWord]) {
      acc[firstWord] = [];
    }
    acc[firstWord].push(shortcut);
    return acc;
  }, {} as Record<string, VoiceNavigationShortcut[]>);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Voice Navigation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pending Navigation Confirmation */}
        {pendingNavigation && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    Navigate to {pendingNavigation.route}?
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {pendingNavigation.phrases[0]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onConfirm}
                  size="sm"
                  variant="default"
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
                <Button
                  onClick={onCancel}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <Input
          placeholder="Search navigation shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Shortcuts List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {Object.entries(groupedShortcuts).map(([group, items]) => (
              <div key={group}>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground capitalize">
                  {group}
                </h4>
                <div className="space-y-2">
                  {items.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      onClick={() => onNavigate(shortcut)}
                      className="w-full p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            <p className="text-sm font-medium">
                              {shortcut.phrases[0]}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {shortcut.route}
                          </p>
                        </div>
                        {shortcut.requiresPermission && (
                          <Badge variant="outline" className="text-xs">
                            Restricted
                          </Badge>
                        )}
                      </div>
                      {shortcut.phrases.length > 1 && (
                        <div className="mt-2 ml-6 flex flex-wrap gap-1">
                          {shortcut.phrases.slice(1, 3).map((phrase, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {phrase}
                            </Badge>
                          ))}
                          {shortcut.phrases.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{shortcut.phrases.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Help Text */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Say any of the phrases above to navigate. For example, "Go to
            dashboard" or "Open patient list".
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
