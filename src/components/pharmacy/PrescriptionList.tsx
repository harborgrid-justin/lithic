/**
 * Prescription List Component
 * Display list of prescriptions with actions
 */

'use client';

import Link from 'next/link';
import { type Prescription } from '@/services/prescription.service';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  onRefresh?: () => void;
}

export function PrescriptionList({ prescriptions, onRefresh }: PrescriptionListProps) {
  if (prescriptions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No prescriptions found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rx Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Medication
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qty / Days Supply
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prescriber
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Written Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Refills
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {prescriptions.map((prescription) => (
            <tr key={prescription.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <Link
                  href={`/pharmacy/prescriptions/${prescription.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {prescription.rxNumber}
                </Link>
                {prescription.ePrescribed && (
                  <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                    E-Rx
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {prescription.patientName}
                </div>
                <div className="text-xs text-gray-500">
                  DOB: {new Date(prescription.patientDOB).toLocaleDateString()}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">
                  {prescription.medicationName}
                </div>
                <div className="text-xs text-gray-500">
                  {prescription.strength} - {prescription.dosageForm}
                </div>
                {prescription.drug?.deaSchedule && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800 mt-1">
                    C-{prescription.drug.deaSchedule}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {prescription.quantity} / {prescription.daysSupply}d
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">{prescription.prescriberName}</div>
                <div className="text-xs text-gray-500">NPI: {prescription.prescriberNPI}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    prescription.status === 'dispensed'
                      ? 'bg-green-100 text-green-800'
                      : prescription.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : prescription.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : prescription.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : prescription.status === 'expired'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {prescription.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {new Date(prescription.writtenDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {prescription.refillsRemaining} / {prescription.refillsAuthorized}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
