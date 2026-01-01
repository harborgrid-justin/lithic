"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Facility, FacilityType, CreateFacilityDto } from "@/types/enterprise";
import { useOrganization } from "@/hooks/useOrganization";
import toast from "react-hot-toast";

interface FacilityManagerProps {
  facility?: Facility | null;
  onClose: () => void;
  onSave: () => void;
}

export function FacilityManager({
  facility,
  onClose,
  onSave,
}: FacilityManagerProps) {
  const { organization } = useOrganization();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    if (facility) {
      // Populate form with existing facility data
      setValue("name", facility.name);
      setValue("facilityCode", facility.facilityCode);
      setValue("type", facility.type);
      setValue("address.line1", facility.address.line1);
      setValue("address.line2", facility.address.line2);
      setValue("address.city", facility.address.city);
      setValue("address.state", facility.address.state);
      setValue("address.postalCode", facility.address.postalCode);
      setValue("address.country", facility.address.country);
      setValue("contactInfo.phone", facility.contactInfo.phone);
      setValue("contactInfo.email", facility.contactInfo.email);
      setValue("contactInfo.fax", facility.contactInfo.fax);
    }
  }, [facility, setValue]);

  const onSubmit = async (data: any) => {
    if (!organization) return;

    setSaving(true);
    try {
      const facilityData: CreateFacilityDto = {
        organizationId: organization.id,
        name: data.name,
        facilityCode: data.facilityCode,
        type: data.type,
        address: {
          line1: data.address.line1,
          line2: data.address.line2 || null,
          city: data.address.city,
          state: data.address.state,
          postalCode: data.address.postalCode,
          country: data.address.country || "US",
          county: null,
        },
        contactInfo: {
          phone: data.contactInfo.phone,
          email: data.contactInfo.email,
          fax: data.contactInfo.fax || null,
          website: null,
        },
      };

      const url = facility
        ? `/api/enterprise/facilities/${facility.id}`
        : "/api/enterprise/facilities";
      const method = facility ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          facility ? { ...facilityData, id: facility.id } : facilityData,
        ),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          facility
            ? "Facility updated successfully"
            : "Facility created successfully",
        );
        onSave();
      } else {
        toast.error(result.error?.message || "Failed to save facility");
      }
    } catch (error) {
      console.error("Error saving facility:", error);
      toast.error("Failed to save facility");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {facility ? "Edit Facility" : "New Facility"}
          </DialogTitle>
          <DialogDescription>
            {facility
              ? "Update facility information and settings"
              : "Create a new facility for your organization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="hours">Operating Hours</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: true })}
                    placeholder="Main Hospital"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilityCode">Facility Code *</Label>
                  <Input
                    id="facilityCode"
                    {...register("facilityCode", { required: true })}
                    placeholder="FAC-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Facility Type *</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FacilityType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="line1">Address Line 1 *</Label>
                <Input
                  id="line1"
                  {...register("address.line1", { required: true })}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line2">Address Line 2</Label>
                <Input
                  id="line2"
                  {...register("address.line2")}
                  placeholder="Suite 100"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register("address.city", { required: true })}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...register("address.state", { required: true })}
                    placeholder="NY"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">ZIP Code *</Label>
                  <Input
                    id="postalCode"
                    {...register("address.postalCode", { required: true })}
                    placeholder="10001"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("contactInfo.phone", { required: true })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("contactInfo.email", { required: true })}
                  placeholder="facility@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fax">Fax Number</Label>
                <Input
                  id="fax"
                  type="tel"
                  {...register("contactInfo.fax")}
                  placeholder="(555) 123-4568"
                />
              </div>
            </TabsContent>

            <TabsContent value="hours" className="space-y-4 mt-4">
              <div className="space-y-4">
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-32">
                      <span className="font-medium capitalize">{day}</span>
                    </div>
                    <Switch
                      checked={watch(`hours.${day}.open`) ?? true}
                      onCheckedChange={(checked) =>
                        setValue(`hours.${day}.open`, checked)
                      }
                    />
                    {watch(`hours.${day}.open`) !== false && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          {...register(`hours.${day}.openTime`)}
                          defaultValue="08:00"
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          {...register(`hours.${day}.closeTime`)}
                          defaultValue="17:00"
                          className="w-32"
                        />
                      </div>
                    )}
                    {watch(`hours.${day}.open`) === false && (
                      <span className="text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : facility
                  ? "Update Facility"
                  : "Create Facility"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
