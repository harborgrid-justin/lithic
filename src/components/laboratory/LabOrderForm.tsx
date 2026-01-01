"use client";

import React, { useState, useEffect } from "react";
import {
  LabOrder,
  LabPanel,
  OrderPriority,
  SpecimenType,
} from "@/types/laboratory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Save } from "lucide-react";
import LaboratoryService from "@/services/laboratory.service";

interface LabOrderFormProps {
  patientId?: string;
  onSuccess?: (order: LabOrder) => void;
  onCancel?: () => void;
}

export default function LabOrderForm({
  patientId,
  onSuccess,
  onCancel,
}: LabOrderFormProps) {
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    patientMRN: "",
    patientDOB: "",
    patientGender: "M" as "M" | "F" | "O" | "U",
    orderingPhysician: "",
    orderingPhysicianNPI: "",
    priority: "ROUTINE" as OrderPriority,
    specimenType: "BLOOD" as SpecimenType,
    diagnosis: "",
    clinicalInfo: "",
  });

  useEffect(() => {
    loadPanels();
  }, []);

  const loadPanels = async () => {
    try {
      const data = await LaboratoryService.getPanels();
      setPanels(data);
    } catch (error) {
      console.error("Failed to load panels:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const order = await LaboratoryService.createOrder({
        patientId: patientId || "PT001",
        patientName: formData.patientName,
        patientDOB: new Date(formData.patientDOB),
        patientGender: formData.patientGender,
        patientMRN: formData.patientMRN,
        orderingPhysician: formData.orderingPhysician,
        orderingPhysicianNPI: formData.orderingPhysicianNPI,
        status: "PENDING",
        priority: formData.priority,
        tests: [],
        panels: selectedPanels,
        diagnosis: formData.diagnosis,
        specimenType: formData.specimenType,
        clinicalInfo: formData.clinicalInfo,
        orderDate: new Date(),
      });

      onSuccess?.(order);
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const togglePanel = (panelCode: string) => {
    setSelectedPanels((prev) =>
      prev.includes(panelCode)
        ? prev.filter((p) => p !== panelCode)
        : [...prev, panelCode],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          New Laboratory Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) =>
                    setFormData({ ...formData, patientName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientMRN">MRN *</Label>
                <Input
                  id="patientMRN"
                  value={formData.patientMRN}
                  onChange={(e) =>
                    setFormData({ ...formData, patientMRN: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientDOB">Date of Birth *</Label>
                <Input
                  id="patientDOB"
                  type="date"
                  value={formData.patientDOB}
                  onChange={(e) =>
                    setFormData({ ...formData, patientDOB: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientGender">Gender *</Label>
                <select
                  id="patientGender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.patientGender}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      patientGender: e.target.value as any,
                    })
                  }
                  required
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                  <option value="U">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ordering Physician */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ordering Physician</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="physician">Physician Name *</Label>
                <Input
                  id="physician"
                  value={formData.orderingPhysician}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orderingPhysician: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npi">NPI</Label>
                <Input
                  id="npi"
                  value={formData.orderingPhysicianNPI}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orderingPhysicianNPI: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Order Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as OrderPriority,
                    })
                  }
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="STAT">STAT</option>
                  <option value="ASAP">ASAP</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specimenType">Specimen Type *</Label>
                <select
                  id="specimenType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.specimenType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specimenType: e.target.value as SpecimenType,
                    })
                  }
                >
                  <option value="BLOOD">Blood</option>
                  <option value="SERUM">Serum</option>
                  <option value="PLASMA">Plasma</option>
                  <option value="URINE">Urine</option>
                  <option value="CSF">CSF</option>
                  <option value="TISSUE">Tissue</option>
                  <option value="SWAB">Swab</option>
                  <option value="SALIVA">Saliva</option>
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  placeholder="Enter diagnosis or ICD-10 code"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="clinicalInfo">Clinical Information</Label>
                <textarea
                  id="clinicalInfo"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.clinicalInfo}
                  onChange={(e) =>
                    setFormData({ ...formData, clinicalInfo: e.target.value })
                  }
                  placeholder="Enter relevant clinical information"
                />
              </div>
            </div>
          </div>

          {/* Test Panels Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Select Test Panels *</h3>
            <div className="grid grid-cols-2 gap-3">
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedPanels.includes(panel.code)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => togglePanel(panel.code)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{panel.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {panel.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {panel.tests.length} tests
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedPanels.includes(panel.code)}
                      onChange={() => togglePanel(panel.code)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || selectedPanels.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
