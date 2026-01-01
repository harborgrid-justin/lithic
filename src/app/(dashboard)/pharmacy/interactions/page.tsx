/**
 * Drug Interactions Page
 * Check for drug-drug interactions and clinical significance
 */

'use client';

import { useState } from 'react';
import { pharmacyService, type Drug, type DrugInteraction } from '@/services/pharmacy.service';
import { DrugSearch } from '@/components/pharmacy/DrugSearch';

export default function InteractionsPage() {
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDrugSearch, setShowDrugSearch] = useState(false);

  const handleAddDrug = (drug: Drug) => {
    if (!selectedDrugs.find(d => d.id === drug.id)) {
      setSelectedDrugs([...selectedDrugs, drug]);
    }
    setShowDrugSearch(false);
  };

  const handleRemoveDrug = (drugId: string) => {
    setSelectedDrugs(selectedDrugs.filter(d => d.id !== drugId));
  };

  const handleCheckInteractions = async () => {
    if (selectedDrugs.length < 2) {
      alert('Please select at least 2 medications to check for interactions');
      return;
    }

    try {
      setLoading(true);
      const drugIds = selectedDrugs.map(d => d.id);
      const data = await pharmacyService.checkInteractions(drugIds);
      setInteractions(data);
    } catch (error) {
      console.error('Failed to check interactions:', error);
      alert('Failed to check drug interactions');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: DrugInteraction['severity']) => {
    switch (severity) {
      case 'contraindicated':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'major':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const severityCounts = {
    contraindicated: interactions.filter(i => i.severity === 'contraindicated').length,
    major: interactions.filter(i => i.severity === 'major').length,
    moderate: interactions.filter(i => i.severity === 'moderate').length,
    minor: interactions.filter(i => i.severity === 'minor').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Drug Interactions</h1>
        <p className="text-gray-600">Check for potential drug-drug interactions</p>
      </div>

      {/* Selected Drugs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Selected Medications ({selectedDrugs.length})
          </h2>
          <button
            onClick={() => setShowDrugSearch(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Medication
          </button>
        </div>

        {selectedDrugs.length > 0 ? (
          <div className="space-y-2 mb-4">
            {selectedDrugs.map((drug) => (
              <div
                key={drug.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {drug.brandName || drug.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {drug.genericName} {drug.strength}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">NDC: {drug.ndc}</div>
                </div>
                <button
                  onClick={() => handleRemoveDrug(drug.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No medications selected. Add medications to check for interactions.
          </div>
        )}

        {selectedDrugs.length >= 2 && (
          <button
            onClick={handleCheckInteractions}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Checking Interactions...' : 'Check Interactions'}
          </button>
        )}
      </div>

      {/* Interaction Results */}
      {interactions.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Contraindicated</div>
              <div className="text-3xl font-bold text-red-700">
                {severityCounts.contraindicated}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg border-2 border-orange-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Major</div>
              <div className="text-3xl font-bold text-orange-700">
                {severityCounts.major}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Moderate</div>
              <div className="text-3xl font-bold text-yellow-700">
                {severityCounts.moderate}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
              <div className="text-sm text-gray-600 mb-1">Minor</div>
              <div className="text-3xl font-bold text-blue-700">
                {severityCounts.minor}
              </div>
            </div>
          </div>

          {/* Interaction Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Interaction Details ({interactions.length})
            </h2>
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className={`p-4 rounded-lg border-2 ${getSeverityColor(interaction.severity)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {interaction.drug1} + {interaction.drug2}
                      </h3>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1">
                        {interaction.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Description</h4>
                      <p className="text-sm">{interaction.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-1">Clinical Effects</h4>
                      <p className="text-sm">{interaction.clinicalEffects}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-1">Management</h4>
                      <p className="text-sm">{interaction.management}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span>Documentation: {interaction.documentation}</span>
                      <span>Source: {interaction.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedDrugs.length >= 2 && interactions.length === 0 && !loading && (
        <div className="bg-green-50 rounded-lg border-2 border-green-200 p-8 text-center">
          <div className="text-green-700 font-semibold text-lg mb-2">
            No Interactions Found
          </div>
          <div className="text-green-600 text-sm">
            No significant drug-drug interactions were found between the selected medications.
          </div>
        </div>
      )}

      {/* Drug Search Modal */}
      {showDrugSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Search Medication</h2>
              <button
                onClick={() => setShowDrugSearch(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <DrugSearch onSelect={handleAddDrug} />
          </div>
        </div>
      )}
    </div>
  );
}
