"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

export default function OrganizationSettings() {
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/organizations");
      const data = await response.json();

      if (data.success) {
        setOrganization(data.data);
        const settings = data.data.settings || {};
        setValue("mfaRequired", settings.mfaRequired || false);
        setValue("sessionTimeout", settings.sessionTimeout || 3600);
      }
    } catch (error) {
      toast.error("Failed to fetch organization settings");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Settings updated successfully");
        fetchOrganization();
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>Basic organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input value={organization?.name || ""} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={organization?.type || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={organization?.status || ""} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Configure security policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require MFA for All Users</Label>
              <p className="text-sm text-muted-foreground">
                Force all users to enable multi-factor authentication
              </p>
            </div>
            <Switch
              checked={watch("mfaRequired")}
              onCheckedChange={(checked) => setValue("mfaRequired", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              {...register("sessionTimeout")}
              placeholder="3600"
            />
            <p className="text-sm text-muted-foreground">
              Automatically log out inactive users after this period
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
