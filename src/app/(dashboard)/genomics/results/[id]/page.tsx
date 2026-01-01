'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VariantBrowser } from '@/components/genomics/variant-browser';
import { PGxPanel } from '@/components/genomics/pgx-panel';
import { RiskChart } from '@/components/genomics/risk-chart';
import { Download, FileText, Share2, Loader2 } from 'lucide-react';

export default function GenomicsResultsPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setData({
        analysisId: params.id,
        patientId: 'PAT-12345',
        completedAt: new Date().toISOString(),
        variants: [
          {
            variantId: 'chr1-12345-A-G',
            gene: 'BRCA1',
            chromosome: '1',
            position: 12345,
            reference: 'A',
            alternate: 'G',
            classification: 'pathogenic',
            clinicalSignificance: 'pathogenic',
            populationFrequency: 0.0001,
            functionalImpact: 'high',
          },
          {
            variantId: 'chr7-67890-C-T',
            gene: 'CYP2D6',
            chromosome: '7',
            position: 67890,
            reference: 'C',
            alternate: 'T',
            classification: 'likely_pathogenic',
            clinicalSignificance: 'likely_pathogenic',
            populationFrequency: 0.05,
            functionalImpact: 'moderate',
          },
        ],
        starAlleles: [
          {
            gene: 'CYP2D6',
            diplotype: '*1/*4',
            allele1: '*1',
            allele2: '*4',
            metabolizerStatus: 'intermediate',
            activityScore: 0.5,
            phenotype: 'Intermediate metabolizer',
            clinicalImplications: [
              'May require dose adjustments for some CYP2D6 substrates',
              'Consider therapeutic drug monitoring',
            ],
          },
          {
            gene: 'CYP2C19',
            diplotype: '*1/*2',
            allele1: '*1',
            allele2: '*2',
            metabolizerStatus: 'intermediate',
            activityScore: 1.0,
            phenotype: 'Intermediate metabolizer',
            clinicalImplications: ['Reduced metabolism of CYP2C19 substrates'],
          },
        ],
        recommendations: [
          {
            drug: 'Clopidogrel',
            gene: 'CYP2C19',
            phenotype: 'Intermediate metabolizer',
            recommendation: 'Consider alternative antiplatelet therapy',
            implication: 'Reduced platelet inhibition; increased cardiovascular risk',
            classification: 'strong',
            alternatives: ['Prasugrel', 'Ticagrelor'],
          },
        ],
        polygenicRisk: [
          {
            condition: 'Coronary Artery Disease',
            score: 1.5,
            percentile: 85,
            riskCategory: 'high',
            relativeRisk: 2.1,
            absoluteRisk: 0.10,
          },
          {
            condition: 'Type 2 Diabetes',
            score: 0.2,
            percentile: 45,
            riskCategory: 'average',
            relativeRisk: 1.1,
            absoluteRisk: 0.09,
          },
        ],
      });
      setLoading(false);
    }, 1500);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading genomic analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Genomic Analysis Results</h1>
          <p className="text-muted-foreground mt-1">
            Analysis ID: {data.analysisId} • Patient ID: {data.patientId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.variants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actionable Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.variants.filter((v: any) => v.classification === 'pathogenic').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">PGx Genes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.starAlleles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.polygenicRisk.filter((r: any) => r.riskCategory === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="variants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="variants">
            Variants
            <Badge className="ml-2" variant="secondary">
              {data.variants.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pgx">
            Pharmacogenomics
            <Badge className="ml-2" variant="secondary">
              {data.recommendations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="risk">
            Risk Assessment
            <Badge className="ml-2" variant="secondary">
              {data.polygenicRisk.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="report">Clinical Report</TabsTrigger>
        </TabsList>

        <TabsContent value="variants" className="space-y-4">
          <VariantBrowser variants={data.variants} />
        </TabsContent>

        <TabsContent value="pgx" className="space-y-4">
          <PGxPanel
            starAlleles={data.starAlleles}
            recommendations={data.recommendations}
          />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <RiskChart risks={data.polygenicRisk} />
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Genomic Report</CardTitle>
              <CardDescription>
                Comprehensive summary of genetic findings and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h3>Summary</h3>
                  <p>
                    This comprehensive genomic analysis identified {data.variants.length} variants,
                    including{' '}
                    {data.variants.filter((v: any) => v.classification === 'pathogenic').length}{' '}
                    pathogenic variants requiring clinical attention.
                  </p>

                  <h3>Key Findings</h3>
                  <ul>
                    <li>
                      Pharmacogenomic analysis revealed actionable results for{' '}
                      {data.starAlleles.length} genes
                    </li>
                    <li>
                      Elevated genetic risk detected for{' '}
                      {data.polygenicRisk.filter((r: any) => r.riskCategory === 'high').length}{' '}
                      conditions
                    </li>
                    <li>
                      {data.recommendations.filter((r: any) => r.classification === 'strong').length}{' '}
                      strong medication recommendations
                    </li>
                  </ul>

                  <h3>Recommendations</h3>
                  <ol>
                    <li>Genetic counseling recommended for pathogenic findings</li>
                    <li>Review medication list with pharmacist or physician</li>
                    <li>Consider enhanced screening for high-risk conditions</li>
                    <li>Share results with family members if appropriate</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download Full Report
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Patient Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
