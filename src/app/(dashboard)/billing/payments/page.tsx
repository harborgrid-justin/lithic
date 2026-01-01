'use client';

import { useState, useEffect } from 'react';
import { Payment } from '@/types/billing';
import PaymentPosting from '@/components/billing/PaymentPosting';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { DollarSign, Filter, Calendar } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPostingForm, setShowPostingForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'insurance' | 'patient'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/billing/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostPayment = async (paymentData: Partial<Payment>) => {
    try {
      const response = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        alert('Payment posted successfully!');
        setShowPostingForm(false);
        fetchPayments();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to post payment'}`);
      }
    } catch (error) {
      console.error('Error posting payment:', error);
      alert('Failed to post payment');
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    return payment.paymentMethod === filter;
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-2">View and post payments</p>
        </div>
        <button
          onClick={() => setShowPostingForm(!showPostingForm)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <DollarSign className="w-5 h-5" />
          Post Payment
        </button>
      </div>

      {/* Payment Posting Form */}
      {showPostingForm && (
        <PaymentPosting
          patientId="TEMP"
          patientName="Select Patient"
          balanceDue={0}
          onPost={handlePostPayment}
          onCancel={() => setShowPostingForm(false)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Total Amount</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totalPayments)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">This Month</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(
              payments
                .filter((p) => {
                  const paymentDate = new Date(p.paymentDate);
                  const now = new Date();
                  return (
                    paymentDate.getMonth() === now.getMonth() &&
                    paymentDate.getFullYear() === now.getFullYear()
                  );
                })
                .reduce((sum, p) => sum + p.amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="insurance">Insurance</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit Card</option>
            <option value="ach">ACH</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading payments...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Posted By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {payment.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.referenceNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.postedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
