/**
 * Inventory Manager Component
 * Manage pharmacy inventory with stock levels and expiration tracking
 */

"use client";

import { type InventoryItem } from "@/services/pharmacy.service";

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onRefresh: () => void;
}

export function InventoryManager({
  inventory,
  onRefresh,
}: InventoryManagerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-800";
      case "low-stock":
        return "bg-yellow-100 text-yellow-800";
      case "out-of-stock":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-purple-100 text-purple-800";
      case "recalled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysUntilExpiry = (expirationDate: string) => {
    return Math.floor(
      (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
  };

  if (inventory.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No inventory items found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Drug Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              NDC
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Lot Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Quantity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Location
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Expiration
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Cost/Unit
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {inventory.map((item) => {
            const daysUntilExpiry = getDaysUntilExpiry(item.expirationDate);
            const isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry > 0;

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {item.drug.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.drug.strength} - {item.drug.dosageForm}
                  </div>
                  {item.drug.deaSchedule && (
                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800 mt-1">
                      C-{item.drug.deaSchedule}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-gray-900">
                  {item.drug.ndc}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-500">
                  {item.lotNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.quantity}
                  </div>
                  {item.quantity <= item.reorderLevel && (
                    <div className="text-xs text-yellow-600">
                      Reorder at: {item.reorderLevel}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.location}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(item.expirationDate).toLocaleDateString()}
                  </div>
                  {isExpiringSoon && (
                    <div className="text-xs text-orange-600">
                      {daysUntilExpiry} days
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  ${item.costPerUnit.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
