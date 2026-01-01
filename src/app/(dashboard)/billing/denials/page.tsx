'use client';

import { useState, useEffect } from 'react';
import { Denial } from '@/types/billing';
import DenialManager from '@/components/billing/DenialManager';
import { AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';

export default function DenialsPage() {
  const [denials, setDenials] = useState<Denial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from API
    const mockDenials: Denial[] = [
      {
        id: '1',
        claimId: 'claim-1',
        claimNumber: 'CLM-123456',
        patientName: 'John Doe',
        denialDate: '2024-01-15',
        denialReason: 'coding_error',
        denialDetails: 'Invalid CPT code combination',
        deniedAmount: 250,
        status: 'pending',
        priority: 'high',
        appealDeadline: '2024-02-15',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
      },
      {
        id: '2',
        claimId: 'claim-2',
        claimNumber: 'CLM-123457',
        patientName: 'Jane Smith',
        denialDate: '2024-01-14',
        denialReason: 'authorization_required',
        denialDetails: 'Prior authorization not obtained',
        deniedAmount: 500,
        status: 'in_progress',
        priority: 'medium',
        appealDeadline: '2024-02-14',
        createdAt: '2024-01-14',
        updatedAt: '2024-01-16',
      },
    ];

    setTimeout(() => {
      setDenials(mockDenials);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleUpdateDenial = async (id: string, data: Partial<Denial>) => {
    // Update denial
    setDenials((prev) =>
      prev.map((denial) =>
        denial.id === id ? { ...denial, ...data, updatedAt: new Date().toISOString() } : denial
      )
    );
  };

  const handleAppeal = async (id: string, notes: string) => {
    // Appeal denial
    setDenials((prev) =>
      prev.map((denial) =>
        denial.id === id
          ? {
              ...denial,
              status: 'appealed',
              appealDate: new Date().toISOString(),
              appealNotes: notes,
              updatedAt: new Date().toISOString(),
            }
          : denial
      )
    );
    alert('Appeal submitted successfully!');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Denial Management</h1>
        <p className="text-gray-600 mt-2">
          Work denied claims and submit appeals
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-2">
              Denial Management Best Practices
            </h3>
            <p className="text-sm text-orange-800 mb-3">
              Effective denial management is critical to maintaining healthy revenue cycle
              performance. Follow these guidelines:
            </p>
            <ul className="space-y-1 text-sm text-orange-800">
              <li className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Work high-priority denials first (high-value, approaching appeal deadline)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Document all actions and communications in denial notes
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Submit appeals before the deadline (typically 30-90 days)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Include supporting documentation with all appeals
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Denial Manager */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading denials...</p>
        </div>
      ) : (
        <DenialManager
          denials={denials}
          onUpdateDenial={handleUpdateDenial}
          onAppeal={handleAppeal}
        />
      )}
    </div>
  );
}
