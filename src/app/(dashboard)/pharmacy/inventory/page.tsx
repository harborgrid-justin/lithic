/**
 * Pharmacy Inventory Page
 * Manage medication inventory, stock levels, and expiration tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { pharmacyService, type InventoryItem } from '@/services/pharmacy.service';
import { InventoryManager } from '@/components/pharmacy/InventoryManager';

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: searchParams.get('filter') === 'low-stock' ? 'low-stock' : '',
    expiringSoon: searchParams.get('filter') === 'expiring',
  });

  useEffect(() => {
    loadInventory();
  }, [filter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getInventory({
        lowStock: filter.status === 'low-stock',
        expiringSoon: filter.expiringSoon,
      });
      setInventory(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(item => item.status === 'in-stock').length,
    lowStock: inventory.filter(item => item.status === 'low-stock').length,
    outOfStock: inventory.filter(item => item.status === 'out-of-stock').length,
    expired: inventory.filter(item => item.status === 'expired').length,
    recalled: inventory.filter(item => item.status === 'recalled').length,
    expiringSoon: inventory.filter(item => {
      const daysUntilExpiry = Math.floor(
        (new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    }).length,
  };

  const totalValue = inventory.reduce((sum, item) => {
    return sum + (item.quantity * item.costPerUnit);
  }, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pharmacy Inventory</h1>
        <p className="text-gray-600">Manage medication stock levels and track expirations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-600 mb-1">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="text-xs text-gray-600 mb-1">In Stock</div>
          <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="text-xs text-gray-600 mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="text-xs text-gray-600 mb-1">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-4">
          <div className="text-xs text-gray-600 mb-1">Expiring Soon</div>
          <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
        </div>
        <div className="bg-white rounded-lg border border-purple-200 p-4">
          <div className="text-xs text-gray-600 mb-1">Expired</div>
          <div className="text-2xl font-bold text-purple-600">{stats.expired}</div>
        </div>
        <div className="bg-white rounded-lg border border-blue-200 p-4">
          <div className="text-xs text-gray-600 mb-1">Total Value</div>
          <div className="text-lg font-bold text-blue-600">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
              <option value="">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="expired">Expired</option>
              <option value="recalled">Recalled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Filters
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter({ status: 'low-stock', expiringSoon: false })}
                className={`px-3 py-2 rounded-lg text-sm ${
                  filter.status === 'low-stock'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilter({ status: '', expiringSoon: true })}
                className={`px-3 py-2 rounded-lg text-sm ${
                  filter.expiringSoon
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Expiring Soon
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', expiringSoon: false })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading inventory...
          </div>
        ) : (
          <InventoryManager inventory={inventory} onRefresh={loadInventory} />
        )}
      </div>
    </div>
  );
}
