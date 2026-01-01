/**
 * New Prescription Page
 * Create new prescriptions with drug search and interaction checking
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrescriptionForm } from '@/components/pharmacy/PrescriptionForm';
import { prescriptionService, type Prescription } from '@/services/prescription.service';

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: Omit<Prescription, 'id' | 'rxNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      setSaving(true);
      const prescription = await prescriptionService.createPrescription(data);
      alert('Prescription created successfully');
      router.push(`/pharmacy/prescriptions/${prescription.id}`);
    } catch (error) {
      console.error('Failed to create prescription:', error);
      alert('Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      router.push('/pharmacy/prescriptions');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Prescription</h1>
        <p className="text-gray-600">Create a new prescription</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <PrescriptionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={saving}
        />
      </div>
    </div>
  );
}
