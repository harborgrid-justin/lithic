'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Info, Pill } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StarAlleleResult {
  gene: string;
  diplotype: string;
  allele1: string;
  allele2: string;
  metabolizerStatus: string;
  activityScore: number;
  phenotype: string;
  clinicalImplications: string[];
}

interface DrugRecommendation {
  drug: string;
  gene: string;
  phenotype: string;
  recommendation: string;
  implication: string;
  classification: string;
  alternatives?: string[];
}

interface PGxPanelProps {
  starAlleles: StarAlleleResult[];
  recommendations: DrugRecommendation[];
  loading?: boolean;
}

export function PGxPanel({ starAlleles, recommendations, loading = false }: PGxPanelProps) {
  const getMetabolizerBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      ultrarapid: { bg: 'bg-purple-100', text: 'text-purple-800', icon: AlertTriangle },
      rapid: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Info },
      normal: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      poor: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
    };

    const style = styles[status] || styles.normal;
    const Icon = style.icon;

    return (
      <Badge className={`${style.bg} ${style.text} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRecommendationSeverity = (classification: string) => {
    const severities: Record<string, 'critical' | 'warning' | 'info'> = {
      strong: 'critical',
      moderate: 'warning',
      optional: 'info',
    };
    return severities[classification] || 'info';
  };

  const criticalRecommendations = recommendations.filter((r) => r.classification === 'strong');
  const moderateRecommendations = recommendations.filter((r) => r.classification === 'moderate');

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Analyzing pharmacogenomics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalRecommendations.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Pharmacogenomic Alerts</AlertTitle>
          <AlertDescription>
            {criticalRecommendations.length} medication(s) require immediate attention based on your genetic profile.
          </AlertDescription>
        </Alert>
      )}

      {/* Drug Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medication Recommendations
            </CardTitle>
            <CardDescription>
              Personalized drug guidance based on your genetic profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {recommendations.map((rec, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{rec.drug}</div>
                        <div className="text-sm text-muted-foreground">{rec.gene}: {rec.phenotype}</div>
                      </div>
                      <Badge
                        variant={getRecommendationSeverity(rec.classification) === 'critical' ? 'destructive' : 'default'}
                      >
                        {rec.classification}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Implication</h4>
                        <p className="text-sm text-muted-foreground">{rec.implication}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-1">Recommendation</h4>
                        <p className="text-sm">{rec.recommendation}</p>
                      </div>

                      {rec.alternatives && rec.alternatives.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Alternative Medications</h4>
                          <div className="flex flex-wrap gap-2">
                            {rec.alternatives.map((alt, i) => (
                              <Badge key={i} variant="outline">
                                {alt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Pharmacogene Results */}
      <Card>
        <CardHeader>
          <CardTitle>Pharmacogene Profile</CardTitle>
          <CardDescription>
            Your genetic variants affecting drug metabolism
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {starAlleles.map((allele, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{allele.gene}</h3>
                    <p className="text-sm text-muted-foreground">Diplotype: {allele.diplotype}</p>
                  </div>
                  {getMetabolizerBadge(allele.metabolizerStatus)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Alleles</div>
                    <div className="font-mono text-sm">
                      {allele.allele1} / {allele.allele2}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Activity Score</div>
                    <div className="font-medium">{allele.activityScore.toFixed(1)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Phenotype</div>
                  <div className="text-sm mb-2">{allele.phenotype}</div>
                </div>

                {allele.clinicalImplications.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Clinical Implications
                    </div>
                    <ul className="space-y-1">
                      {allele.clinicalImplications.slice(0, 3).map((implication, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{implication}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{starAlleles.length}</div>
              <div className="text-sm text-muted-foreground">Genes Tested</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {starAlleles.filter((a) => a.metabolizerStatus !== 'normal').length}
              </div>
              <div className="text-sm text-muted-foreground">Actionable Results</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{criticalRecommendations.length}</div>
              <div className="text-sm text-muted-foreground">Critical Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
