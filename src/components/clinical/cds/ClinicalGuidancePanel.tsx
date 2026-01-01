/**
 * Clinical Guidance Panel Component
 * Display evidence-based clinical guidelines and recommendations
 */

'use client';

import React, { useState } from 'react';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, Award, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ClinicalGuideline {
  id: string;
  title: string;
  organization: string;
  category: string;
  condition: string;
  summary: string;
  recommendations: Array<{
    id: string;
    text: string;
    strengthOfRecommendation: 'STRONG' | 'MODERATE' | 'WEAK';
    qualityOfEvidence: 'HIGH' | 'MODERATE' | 'LOW';
  }>;
  lastUpdated: Date;
  version: string;
  references: Array<{
    citation: string;
    url?: string;
  }>;
}

interface ClinicalGuidancePanelProps {
  guidelines: ClinicalGuideline[];
  patientCondition?: string;
}

export function ClinicalGuidancePanel({ guidelines, patientCondition }: ClinicalGuidancePanelProps) {
  const [expandedGuidelines, setExpandedGuidelines] = useState<Set<string>>(new Set());

  const toggleGuideline = (id: string) => {
    const newExpanded = new Set(expandedGuidelines);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGuidelines(newExpanded);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'STRONG':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'WEAK':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEvidenceColor = (quality: string) => {
    switch (quality) {
      case 'HIGH':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'MODERATE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'LOW':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (guidelines.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3" />
            <p>No clinical guidelines available</p>
            {patientCondition && (
              <p className="text-sm mt-2">for condition: {patientCondition}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {guidelines.map(guideline => {
        const isExpanded = expandedGuidelines.has(guideline.id);

        return (
          <Card key={guideline.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <Badge variant="outline">{guideline.category}</Badge>
                    <Badge variant="secondary">{guideline.organization}</Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{guideline.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Updated: {new Date(guideline.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4" />
                      <span>Version {guideline.version}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleGuideline(guideline.id)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {guideline.summary}
              </p>

              {isExpanded && (
                <>
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-sm uppercase text-gray-500">
                      Key Recommendations
                    </h4>
                    {guideline.recommendations.map((rec, idx) => (
                      <div
                        key={rec.id}
                        className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-r"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {idx + 1}. {rec.text}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStrengthColor(rec.strengthOfRecommendation)}>
                            Strength: {rec.strengthOfRecommendation}
                          </Badge>
                          <Badge className={getEvidenceColor(rec.qualityOfEvidence)}>
                            Evidence: {rec.qualityOfEvidence}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm uppercase text-gray-500 mb-3">
                      References
                    </h4>
                    <ul className="space-y-2">
                      {guideline.references.map((ref, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-start justify-between">
                            <span className="flex-1">{ref.citation}</span>
                            {ref.url && (
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
