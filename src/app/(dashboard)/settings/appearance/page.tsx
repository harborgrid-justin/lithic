"use client";

import * as React from "react";
import { useState } from "react";
import {
  Moon,
  Sun,
  Monitor,
  Palette,
  Type,
  Eye,
  Check,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme, type ThemeMode } from "@/lib/themes/theme-provider";
import { hexToHSL, BrandingConfig } from "@/lib/themes/branding";

export const dynamic = "force-dynamic";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function AppearancePage() {
  const {
    theme,
    setTheme,
    resolvedTheme,
    brandingManager,
    isReducedMotion,
    setReducedMotion,
  } = useTheme();
  const [branding, setBranding] = useState<BrandingConfig>(
    brandingManager.getBranding(),
  );
  const [showSaved, setShowSaved] = useState(false);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const handleBrandingUpdate = (updates: Partial<BrandingConfig>) => {
    const newBranding = { ...branding, ...updates };
    setBranding(newBranding);
    brandingManager.updateBranding(updates);
    showSavedIndicator();
  };

  const handleColorChange = (
    key: "primary" | "secondary" | "accent",
    value: string,
  ) => {
    const hsl = hexToHSL(value);
    handleBrandingUpdate({
      colors: {
        ...branding.colors,
        [key]: hsl,
      },
    });
  };

  const handleResetBranding = () => {
    brandingManager.resetBranding();
    setBranding(brandingManager.getBranding());
    showSavedIndicator();
  };

  const showSavedIndicator = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Light theme with comfortable brightness",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Dark theme for low-light environments",
    },
    {
      value: "high-contrast",
      label: "High Contrast",
      icon: Eye,
      description: "Maximum contrast for accessibility",
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow your system preference",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { title: "Settings", href: "/settings" },
          { title: "Appearance" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
          <p className="text-muted-foreground mt-2">
            Customize the look and feel of your application
          </p>
        </div>
        {showSaved && (
          <Badge
            variant="default"
            className="animate-in fade-in slide-in-from-top-2"
          >
            <Check className="mr-1 h-3 w-3" />
            Saved
          </Badge>
        )}
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color theme. The system option will match your
            device settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange}>
            <div className="grid gap-4 md:grid-cols-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;

                return (
                  <Label
                    key={option.value}
                    htmlFor={`theme-${option.value}`}
                    className={cn(
                      "flex cursor-pointer flex-col gap-3 rounded-lg border-2 p-4 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      <RadioGroupItem
                        value={option.value}
                        id={`theme-${option.value}`}
                        className="sr-only"
                      />
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </Label>
                );
              })}
            </div>
          </RadioGroup>

          {/* Current Theme Preview */}
          <div className="mt-6">
            <Label className="text-sm font-medium mb-3 block">
              Current Theme Preview
            </Label>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary" />
                <div className="h-8 w-8 rounded-full bg-secondary" />
                <div className="h-8 w-8 rounded-full bg-accent" />
                <div className="h-8 w-8 rounded-full bg-muted" />
              </div>
              <div className="flex gap-2">
                <Button size="sm">Primary Button</Button>
                <Button size="sm" variant="secondary">
                  Secondary
                </Button>
                <Button size="sm" variant="outline">
                  Outline
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Branding
          </CardTitle>
          <CardDescription>
            Customize your organization&apos;s branding and identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={branding.organizationName}
              onChange={(e) =>
                handleBrandingUpdate({ organizationName: e.target.value })
              }
              placeholder="Enter organization name"
            />
          </div>

          <Separator />

          {/* Brand Colors */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Brand Colors</Label>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="text-sm">
                  Primary Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    className="w-16 h-10 p-1 cursor-pointer"
                    onChange={(e) =>
                      handleColorChange("primary", e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    placeholder="#0066FF"
                    className="flex-1"
                    onChange={(e) => {
                      if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                        handleColorChange("primary", e.target.value);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color" className="text-sm">
                  Secondary Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    className="w-16 h-10 p-1 cursor-pointer"
                    onChange={(e) =>
                      handleColorChange("secondary", e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    placeholder="#F0F0F0"
                    className="flex-1"
                    onChange={(e) => {
                      if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                        handleColorChange("secondary", e.target.value);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent-color" className="text-sm">
                  Accent Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="accent-color"
                    type="color"
                    className="w-16 h-10 p-1 cursor-pointer"
                    onChange={(e) =>
                      handleColorChange("accent", e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    placeholder="#FF6B35"
                    className="flex-1"
                    onChange={(e) => {
                      if (e.target.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                        handleColorChange("accent", e.target.value);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleResetBranding}>
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility
          </CardTitle>
          <CardDescription>
            Configure accessibility options to improve your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion" className="text-base">
                Reduce Motion
              </Label>
              <div className="text-sm text-muted-foreground">
                Minimize animations and transitions throughout the interface
              </div>
            </div>
            <Switch
              id="reduced-motion"
              checked={isReducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>

          <Separator />

          {/* Font Size - Future Implementation */}
          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Type className="h-4 w-4" />
                Font Size
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </Label>
              <div className="text-sm text-muted-foreground">
                Adjust the base font size for better readability
              </div>
            </div>
          </div>

          <Separator />

          {/* WCAG Compliance Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-semibold">WCAG 2.1 AA Compliant</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This application follows Web Content Accessibility Guidelines
              (WCAG) 2.1 Level AA standards to ensure accessibility for all
              users. Our themes maintain sufficient color contrast ratios, and
              all interactive elements are keyboard accessible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
