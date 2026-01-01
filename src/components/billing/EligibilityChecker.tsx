'use client';

import { useState } from 'react';
import { EligibilityResponse } from '@/types/billing';
import { CheckCircle, XCircle, Search, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EligibilityCheckerProps {
  patientId?: string;
  onCheck?: (patientId: string, insuranceId: string) => void;
}

export default function EligibilityChecker({ patientId: initialPatientId, onCheck }: EligibilityCheckerProps) {
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [insuranceId, setInsuranceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/billing/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, insuranceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to check eligibility');
      }

      const data = await response.json();
      setResult(data);
      onCheck?.(patientId, insuranceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Check Insurance Eligibility</h3>
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID *
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance ID *
              </label>
              <input
                type="text"
                value={insuranceId}
                onChange={(e) => setInsuranceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-5 h-5" />
            {isLoading ? 'Checking...' : 'Check Eligibility'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Eligibility Status */}
          <div
            className={`rounded-lg border p-6 ${
              result.isEligible
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.isEligible ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {result.isEligible ? 'Eligible' : 'Not Eligible'}
                </h3>
                <p className="text-sm text-gray-600">
                  Checked on {formatDate(result.checkedAt)}
                </p>
              </div>
            </div>
          </div>

          {result.isEligible && (
            <>
              {/* Coverage Period */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold mb-4">Coverage Period</h4>
                <div className="grid grid-cols-2 gap-4">
                  {result.effectiveDate && (
                    <div>
                      <p className="text-sm text-gray-500">Effective Date</p>
                      <p className="font-medium">{formatDate(result.effectiveDate)}</p>
                    </div>
                  )}
                  {result.terminationDate && (
                    <div>
                      <p className="text-sm text-gray-500">Termination Date</p>
                      <p className="font-medium">{formatDate(result.terminationDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-semibold mb-4">Financial Information</h4>
                <div className="grid grid-cols-4 gap-4">
                  {result.copay !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Copay</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.copay)}
                      </p>
                    </div>
                  )}
                  {result.deductible !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Annual Deductible</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.deductible)}
                      </p>
                    </div>
                  )}
                  {result.deductibleRemaining !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Deductible Remaining</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(result.deductibleRemaining)}
                      </p>
                    </div>
                  )}
                  {result.outOfPocketMax !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Out-of-Pocket Max</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(result.outOfPocketMax)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Benefits */}
              {result.benefits && result.benefits.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-semibold mb-4">Covered Benefits</h4>
                  <div className="space-y-4">
                    {result.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h5 className="font-medium text-gray-900 mb-2">
                          {benefit.serviceType}
                        </h5>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Coverage Level</p>
                            <p className="font-medium">{benefit.coverageLevel}</p>
                          </div>
                          {benefit.inNetworkCoverage !== undefined && (
                            <div>
                              <p className="text-gray-500">In-Network</p>
                              <p className="font-medium text-green-600">
                                {benefit.inNetworkCoverage}%
                              </p>
                            </div>
                          )}
                          {benefit.outOfNetworkCoverage !== undefined && (
                            <div>
                              <p className="text-gray-500">Out-of-Network</p>
                              <p className="font-medium text-orange-600">
                                {benefit.outOfNetworkCoverage}%
                              </p>
                            </div>
                          )}
                        </div>
                        {benefit.limitations && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Limitations:</span>{' '}
                            {benefit.limitations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
