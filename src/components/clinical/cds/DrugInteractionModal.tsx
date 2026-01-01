/**
 * Drug Interaction Modal Component
 * Detailed view of drug-drug interactions
 */

'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Info, Pill, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'CONTRAINDICATED' | 'SEVERE' | 'MODERATE' | 'MILD' | 'MONITOR';
  mechanism: string;
  description: string;
  clinicalEffects: string[];
  management: string;
  alternatives?: Array<{
    genericName: string;
    brandNames: string[];
    reason: string;
  }>;
  evidence: {
    level: 'A' | 'B' | 'C' | 'D';
    references: string[];
  };
  onset: 'IMMEDIATE' | 'DELAYED' | 'VARIABLE';
  documentation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

interface DrugInteractionModalProps {
  interaction: DrugInteraction | null;
  open: boolean;
  onClose: () => void;
  onSelectAlternative?: (alternative: string) => void;
}

export function DrugInteractionModal({
  interaction,
  open,
  onClose,
  onSelectAlternative,
}: DrugInteractionModalProps) {
  const [selectedTab, setSelectedTab] = useState('details');

  if (!interaction) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CONTRAINDICATED':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200';
      case 'SEVERE':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200';
      case 'MILD':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEvidenceIcon = (level: string) => {
    switch (level) {
      case 'A':
        return '🟢';
      case 'B':
        return '🟡';
      case 'C':
        return '🟠';
      case 'D':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <span>Drug Interaction Alert</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            <div className="flex items-center space-x-2 mt-3">
              <div className="flex items-center space-x-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                <Pill className="h-5 w-5" />
                <span>{interaction.drug1}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <Pill className="h-5 w-5" />
                <span>{interaction.drug2}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={getSeverityColor(interaction.severity)}>
                {interaction.severity}
              </Badge>
              <Badge variant="outline">{interaction.mechanism}</Badge>
              <Badge variant="outline">
                {getEvidenceIcon(interaction.evidence.level)} Evidence Level{' '}
                {interaction.evidence.level}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                Description
              </h3>
              <p className="text-sm">{interaction.description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                Clinical Effects
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {interaction.clinicalEffects.map((effect, idx) => (
                  <li key={idx} className="text-sm">
                    {effect}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                  Onset
                </h3>
                <Badge variant="outline">{interaction.onset}</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                  Documentation
                </h3>
                <Badge variant="outline">{interaction.documentation}</Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                References
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {interaction.evidence.references.map((ref, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                    {ref}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Management Recommendations
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {interaction.management}
                  </p>
                </div>
              </div>
            </div>

            {interaction.severity === 'CONTRAINDICATED' && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                      CONTRAINDICATED
                    </h3>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      These medications should NOT be used together. Select an alternative
                      medication.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="alternatives" className="space-y-4 mt-4">
            {interaction.alternatives && interaction.alternatives.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Consider the following alternatives to avoid this interaction:
                </p>
                <div className="space-y-3">
                  {interaction.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">
                            {alt.genericName}
                          </h4>
                          {alt.brandNames.length > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Brand names: {alt.brandNames.join(', ')}
                            </p>
                          )}
                          <p className="text-sm mt-2">{alt.reason}</p>
                        </div>
                        {onSelectAlternative && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectAlternative(alt.genericName)}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Info className="h-12 w-12 mx-auto mb-3" />
                <p>No alternative medications available in database</p>
                <p className="text-sm mt-2">
                  Consult clinical pharmacist for recommendations
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
