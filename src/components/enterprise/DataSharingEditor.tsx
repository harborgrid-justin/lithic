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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DataSharingAgreement,
  AgreementType,
  AgreementPurpose,
  DataType,
  ComplianceFramework,
  CreateDataSharingAgreementDto,
} from "@/types/enterprise";
import { useOrganization } from "@/hooks/useOrganization";
import toast from "react-hot-toast";

interface DataSharingEditorProps {
  agreement?: DataSharingAgreement | null;
  onClose: () => void;
  onSave: () => void;
}

export function DataSharingEditor({
  agreement,
  onClose,
  onSave,
}: DataSharingEditorProps) {
  const { organization } = useOrganization();
  const [saving, setSaving] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataType[]>([]);
  const [selectedCompliance, setSelectedCompliance] = useState<
    ComplianceFramework[]
  >([]);
  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    if (agreement) {
      setValue("name", agreement.name);
      setValue("type", agreement.type);
      setValue("purpose", agreement.purpose);
      setValue("targetOrganizationId", agreement.targetOrganizationId);
      setValue("effectiveDate", agreement.effectiveDate);
      setValue("expiryDate", agreement.expiryDate);
      setSelectedDataTypes(agreement.dataTypes);
      setSelectedCompliance(agreement.complianceFramework);
    } else {
      // Set defaults for new agreement
      setSelectedCompliance([ComplianceFramework.HIPAA]);
    }
  }, [agreement, setValue]);

  const toggleDataType = (dataType: DataType) => {
    setSelectedDataTypes((prev) =>
      prev.includes(dataType)
        ? prev.filter((t) => t !== dataType)
        : [...prev, dataType],
    );
  };

  const toggleCompliance = (framework: ComplianceFramework) => {
    setSelectedCompliance((prev) =>
      prev.includes(framework)
        ? prev.filter((f) => f !== framework)
        : [...prev, framework],
    );
  };

  const onSubmit = async (data: any) => {
    if (!organization) return;

    if (selectedDataTypes.length === 0) {
      toast.error("Please select at least one data type");
      return;
    }

    if (selectedCompliance.length === 0) {
      toast.error("Please select at least one compliance framework");
      return;
    }

    setSaving(true);
    try {
      const agreementData: CreateDataSharingAgreementDto = {
        name: data.name,
        sourceOrganizationId: organization.id,
        targetOrganizationId: data.targetOrganizationId,
        type: data.type,
        purpose: data.purpose,
        dataTypes: selectedDataTypes,
        accessRules: [], // Will be configured later
        effectiveDate: new Date(data.effectiveDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        complianceFramework: selectedCompliance,
      };

      const url = agreement
        ? `/api/enterprise/data-sharing/${agreement.id}`
        : "/api/enterprise/data-sharing";
      const method = agreement ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          agreement ? { ...agreementData, id: agreement.id } : agreementData,
        ),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          agreement
            ? "Agreement updated successfully"
            : "Agreement created successfully",
        );
        onSave();
      } else {
        toast.error(result.error?.message || "Failed to save agreement");
      }
    } catch (error) {
      console.error("Error saving agreement:", error);
      toast.error("Failed to save agreement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agreement
              ? "Edit Data Sharing Agreement"
              : "New Data Sharing Agreement"}
          </DialogTitle>
          <DialogDescription>
            {agreement
              ? "Update data sharing agreement details and permissions"
              : "Create a new inter-organizational data sharing agreement"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="data">Data Types</TabsTrigger>
              <TabsTrigger value="access">Access Rules</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agreement Name *</Label>
                <Input
                  id="name"
                  {...register("name", { required: true })}
                  placeholder="Patient Care Coordination Agreement"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Agreement Type *</Label>
                  <Select
                    value={watch("type")}
                    onValueChange={(value) => setValue("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AgreementType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Select
                    value={watch("purpose")}
                    onValueChange={(value) => setValue("purpose", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AgreementPurpose).map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetOrganizationId">
                  Partner Organization *
                </Label>
                <Input
                  id="targetOrganizationId"
                  {...register("targetOrganizationId", { required: true })}
                  placeholder="Organization ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date *</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    {...register("effectiveDate", { required: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    {...register("expiryDate")}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Data Types to Share *</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which types of data will be included in this agreement
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.values(DataType).map((dataType) => (
                  <div
                    key={dataType}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDataTypes.includes(dataType)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleDataType(dataType)}
                  >
                    <Checkbox
                      id={`data-${dataType}`}
                      checked={selectedDataTypes.includes(dataType)}
                      onCheckedChange={() => toggleDataType(dataType)}
                    />
                    <label
                      htmlFor={`data-${dataType}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {dataType.replace(/_/g, " ")}
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Data Types:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDataTypes.length > 0 ? (
                    selectedDataTypes.map((type) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No data types selected
                    </span>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-4">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">
                  Access Rules Configuration
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Define specific access rules for each data type. This feature
                  will be available after creating the basic agreement.
                </p>
                <Button variant="outline" disabled>
                  Configure Access Rules
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Compliance Frameworks *</Label>
                <p className="text-sm text-muted-foreground">
                  Select applicable compliance and regulatory frameworks
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.values(ComplianceFramework).map((framework) => (
                  <div
                    key={framework}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCompliance.includes(framework)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => toggleCompliance(framework)}
                  >
                    <Checkbox
                      id={`compliance-${framework}`}
                      checked={selectedCompliance.includes(framework)}
                      onCheckedChange={() => toggleCompliance(framework)}
                    />
                    <label
                      htmlFor={`compliance-${framework}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {framework}
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Compliance Requirements:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    All data transfers will be encrypted in transit and at rest
                  </li>
                  <li>Access will be logged and audited automatically</li>
                  <li>Data retention policies will be enforced</li>
                  <li>User consent will be verified before data sharing</li>
                </ul>
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
                : agreement
                  ? "Update Agreement"
                  : "Create Agreement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
