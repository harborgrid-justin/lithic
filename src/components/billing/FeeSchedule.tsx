'use client';

import { useState } from 'react';
import { FeeSchedule as FeeScheduleType, FeeScheduleItem } from '@/types/billing';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Edit, Eye } from 'lucide-react';

interface FeeScheduleProps {
  feeSchedules: FeeScheduleType[];
  onSelect?: (schedule: FeeScheduleType) => void;
}

export default function FeeSchedule({ feeSchedules, onSelect }: FeeScheduleProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<FeeScheduleType | null>(
    feeSchedules.length > 0 ? feeSchedules[0] : null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = selectedSchedule
    ? selectedSchedule.items.filter(
        (item) =>
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Schedule Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fee Schedules</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {feeSchedules.map((schedule) => (
            <button
              key={schedule.id}
              onClick={() => setSelectedSchedule(schedule)}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedSchedule?.id === schedule.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                  <p className="text-sm text-gray-500 capitalize mt-1">{schedule.type}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Effective: {formatDate(schedule.effectiveDate)}
                  </p>
                </div>
                {schedule.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    Active
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedSchedule && (
        <>
          {/* Schedule Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Schedule Name</p>
                <p className="font-semibold text-gray-900">{selectedSchedule.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {selectedSchedule.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Effective Date</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(selectedSchedule.effectiveDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-primary-600">
                  {selectedSchedule.items.length}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Fee Schedule Items */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Fee
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No fee schedule items found
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm font-mono font-semibold text-primary-600">
                            {item.code}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            {item.codeType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(item.fee)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredItems.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Fee</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredItems.length > 0
                    ? formatCurrency(
                        filteredItems.reduce((sum, item) => sum + item.fee, 0) /
                          filteredItems.length
                      )
                    : formatCurrency(0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Highest Fee</p>
                <p className="text-2xl font-bold text-primary-600">
                  {filteredItems.length > 0
                    ? formatCurrency(Math.max(...filteredItems.map((item) => item.fee)))
                    : formatCurrency(0)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedSchedule && feeSchedules.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No fee schedules available</p>
        </div>
      )}
    </div>
  );
}
