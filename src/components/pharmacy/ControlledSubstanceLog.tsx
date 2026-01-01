/**
 * Controlled Substance Log Component
 * Display controlled substance transaction log
 */

'use client';

import { type ControlledSubstanceLog as CSLog } from '@/services/pharmacy.service';

interface ControlledSubstanceLogProps {
  logs: CSLog[];
  onRefresh: () => void;
}

export function ControlledSubstanceLog({ logs, onRefresh }: ControlledSubstanceLogProps) {
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'receive':
        return 'bg-green-100 text-green-800';
      case 'dispense':
        return 'bg-blue-100 text-blue-800';
      case 'waste':
        return 'bg-orange-100 text-orange-800';
      case 'transfer':
        return 'bg-purple-100 text-purple-800';
      case 'inventory-count':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No controlled substance transactions found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date/Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Transaction Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Drug Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              NDC
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Schedule
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Quantity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Lot Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Dispensed/Received By
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Verified By
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Patient/Rx
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getTransactionColor(log.transactionType)}`}>
                  {log.transactionType}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900">
                  {log.drug?.name || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  {log.drug?.strength} - {log.drug?.dosageForm}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-900">
                {log.ndc}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">
                  C-{log.drug?.deaSchedule || 'N/A'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {log.quantity}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">
                {log.lotNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {log.dispensedBy || 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {log.verifiedBy || 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {log.patientId && <div>Patient: {log.patientId}</div>}
                {log.prescriptionId && <div className="text-xs">Rx: {log.prescriptionId}</div>}
                {!log.patientId && !log.prescriptionId && 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
