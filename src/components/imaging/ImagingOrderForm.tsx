'use client';

import { useState } from 'react';
import { imagingService, ImagingOrder } from '@/services/imaging.service';

interface ImagingOrderFormProps {
  order?: ImagingOrder;
  patientId?: string;
  patientName?: string;
  patientMRN?: string;
  onSubmit?: (order: ImagingOrder) => void;
  onCancel?: () => void;
}

export default function ImagingOrderForm({
  order,
  patientId,
  patientName,
  patientMRN,
  onSubmit,
  onCancel,
}: ImagingOrderFormProps) {
  const [formData, setFormData] = useState({
    patientId: order?.patientId || patientId || '',
    patientName: order?.patientName || patientName || '',
    patientMRN: order?.patientMRN || patientMRN || '',
    modality: order?.modality || '',
    bodyPart: order?.bodyPart || '',
    procedure: order?.procedure || '',
    procedureCode: order?.procedureCode || '',
    clinicalIndication: order?.clinicalIndication || '',
    orderingPhysician: order?.orderingPhysician || '',
    priority: order?.priority || 'ROUTINE',
    contrast: order?.contrast || false,
    transportRequired: order?.transportRequired || false,
    pregnancyStatus: order?.pregnancyStatus || 'UNKNOWN',
    isolationPrecautions: order?.isolationPrecautions || '',
    notes: order?.notes || '',
    scheduledDate: order?.scheduledDate || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (order?.id) {
        result = await imagingService.updateOrder(order.id, formData);
      } else {
        result = await imagingService.createOrder(formData);
      }
      onSubmit?.(result);
    } catch (err) {
      setError('Failed to save order');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Patient Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MRN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patientMRN"
              value={formData.patientMRN}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID
            </label>
            <input
              type="text"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modality <span className="text-red-500">*</span>
            </label>
            <select
              name="modality"
              value={formData.modality}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Modality</option>
              <option value="CT">CT - Computed Tomography</option>
              <option value="MR">MRI - Magnetic Resonance Imaging</option>
              <option value="XR">X-Ray - Radiography</option>
              <option value="US">Ultrasound</option>
              <option value="NM">Nuclear Medicine</option>
              <option value="PT">PET - Positron Emission Tomography</option>
              <option value="MG">Mammography</option>
              <option value="DX">Digital Radiography</option>
              <option value="CR">Computed Radiography</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Part <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bodyPart"
              value={formData.bodyPart}
              onChange={handleChange}
              required
              placeholder="e.g., Chest, Brain, Abdomen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Procedure <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="procedure"
              value={formData.procedure}
              onChange={handleChange}
              required
              placeholder="e.g., CT Chest with Contrast"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Procedure Code
            </label>
            <input
              type="text"
              name="procedureCode"
              value={formData.procedureCode}
              onChange={handleChange}
              placeholder="CPT Code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clinical Indication <span className="text-red-500">*</span>
          </label>
          <textarea
            name="clinicalIndication"
            value={formData.clinicalIndication}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Reason for examination"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Ordering Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Ordering Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordering Physician <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="orderingPhysician"
              value={formData.orderingPhysician}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date/Time
            </label>
            <input
              type="datetime-local"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="contrast"
                checked={formData.contrast}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Contrast Required
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="transportRequired"
                checked={formData.transportRequired}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Transport Required
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pregnancy Status
              </label>
              <select
                name="pregnancyStatus"
                value={formData.pregnancyStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="POSITIVE">Positive</option>
                <option value="NEGATIVE">Negative</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Isolation Precautions
            </label>
            <input
              type="text"
              name="isolationPrecautions"
              value={formData.isolationPrecautions}
              onChange={handleChange}
              placeholder="e.g., Contact precautions, Airborne precautions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional notes or special instructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : order?.id ? 'Update Order' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}
