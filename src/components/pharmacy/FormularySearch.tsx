/**
 * Formulary Search Component
 * Display formulary search results with tier and coverage information
 */

'use client';

import { type FormularyEntry } from '@/services/pharmacy.service';

interface FormularySearchProps {
  results: FormularyEntry[];
}

export function FormularySearch({ results }: FormularySearchProps) {
  const getTierBadge = (tier: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      1: 'Tier 1 - Generic',
      2: 'Tier 2 - Preferred Brand',
      3: 'Tier 3 - Non-Preferred',
      4: 'Tier 4 - Specialty',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${colors[tier as keyof typeof colors]}`}>
        {labels[tier as keyof typeof labels]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      preferred: 'bg-green-100 text-green-800',
      'non-preferred': 'bg-yellow-100 text-yellow-800',
      restricted: 'bg-red-100 text-red-800',
      'not-covered': 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="divide-y divide-gray-200">
      {results.map((entry) => (
        <div key={entry.id} className="p-6 hover:bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {entry.drug.brandName || entry.drug.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {entry.drug.genericName} {entry.drug.strength} - {entry.drug.dosageForm}
              </p>
              <p className="text-xs text-gray-500 font-mono mt-1">
                NDC: {entry.drug.ndc}
              </p>
            </div>
            <div className="ml-4 flex flex-col gap-2">
              {getTierBadge(entry.tier)}
              {getStatusBadge(entry.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Prior Auth:</span>
              <span className={`ml-2 ${entry.priorAuthRequired ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                {entry.priorAuthRequired ? 'Required' : 'Not Required'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Step Therapy:</span>
              <span className={`ml-2 ${entry.stepTherapyRequired ? 'text-yellow-600 font-medium' : 'text-gray-600'}`}>
                {entry.stepTherapyRequired ? 'Required' : 'Not Required'}
              </span>
            </div>
            {entry.quantityLimit && (
              <div>
                <span className="font-medium text-gray-700">Quantity Limit:</span>
                <span className="ml-2 text-gray-600">{entry.quantityLimit}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Effective:</span>
              <span className="ml-2 text-gray-600">
                {new Date(entry.effectiveDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {entry.restrictions && (
            <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs font-medium text-yellow-800 mb-1">Restrictions:</p>
              <p className="text-xs text-yellow-700">{entry.restrictions}</p>
            </div>
          )}

          {entry.alternatives && entry.alternatives.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs font-medium text-blue-800 mb-1">
                Preferred Alternatives Available
              </p>
              <p className="text-xs text-blue-700">
                Consider formulary alternatives for better coverage
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
