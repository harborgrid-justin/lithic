/**
 * Prescription Form Component
 * Form for creating/editing prescriptions
 */

"use client";

import { useState } from "react";
import { type Prescription } from "@/services/prescription.service";
import { pharmacyService } from "@/services/pharmacy.service";
import { DrugSearch } from "./DrugSearch";
import { InteractionChecker } from "./InteractionChecker";

interface PrescriptionFormProps {
  prescription?: Partial<Prescription>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PrescriptionForm({
  prescription,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PrescriptionFormProps) {
  const [formData, setFormData] = useState({
    // Patient Information
    patientId: prescription?.patientId || "",
    patientName: prescription?.patientName || "",
    patientDOB: prescription?.patientDOB || "",
    patientAllergies: prescription?.patientAllergies || [],

    // Prescriber Information
    prescriberId: prescription?.prescriberId || "",
    prescriberName: prescription?.prescriberName || "",
    prescriberNPI: prescription?.prescriberNPI || "",
    prescriberDEA: prescription?.prescriberDEA || "",
    prescriberPhone: prescription?.prescriberPhone || "",

    // Medication Information
    drugId: prescription?.drugId || "",
    ndc: prescription?.ndc || "",
    medicationName: prescription?.medicationName || "",
    strength: prescription?.strength || "",
    dosageForm: prescription?.dosageForm || "",

    // Directions
    quantity: prescription?.quantity || 0,
    daysSupply: prescription?.daysSupply || 0,
    sig: prescription?.sig || "",

    // Refills
    refillsAuthorized: prescription?.refillsAuthorized || 0,
    refillsRemaining: prescription?.refillsRemaining || 0,

    // Dates
    writtenDate:
      prescription?.writtenDate || new Date().toISOString().split("T")[0],

    // Additional
    indication: prescription?.indication || "",
    notes: prescription?.notes || "",
    priorAuthRequired: prescription?.priorAuthRequired || false,
    ePrescribed: prescription?.ePrescribed || false,

    // Status
    status: prescription?.status || "pending",
    type: prescription?.type || "new",
  });

  const [showDrugSearch, setShowDrugSearch] = useState(false);
  const [showInteractions, setShowInteractions] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate days supply when quantity or sig changes
    if (field === "quantity" || field === "sig") {
      const qty = field === "quantity" ? value : formData.quantity;
      const sig = field === "sig" ? value : formData.sig;

      if (qty && sig) {
        const daysSupply = pharmacyService.calculateDaysSupply(
          parseInt(qty),
          sig,
          formData.dosageForm,
        );
        setFormData((prev) => ({ ...prev, daysSupply }));
      }
    }
  };

  const handleDrugSelect = (drug: any) => {
    setFormData((prev) => ({
      ...prev,
      drugId: drug.id,
      ndc: drug.ndc,
      medicationName: drug.name,
      strength: drug.strength,
      dosageForm: drug.dosageForm,
    }));
    setShowDrugSearch(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.patientName || !formData.medicationName) {
      alert("Please fill in all required fields");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Patient Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name *
            </label>
            <input
              type="text"
              required
              value={formData.patientName}
              onChange={(e) => handleChange("patientName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              required
              value={formData.patientDOB}
              onChange={(e) => handleChange("patientDOB", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Prescriber Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Prescriber Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prescriber Name *
            </label>
            <input
              type="text"
              required
              value={formData.prescriberName}
              onChange={(e) => handleChange("prescriberName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NPI *
            </label>
            <input
              type="text"
              required
              value={formData.prescriberNPI}
              onChange={(e) => handleChange("prescriberNPI", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DEA (if controlled)
            </label>
            <input
              type="text"
              value={formData.prescriberDEA}
              onChange={(e) => handleChange("prescriberDEA", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.prescriberPhone}
              onChange={(e) => handleChange("prescriberPhone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Medication Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Medication Information
        </h3>
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowDrugSearch(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search Medication
          </button>
        </div>

        {formData.medicationName && (
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <div className="font-medium text-blue-900">
              {formData.medicationName} {formData.strength}
            </div>
            <div className="text-sm text-blue-700">
              NDC: {formData.ndc} | Form: {formData.dosageForm}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Supply
            </label>
            <input
              type="number"
              value={formData.daysSupply}
              onChange={(e) => handleChange("daysSupply", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              readOnly
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Directions (SIG) *
            </label>
            <input
              type="text"
              required
              value={formData.sig}
              onChange={(e) => handleChange("sig", e.target.value)}
              placeholder="e.g., Take 1 tablet by mouth once daily"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refills Authorized
            </label>
            <input
              type="number"
              min="0"
              value={formData.refillsAuthorized}
              onChange={(e) =>
                handleChange("refillsAuthorized", parseInt(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Written Date *
            </label>
            <input
              type="date"
              required
              value={formData.writtenDate}
              onChange={(e) => handleChange("writtenDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {formData.drugId && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowInteractions(!showInteractions)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showInteractions ? "Hide" : "Check"} Drug Interactions
            </button>
            {showInteractions && (
              <div className="mt-2">
                <InteractionChecker drugIds={[formData.drugId]} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Additional Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indication
            </label>
            <input
              type="text"
              value={formData.indication}
              onChange={(e) => handleChange("indication", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.priorAuthRequired}
                onChange={(e) =>
                  handleChange("priorAuthRequired", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Prior Authorization Required
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? "Saving..." : "Save Prescription"}
        </button>
      </div>

      {/* Drug Search Modal */}
      {showDrugSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Medication
              </h2>
              <button
                type="button"
                onClick={() => setShowDrugSearch(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <DrugSearch onSelect={handleDrugSelect} />
          </div>
        </div>
      )}
    </form>
  );
}
