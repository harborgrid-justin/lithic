/**
 * Dispensing Queue Page
 * Manage the pharmacy dispensing workflow
 */

'use client';

import { useEffect, useState } from 'react';
import { prescriptionService, type DispensingQueueItem } from '@/services/prescription.service';
import { DispensingQueue } from '@/components/pharmacy/DispensingQueue';

export default function DispensingPage() {
  const [queueItems, setQueueItems] = useState<DispensingQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    assignedTo: '',
  });

  useEffect(() => {
    loadQueue();

    // Refresh queue every 30 seconds
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getDispensingQueue({
        status: filter.status || undefined,
        priority: filter.priority || undefined,
        assignedTo: filter.assignedTo || undefined,
      });
      setQueueItems(data);
    } catch (error) {
      console.error('Failed to load dispensing queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: queueItems.length,
    queued: queueItems.filter(item => item.status === 'queued').length,
    inProgress: queueItems.filter(item => item.status === 'in-progress').length,
    verification: queueItems.filter(item => item.status === 'verification').length,
    ready: queueItems.filter(item => item.status === 'ready').length,
    stat: queueItems.filter(item => item.priority === 'stat').length,
    urgent: queueItems.filter(item => item.priority === 'urgent').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispensing Queue</h1>
            <p className="text-gray-600">Manage prescription filling workflow</p>
          </div>
          <button
            onClick={loadQueue}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Queued</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.queued}</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="text-xs text-gray-600 mb-1">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Verification</div>
            <div className="text-2xl font-bold text-purple-600">{stats.verification}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Ready</div>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <div className="text-xs text-gray-600 mb-1">STAT</div>
            <div className="text-2xl font-bold text-red-600">{stats.stat}</div>
          </div>
          <div className="bg-white rounded-lg border border-orange-200 p-4">
            <div className="text-xs text-gray-600 mb-1">Urgent</div>
            <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="in-progress">In Progress</option>
              <option value="verification">Verification</option>
              <option value="ready">Ready</option>
              <option value="picked-up">Picked Up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="stat">STAT</option>
              <option value="urgent">Urgent</option>
              <option value="priority">Priority</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', priority: '', assignedTo: '' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Queue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading dispensing queue...
          </div>
        ) : (
          <DispensingQueue items={queueItems} onRefresh={loadQueue} />
        )}
      </div>
    </div>
  );
}
