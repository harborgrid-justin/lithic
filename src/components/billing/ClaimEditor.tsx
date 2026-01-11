"use client";

/**
 * Lithic Enterprise v0.3 - Claim Editor Component
 * Full-featured claim editing with validation
 */

import { useState } from "react";
import type { Claim, Charge, ClaimStatus } from "@/types/billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertCircle, CheckCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClaimEditorProps {
  claim?: Claim;
  onSave: (claim: Partial<Claim>) => Promise<void>;
  onCancel: () => void;
}

export function ClaimEditor({ claim, onSave, onCancel }: ClaimEditorProps) {
  const [formData, setFormData] = useState<Partial<Claim>>(
    claim || {
      status: "DRAFT" as ClaimStatus,
      charges: [],
      secondaryDiagnoses: [],
    }
  );
  const [charges, setCharges] = useState<Partial<Charge>[]>(
    claim?.charges || [{}]
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddCharge = () => {
    setCharges([...charges, {}]);
  };

  const handleRemoveCharge = (index: number) => {
    const newCharges = charges.filter((_, i) => i !== index);
    setCharges(newCharges);
  };

  const handleChargeChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const newCharges = [...charges];
    (newCharges[index] as any)[field] = value;

    // Auto-calculate total charge
    if (field === "quantity" || field === "unitPrice") {
      const charge = newCharges[index];
      if (charge.quantity && charge.unitPrice) {
        charge.totalCharge = charge.quantity * charge.unitPrice;
      }
    }

    setCharges(newCharges);
  };

  const validateClaim = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.patientId) {
      newErrors.push("Patient is required");
    }

    if (!formData.insuranceId) {
      newErrors.push("Insurance is required");
    }

    if (!formData.primaryDiagnosis) {
      newErrors.push("Primary diagnosis is required");
    }

    if (charges.length === 0 || !charges[0].cptCode) {
      newErrors.push("At least one charge is required");
    }

    charges.forEach((charge, idx) => {
      if (charge.cptCode && !charge.quantity) {
        newErrors.push(`Charge ${idx + 1}: Quantity is required`);
      }
      if (charge.cptCode && !charge.unitPrice) {
        newErrors.push(`Charge ${idx + 1}: Unit price is required`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateClaim()) {
      return;
    }

    setSaving(true);
    try {
      const claimData = {
        ...formData,
        charges: charges.filter((c) => c.cptCode) as Charge[],
      };
      await onSave(claimData);
    } catch (error) {
      setErrors(["Failed to save claim"]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <Alert variant="danger">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Claim Header */}
      <Card>
        <CardHeader>
          <CardTitle>Claim Information</CardTitle>
          <CardDescription>
            {claim ? `Editing claim ${claim.claimNumber}` : "Creating new claim"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patient ID</Label>
              <Input
                value={formData.patientId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, patientId: e.target.value })
                }
                placeholder="Search patient..."
              />
            </div>

            <div className="space-y-2">
              <Label>Insurance</Label>
              <Select
                value={formData.insuranceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, insuranceId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ins-1">Primary Insurance</SelectItem>
                  <SelectItem value="ins-2">Secondary Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={
                  formData.serviceDate
                    ? new Date(formData.serviceDate).toISOString().split("T")[0] || ""
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serviceDate: new Date(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Place of Service</Label>
              <Select
                value={formData.placeOfService}
                onValueChange={(value) =>
                  setFormData({ ...formData, placeOfService: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select POS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Office (11)</SelectItem>
                  <SelectItem value="21">Inpatient Hospital (21)</SelectItem>
                  <SelectItem value="22">Outpatient Hospital (22)</SelectItem>
                  <SelectItem value="23">Emergency Room (23)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Primary Diagnosis (ICD-10)</Label>
            <Input
              value={formData.primaryDiagnosis || ""}
              onChange={(e) =>
                setFormData({ ...formData, primaryDiagnosis: e.target.value })
              }
              placeholder="e.g., E11.9"
            />
          </div>

          <div className="space-y-2">
            <Label>Prior Authorization Number (if applicable)</Label>
            <Input
              value={formData.priorAuthNumber || ""}
              onChange={(e) =>
                setFormData({ ...formData, priorAuthNumber: e.target.value })
              }
              placeholder="Auth number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charges */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Charges</CardTitle>
              <CardDescription>Add CPT/HCPCS codes and charges</CardDescription>
            </div>
            <Button onClick={handleAddCharge} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Charge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {charges.map((charge, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>CPT/HCPCS Code</Label>
                    <Input
                      value={charge.cptCode || ""}
                      onChange={(e) =>
                        handleChargeChange(index, "cptCode", e.target.value)
                      }
                      placeholder="e.g., 99213"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={charge.quantity || ""}
                      onChange={(e) =>
                        handleChargeChange(
                          index,
                          "quantity",
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={charge.unitPrice || ""}
                      onChange={(e) =>
                        handleChargeChange(
                          index,
                          "unitPrice",
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={charge.totalCharge || ""}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="danger"
                      size="icon"
                      onClick={() => handleRemoveCharge(index)}
                      disabled={charges.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Description</Label>
                  <Input
                    value={charge.cptDescription || ""}
                    onChange={(e) =>
                      handleChargeChange(index, "cptDescription", e.target.value)
                    }
                    placeholder="Service description"
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Charges:</span>
              <span className="text-2xl font-bold">
                ${charges
                  .reduce((sum, c) => sum + (c.totalCharge || 0), 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Claim
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
