/**
 * Interaction Checker Component
 * Display drug-drug interaction warnings
 */

'use client';

import { useEffect, useState } from 'react';
import { pharmacyService, type DrugInteraction } from '@/services/pharmacy.service';

interface InteractionCheckerProps {
  drugIds: string[];
}

export function InteractionChecker({ drugIds }: InteractionCheckerProps) {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInteractions();
  }, [drugIds]);

  const checkInteractions = async () => {
    if (drugIds.length < 2) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await pharmacyService.checkInteractions(drugIds);
      setInteractions(data);
    } catch (error) {
      console.error('Failed to check interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: DrugInteraction['severity']) => {
    switch (severity) {
      case 'contraindicated':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'major':
        return 'bg-orange-50 border-orange-300 text-orange-900';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-300 text-yellow-900';
      case 'minor':
        return 'bg-blue-50 border-blue-300 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-900';
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Checking interactions...</div>;
  }

  if (interactions.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800 font-medium">
          No significant interactions found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-900">
        {interactions.length} Interaction{interactions.length !== 1 ? 's' : ''} Found
      </div>

      {interactions.map((interaction) => (
        <div
          key={interaction.id}
          className={`p-4 rounded-lg border-2 ${getSeverityColor(interaction.severity)}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">
                {interaction.drug1} + {interaction.drug2}
              </h4>
              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded mt-1">
                {interaction.severity.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <strong>Description:</strong> {interaction.description}
            </div>
            <div>
              <strong>Clinical Effects:</strong> {interaction.clinicalEffects}
            </div>
            <div>
              <strong>Management:</strong> {interaction.management}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
