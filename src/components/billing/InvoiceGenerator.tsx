'use client';

import { useState } from 'react';
import { Invoice, InvoiceItem } from '@/types/billing';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { formatCurrency, generateInvoiceNumber } from '@/lib/billing-utils';

interface InvoiceGeneratorProps {
  invoice?: Partial<Invoice>;
  onGenerate: (data: Partial<Invoice>) => void;
  onCancel?: () => void;
}

export default function InvoiceGenerator({
  invoice,
  onGenerate,
  onCancel,
}: InvoiceGeneratorProps) {
  const [formData, setFormData] = useState<Partial<Invoice>>(
    invoice || {
      invoiceNumber: generateInvoiceNumber(),
      items: [],
      tax: 0,
    }
  );

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `temp-${Date.now()}`,
      description: '',
      code: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem],
    });
  };

  const removeItem = (index: number) => {
    const items = [...(formData.items || [])];
    items.splice(index, 1);
    setFormData({ ...formData, items });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const items = [...(formData.items || [])];
    items[index] = { ...items[index], [field]: value };

    // Auto-calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      items[index].total = items[index].quantity * items[index].unitPrice;
    }

    setFormData({ ...formData, items });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate totals
    const subtotal = (formData.items || []).reduce(
      (sum, item) => sum + item.total,
      0
    );
    const tax = formData.tax || 0;
    const total = subtotal + tax;

    const invoiceData: Partial<Invoice> = {
      ...formData,
      subtotal,
      total,
      balance: total,
      paidAmount: 0,
      status: 'draft',
    };

    onGenerate(invoiceData);
  };

  const subtotal = (formData.items || []).reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + (formData.tax || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Invoice Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-semibold">Generate Invoice</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID *
            </label>
            <input
              type="text"
              value={formData.patientId || ''}
              onChange={(e) =>
                setFormData({ ...formData, patientId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name *
            </label>
            <input
              type="text"
              value={formData.patientName || ''}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Service *
            </label>
            <input
              type="date"
              value={formData.dateOfService || ''}
              onChange={(e) =>
                setFormData({ ...formData, dateOfService: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate || ''}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Line Items</h4>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {(formData.items || []).map((item, index) => (
            <div key={item.id} className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) =>
                  updateItem(index, 'description', e.target.value)
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="text"
                placeholder="Code"
                value={item.code || ''}
                onChange={(e) => updateItem(index, 'code', e.target.value)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, 'quantity', parseInt(e.target.value) || 0)
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                required
              />
              <input
                type="number"
                placeholder="Unit Price"
                value={item.unitPrice}
                onChange={(e) =>
                  updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                }
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                step="0.01"
                min="0"
                required
              />
              <div className="w-32 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-right font-medium">
                {formatCurrency(item.total)}
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {(formData.items || []).length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No items added. Click &quot;Add Item&quot; to get started.
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Tax:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.tax || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tax: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Save className="w-5 h-5" />
          Generate Invoice
        </button>
      </div>
    </form>
  );
}
