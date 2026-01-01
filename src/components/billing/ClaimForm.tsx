"use client";

import { useState } from "react";
import { Claim, ClaimCode, DiagnosisCode } from "@/types/billing";
import { Plus, Trash2, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ClaimFormProps {
  claim?: Partial<Claim>;
  onSubmit: (data: Partial<Claim>) => void;
  onCancel?: () => void;
}

export default function ClaimForm({
  claim,
  onSubmit,
  onCancel,
}: ClaimFormProps) {
  const [formData, setFormData] = useState<Partial<Claim>>(
    claim || {
      codes: [],
      diagnosis: [],
    },
  );

  const addProcedureCode = () => {
    const newCode: ClaimCode = {
      id: `temp-${Date.now()}`,
      type: "CPT",
      code: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setFormData({
      ...formData,
      codes: [...(formData.codes || []), newCode],
    });
  };

  const removeProcedureCode = (index: number) => {
    const codes = [...(formData.codes || [])];
    codes.splice(index, 1);
    setFormData({ ...formData, codes });
  };

  const updateProcedureCode = (
    index: number,
    field: keyof ClaimCode,
    value: any,
  ) => {
    const codes = [...(formData.codes || [])];
    codes[index] = { ...codes[index], [field]: value };

    // Auto-calculate total price
    if (field === "quantity" || field === "unitPrice") {
      codes[index].totalPrice = codes[index].quantity * codes[index].unitPrice;
    }

    setFormData({ ...formData, codes });
  };

  const addDiagnosis = () => {
    const newDiagnosis: DiagnosisCode = {
      id: `temp-${Date.now()}`,
      code: "",
      description: "",
      isPrimary: (formData.diagnosis || []).length === 0,
    };
    setFormData({
      ...formData,
      diagnosis: [...(formData.diagnosis || []), newDiagnosis],
    });
  };

  const removeDiagnosis = (index: number) => {
    const diagnosis = [...(formData.diagnosis || [])];
    diagnosis.splice(index, 1);
    setFormData({ ...formData, diagnosis });
  };

  const updateDiagnosis = (
    index: number,
    field: keyof DiagnosisCode,
    value: any,
  ) => {
    const diagnosis = [...(formData.diagnosis || [])];
    diagnosis[index] = { ...diagnosis[index], [field]: value };
    setFormData({ ...formData, diagnosis });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const totalAmount = (formData.codes || []).reduce(
    (sum, code) => sum + code.totalPrice,
    0,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient & Insurance Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Patient & Insurance Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID
            </label>
            <input
              type="text"
              value={formData.patientId || ""}
              onChange={(e) =>
                setFormData({ ...formData, patientId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name
            </label>
            <input
              type="text"
              value={formData.patientName || ""}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance ID
            </label>
            <input
              type="text"
              value={formData.insuranceId || ""}
              onChange={(e) =>
                setFormData({ ...formData, insuranceId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance Name
            </label>
            <input
              type="text"
              value={formData.insuranceName || ""}
              onChange={(e) =>
                setFormData({ ...formData, insuranceName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider ID
            </label>
            <input
              type="text"
              value={formData.providerId || ""}
              onChange={(e) =>
                setFormData({ ...formData, providerId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Service
            </label>
            <input
              type="date"
              value={formData.dateOfService || ""}
              onChange={(e) =>
                setFormData({ ...formData, dateOfService: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Diagnosis Codes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Diagnosis Codes (ICD-10)</h3>
          <button
            type="button"
            onClick={addDiagnosis}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add Diagnosis
          </button>
        </div>
        <div className="space-y-3">
          {(formData.diagnosis || []).map((dx, index) => (
            <div key={dx.id} className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="ICD Code"
                value={dx.code}
                onChange={(e) => updateDiagnosis(index, "code", e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={dx.description}
                onChange={(e) =>
                  updateDiagnosis(index, "description", e.target.value)
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <label className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={dx.isPrimary}
                  onChange={(e) =>
                    updateDiagnosis(index, "isPrimary", e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Primary</span>
              </label>
              <button
                type="button"
                onClick={() => removeDiagnosis(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Procedure Codes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Procedure Codes (CPT/HCPCS)</h3>
          <button
            type="button"
            onClick={addProcedureCode}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add Procedure
          </button>
        </div>
        <div className="space-y-3">
          {(formData.codes || []).map((code, index) => (
            <div key={code.id} className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="CPT Code"
                value={code.code}
                onChange={(e) =>
                  updateProcedureCode(index, "code", e.target.value)
                }
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={code.description}
                onChange={(e) =>
                  updateProcedureCode(index, "description", e.target.value)
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="number"
                placeholder="Qty"
                value={code.quantity}
                onChange={(e) =>
                  updateProcedureCode(
                    index,
                    "quantity",
                    parseInt(e.target.value) || 0,
                  )
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                required
              />
              <input
                type="number"
                placeholder="Unit Price"
                value={code.unitPrice}
                onChange={(e) =>
                  updateProcedureCode(
                    index,
                    "unitPrice",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                step="0.01"
                min="0"
                required
              />
              <div className="w-32 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-right font-medium">
                {formatCurrency(code.totalPrice)}
              </div>
              <button
                type="button"
                onClick={() => removeProcedureCode(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Enter any additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Save className="w-5 h-5" />
          Save Claim
        </button>
      </div>
    </form>
  );
}
