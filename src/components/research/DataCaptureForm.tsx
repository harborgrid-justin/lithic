/**
 * Data Capture Form Component
 * Lithic Healthcare Platform v0.5
 */

"use client";

import { useState } from "react";
import { DataCaptureForm, FormField, FieldType } from "@/types/research";
import { useResearchData } from "@/hooks/useResearchData";

interface DataCaptureFormProps {
  form: DataCaptureForm;
  instanceId: string;
  initialData?: Record<string, any>;
}

export function DataCaptureFormComponent({ form, instanceId, initialData = {} }: DataCaptureFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const { updateFormData, loading } = useResearchData();

  const handleFieldChange = async (field: FormField, value: any) => {
    setFormData(prev => ({ ...prev, [field.fieldName]: value }));

    try {
      await updateFormData(instanceId, field.fieldName, value);
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.fieldName] || "";

    switch (field.fieldType) {
      case FieldType.TEXT:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required={field.required}
          />
        );

      case FieldType.NUMBER:
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required={field.required}
          />
        );

      case FieldType.DATE:
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required={field.required}
          />
        );

      case FieldType.DROPDOWN:
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case FieldType.TEXTAREA:
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={4}
            required={field.required}
          />
        );

      case FieldType.CHECKBOX:
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleFieldChange(field, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            required={field.required}
          />
        );

      default:
        return <p className="text-gray-500">Unsupported field type</p>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{form.name}</h2>
      <p className="text-gray-600 mb-6">{form.description}</p>

      <div className="space-y-6">
        {form.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>
            )}
            {renderField(field)}
            {field.units && (
              <p className="text-xs text-gray-500 mt-1">Units: {field.units}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Save Draft
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={loading}>
          {loading ? "Saving..." : "Submit Form"}
        </button>
      </div>
    </div>
  );
}
