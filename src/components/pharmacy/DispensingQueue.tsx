/**
 * Dispensing Queue Component
 * Display and manage the dispensing workflow queue
 */

'use client';

import { type DispensingQueueItem } from '@/services/prescription.service';

interface DispensingQueueProps {
  items: DispensingQueueItem[];
  onRefresh: () => void;
}

export function DispensingQueue({ items, onRefresh }: DispensingQueueProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No items in dispensing queue
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'priority':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'verification':
        return 'bg-purple-100 text-purple-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'picked-up':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Position
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Priority
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Rx Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Patient
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Medication
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Est. Ready Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Assigned To
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                #{item.queuePosition}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(item.priority)}`}>
                  {item.priority.toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-medium">
                {item.prescription?.rxNumber || 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {item.prescription?.patientName || 'N/A'}
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">
                  {item.prescription?.medicationName || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                  Qty: {item.prescription?.quantity || 'N/A'}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {new Date(item.estimatedReadyTime).toLocaleTimeString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {item.assignedTo || 'Unassigned'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
