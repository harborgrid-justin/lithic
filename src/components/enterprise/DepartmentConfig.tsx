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
import {
  Department,
  DepartmentType,
  CreateDepartmentDto,
} from "@/types/enterprise";
import toast from "react-hot-toast";

interface DepartmentConfigProps {
  department?: Department | null;
  facilityId: string;
  onClose: () => void;
  onSave: () => void;
}

export function DepartmentConfig({
  department,
  facilityId,
  onClose,
  onSave,
}: DepartmentConfigProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    if (department) {
      setValue("name", department.name);
      setValue("code", department.code);
      setValue("type", department.type);
      setValue("manager", department.manager);
      setValue("costCenter", department.costCenter);
      setValue("glCode", department.glCode);
      setValue("location", department.location);
      setValue("phone", department.phone);
      setValue("email", department.email);
    }
  }, [department, setValue]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const deptData: CreateDepartmentDto = {
        facilityId,
        name: data.name,
        code: data.code,
        type: data.type,
        manager: data.manager || null,
      };

      const url = department
        ? `/api/enterprise/departments/${department.id}`
        : "/api/enterprise/departments";
      const method = department ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          department ? { ...deptData, id: department.id } : deptData,
        ),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          department
            ? "Department updated successfully"
            : "Department created successfully",
        );
        onSave();
      } else {
        toast.error(result.error?.message || "Failed to save department");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      toast.error("Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {department ? "Edit Department" : "New Department"}
          </DialogTitle>
          <DialogDescription>
            {department
              ? "Update department information and settings"
              : "Create a new department within the facility"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: true })}
                    placeholder="Cardiology"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Department Code *</Label>
                  <Input
                    id="code"
                    {...register("code", { required: true })}
                    placeholder="CARD-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Department Type *</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DepartmentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costCenter">Cost Center</Label>
                  <Input
                    id="costCenter"
                    {...register("costCenter")}
                    placeholder="CC-1234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="glCode">GL Code</Label>
                  <Input
                    id="glCode"
                    {...register("glCode")}
                    placeholder="GL-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Department Manager</Label>
                <Input
                  id="manager"
                  {...register("manager")}
                  placeholder="Manager User ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="Building A, Floor 3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="dept@example.com"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4 mt-4">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Staff Assignments</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Staff assignment functionality coming soon
                </p>
                <Button variant="outline" disabled>
                  Add Staff Member
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-4 mt-4">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Budget Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiscalYear">Fiscal Year</Label>
                    <Input
                      id="fiscalYear"
                      type="number"
                      {...register("budget.fiscalYear")}
                      placeholder="2024"
                      defaultValue={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalBudget">Total Budget</Label>
                    <Input
                      id="totalBudget"
                      type="number"
                      {...register("budget.totalBudget")}
                      placeholder="1000000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personnelBudget">Personnel Budget</Label>
                    <Input
                      id="personnelBudget"
                      type="number"
                      {...register("budget.personnelBudget")}
                      placeholder="600000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operatingBudget">Operating Budget</Label>
                    <Input
                      id="operatingBudget"
                      type="number"
                      {...register("budget.operatingBudget")}
                      placeholder="300000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capitalBudget">Capital Budget</Label>
                    <Input
                      id="capitalBudget"
                      type="number"
                      {...register("budget.capitalBudget")}
                      placeholder="100000"
                    />
                  </div>
                </div>
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
                : department
                  ? "Update Department"
                  : "Create Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
