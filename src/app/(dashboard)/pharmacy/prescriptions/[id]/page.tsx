/**
 * Prescription Detail Page
 * View and manage individual prescription details
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { prescriptionService, type Prescription } from '@/services/prescription.service';
import { pharmacyService } from '@/services/pharmacy.service';
import { DrugInfo } from '@/components/pharmacy/DrugInfo';
import { InteractionChecker } from '@/components/pharmacy/InteractionChecker';
import { MedicationLabel } from '@/components/pharmacy/MedicationLabel';

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prescriptionId = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDrugInfo, setShowDrugInfo] = useState(false);
  const [showInteractions, setShowInteractions] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    loadPrescription();
  }, [prescriptionId]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getPrescription(prescriptionId);
      setPrescription(data);
    } catch (error) {
      console.error('Failed to load prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = async (priority: 'routine' | 'priority' | 'urgent' | 'stat') => {
    if (!prescription) return;

    try {
      await prescriptionService.addToDispensingQueue(prescription.id, priority);
      alert('Added to dispensing queue');
      router.push('/pharmacy/dispensing');
    } catch (error) {
      console.error('Failed to add to queue:', error);
      alert('Failed to add to dispensing queue');
    }
  };

  const handleCancel = async () => {
    if (!prescription) return;

    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      await prescriptionService.cancelPrescription(prescription.id, reason);
      alert('Prescription cancelled');
      loadPrescription();
    } catch (error) {
      console.error('Failed to cancel prescription:', error);
      alert('Failed to cancel prescription');
    }
  };

  const handleCreateRefill = async () => {
    if (!prescription) return;

    try {
      const eligibility = await prescriptionService.checkRefillEligibility(prescription.id);

      if (!eligibility.eligible) {
        alert(`Cannot refill: ${eligibility.reason}`);
        return;
      }

      await prescriptionService.createRefillRequest(prescription.id, 'pharmacist');
      alert('Refill request created');
      router.push('/pharmacy/refills');
    } catch (error) {
      console.error('Failed to create refill:', error);
      alert('Failed to create refill request');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading prescription...</div>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Prescription not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Rx #{prescription.rxNumber}</h1>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  prescription.status === 'dispensed'
                    ? 'bg-green-100 text-green-800'
                    : prescription.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : prescription.status === 'active'
                    ? 'bg-blue-100 text-blue-800'
                    : prescription.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {prescription.status}
              </span>
              {prescription.ePrescribed && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                  E-Prescribed
                </span>
              )}
              {prescription.drug?.deaSchedule && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
                  Schedule {prescription.drug.deaSchedule}
                </span>
              )}
            </div>
            <Link href="/pharmacy/prescriptions" className="text-blue-600 hover:text-blue-700 text-sm">
              Back to Prescriptions
            </Link>
          </div>

          <div className="flex gap-2">
            {prescription.status === 'active' && (
              <>
                <button
                  onClick={() => handleAddToQueue('routine')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add to Queue
                </button>
                <button
                  onClick={handleCreateRefill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Refill
                </button>
              </>
            )}
            {prescription.status !== 'cancelled' && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => setShowLabel(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Print Label
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.patientName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(prescription.patientDOB).toLocaleDateString()}
                </dd>
              </div>
              {prescription.patientAllergies && prescription.patientAllergies.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                  <dd className="text-sm text-red-600 mt-1 font-medium">
                    {prescription.patientAllergies.join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Medication Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Medication Information</h2>
              <button
                onClick={() => setShowDrugInfo(!showDrugInfo)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showDrugInfo ? 'Hide' : 'Show'} Drug Info
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">Medication</dt>
                <dd className="text-base text-gray-900 mt-1 font-medium">
                  {prescription.medicationName} {prescription.strength}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">NDC</dt>
                <dd className="text-sm text-gray-900 mt-1 font-mono">{prescription.ndc}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dosage Form</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.dosageForm}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.quantity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Days Supply</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.daysSupply} days</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm font-medium text-gray-500">Directions (SIG)</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.sig}</dd>
              </div>
              {prescription.indication && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Indication</dt>
                  <dd className="text-sm text-gray-900 mt-1">{prescription.indication}</dd>
                </div>
              )}
            </dl>

            {showDrugInfo && prescription.drugId && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <DrugInfo drugId={prescription.drugId} />
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowInteractions(!showInteractions)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showInteractions ? 'Hide' : 'Check'} Drug Interactions
              </button>
              {showInteractions && (
                <div className="mt-4">
                  <InteractionChecker drugIds={[prescription.drugId]} />
                </div>
              )}
            </div>
          </div>

          {/* Prescriber Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescriber Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.prescriberName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">NPI</dt>
                <dd className="text-sm text-gray-900 mt-1 font-mono">{prescription.prescriberNPI}</dd>
              </div>
              {prescription.prescriberDEA && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">DEA</dt>
                  <dd className="text-sm text-gray-900 mt-1 font-mono">{prescription.prescriberDEA}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.prescriberPhone}</dd>
              </div>
            </dl>
          </div>

          {/* Dispensing Information */}
          {prescription.dispensedDate && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dispensing Information</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dispensed Date</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {new Date(prescription.dispensedDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Quantity Dispensed</dt>
                  <dd className="text-sm text-gray-900 mt-1">{prescription.dispensedQuantity}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dispensed By</dt>
                  <dd className="text-sm text-gray-900 mt-1">{prescription.dispensedBy}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Verified By</dt>
                  <dd className="text-sm text-gray-900 mt-1">{prescription.verifiedBy}</dd>
                </div>
                {prescription.lotNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Lot Number</dt>
                    <dd className="text-sm text-gray-900 mt-1 font-mono">{prescription.lotNumber}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Refill Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Refill Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Authorized</dt>
                <dd className="text-sm text-gray-900 mt-1">{prescription.refillsAuthorized}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Remaining</dt>
                <dd className="text-sm text-gray-900 mt-1 font-medium">{prescription.refillsRemaining}</dd>
              </div>
              {prescription.nextRefillDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Next Refill Date</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {new Date(prescription.nextRefillDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Dates</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Written Date</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(prescription.writtenDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(prescription.expirationDate).toLocaleDateString()}
                </dd>
              </div>
              {prescription.lastFilledDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Filled</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {new Date(prescription.lastFilledDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Prior Authorization */}
          {prescription.priorAuthRequired && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Prior Authorization</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Required</dt>
                  <dd className="text-sm text-gray-900 mt-1">Yes</dd>
                </div>
                {prescription.priorAuthStatus && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prescription.priorAuthStatus === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : prescription.priorAuthStatus === 'denied'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {prescription.priorAuthStatus}
                      </span>
                    </dd>
                  </div>
                )}
                {prescription.priorAuthNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Authorization #</dt>
                    <dd className="text-sm text-gray-900 mt-1 font-mono">
                      {prescription.priorAuthNumber}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Notes */}
          {prescription.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-700">{prescription.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Medication Label Modal */}
      {showLabel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Medication Label</h2>
              <button
                onClick={() => setShowLabel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <MedicationLabel prescriptionId={prescription.id} />
          </div>
        </div>
      )}
    </div>
  );
}
