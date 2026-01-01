'use client';

import { SuperBill as SuperBillType } from '@/types/billing';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, User, Calendar, DollarSign, Printer } from 'lucide-react';

interface SuperBillProps {
  superBill: SuperBillType;
  onPrint?: () => void;
  onConvertToClaim?: () => void;
}

export default function SuperBill({ superBill, onPrint, onConvertToClaim }: SuperBillProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-primary-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8" />
              <h2 className="text-2xl font-bold">SUPERBILL</h2>
            </div>
            <p className="text-primary-100">ID: {superBill.id}</p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm">Date of Service</p>
            <p className="text-xl font-semibold">{formatDate(superBill.dateOfService)}</p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          Patient Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Patient ID</p>
            <p className="font-medium text-gray-900">{superBill.patientId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Patient Name</p>
            <p className="font-medium text-gray-900">{superBill.patientName}</p>
          </div>
        </div>
      </div>

      {/* Provider Information */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Provider Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Provider ID</p>
            <p className="font-medium text-gray-900">{superBill.providerId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Provider Name</p>
            <p className="font-medium text-gray-900">{superBill.providerName}</p>
          </div>
        </div>
      </div>

      {/* Diagnosis Codes */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Diagnosis Codes (ICD-10)</h3>
        <div className="space-y-2">
          {superBill.diagnosis.map((dx) => (
            <div
              key={dx.id}
              className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <code className="px-2 py-1 bg-white border border-green-300 rounded text-sm font-mono font-semibold text-green-700">
                {dx.code}
              </code>
              <span className="flex-1 text-sm text-gray-900">{dx.description}</span>
              {dx.isPrimary && (
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                  PRIMARY
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Procedures */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Procedures & Services</h3>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                CPT Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Modifiers
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Fee
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {superBill.procedures.map((procedure) => (
              <tr key={procedure.code}>
                <td className="px-4 py-3">
                  <code className="text-sm font-mono font-semibold text-primary-600">
                    {procedure.code}
                  </code>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {procedure.description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {procedure.modifiers?.join(', ') || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-right">{procedure.quantity}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatCurrency(procedure.fee)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold">
                  {formatCurrency(procedure.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="bg-gray-50 p-6">
        <div className="flex justify-between items-center max-w-md ml-auto">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">Total Charges:</span>
          </div>
          <span className="text-2xl font-bold text-primary-600">
            {formatCurrency(superBill.totalCharges)}
          </span>
        </div>
      </div>

      {/* Notes */}
      {superBill.notes && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{superBill.notes}</p>
        </div>
      )}

      {/* Status */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">Status: </span>
            <span className="font-semibold text-gray-900 capitalize">
              {superBill.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500">Created: {formatDate(superBill.createdAt)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 bg-white border-t border-gray-200 flex justify-end gap-3">
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
        )}
        {onConvertToClaim && superBill.status === 'completed' && (
          <button
            onClick={onConvertToClaim}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FileText className="w-5 h-5" />
            Convert to Claim
          </button>
        )}
      </div>
    </div>
  );
}
