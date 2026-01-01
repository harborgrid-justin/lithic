'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PGxPanel } from '@/components/genomics/pgx-panel';
import { AlertTriangle, Search, Pill, Download, Printer } from 'lucide-react';

export default function PharmacogenomicsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const starAlleles = [
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
        'Consider therapeutic drug monitoring for narrow therapeutic index drugs',
        'Avoid prodrugs that require CYP2D6 activation',
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
      clinicalImplications: [
        'Reduced metabolism of CYP2C19 substrates',
        'Consider dose reduction for some medications',
        'Alternative antiplatelet therapy recommended over clopidogrel',
      ],
    },
    {
      gene: 'TPMT',
      diplotype: '*1/*1',
      allele1: '*1',
      allele2: '*1',
      metabolizerStatus: 'normal',
      activityScore: 2.0,
      phenotype: 'Normal activity',
      clinicalImplications: ['Standard dosing of thiopurines'],
    },
    {
      gene: 'SLCO1B1',
      diplotype: '*1A/*5',
      allele1: '*1A',
      allele2: '*5',
      metabolizerStatus: 'intermediate',
      activityScore: 1.5,
      phenotype: 'Decreased function',
      clinicalImplications: [
        'Increased risk of statin-induced myopathy',
        'Consider lower simvastatin dose or alternative statin',
      ],
    },
  ];

  const recommendations = [
    {
      drug: 'Clopidogrel',
      gene: 'CYP2C19',
      phenotype: 'Intermediate metabolizer',
      recommendation: 'Consider alternative antiplatelet therapy (e.g., prasugrel, ticagrelor)',
      implication: 'Reduced platelet inhibition; increased residual platelet aggregation; increased risk for adverse cardiovascular events',
      classification: 'strong',
      alternatives: ['Prasugrel', 'Ticagrelor'],
    },
    {
      drug: 'Codeine',
      gene: 'CYP2D6',
      phenotype: 'Intermediate metabolizer',
      recommendation: 'Use alternative analgesic; if codeine used, monitor closely',
      implication: 'Reduced morphine formation; reduced efficacy',
      classification: 'moderate',
      alternatives: ['Morphine', 'Hydromorphone', 'Oxycodone'],
    },
    {
      drug: 'Simvastatin',
      gene: 'SLCO1B1',
      phenotype: 'Decreased function',
      recommendation: 'Prescribe a lower dose or consider alternative statin; if simvastatin is used, limit dose to ≤20 mg daily',
      implication: 'Increased myopathy risk',
      classification: 'strong',
      alternatives: ['Pravastatin', 'Rosuvastatin', 'Fluvastatin'],
    },
  ];

  const filteredRecommendations = recommendations.filter(
    (rec) =>
      rec.drug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.gene.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacogenomics</h1>
          <p className="text-muted-foreground mt-1">
            Personalized medication guidance based on your genetic profile
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Card
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {recommendations.filter((r) => r.classification === 'strong').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Medication Alerts</AlertTitle>
          <AlertDescription>
            {recommendations.filter((r) => r.classification === 'strong').length} medication(s) require immediate attention based on your genetic profile. Please review the recommendations below and consult with your healthcare provider.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Drug Search</CardTitle>
          <CardDescription>
            Search for specific medications or genes to view personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by drug name or gene..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {searchTerm && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Found {filteredRecommendations.length} recommendation(s)
              </div>
              {filteredRecommendations.length === 0 && (
                <Alert>
                  <AlertDescription>
                    No medications found. Try a different search term.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PGx Panel */}
      <PGxPanel
        starAlleles={starAlleles}
        recommendations={searchTerm ? filteredRecommendations : recommendations}
      />

      {/* Wallet Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Pharmacogenomic Wallet Card
          </CardTitle>
          <CardDescription>
            Carry this information with you to share with healthcare providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-6 space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg">Pharmacogenomic Profile</h3>
              <p className="text-sm text-muted-foreground">Patient ID: PAT-12345</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {starAlleles
                .filter((a) => a.metabolizerStatus !== 'normal')
                .map((allele, index) => (
                  <div key={index} className="p-3 bg-muted rounded">
                    <div className="font-semibold text-sm">{allele.gene}</div>
                    <div className="text-xs text-muted-foreground">
                      {allele.diplotype} • {allele.metabolizerStatus}
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t text-xs text-muted-foreground text-center">
              Generated: {new Date().toLocaleDateString()} • Lithic Genomics Laboratory
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download Card
              </Button>
              <Button variant="outline" className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Print Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Educational Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Pharmacogenomics</CardTitle>
          <CardDescription>
            Learn how your genes affect medication response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">What is a metabolizer status?</h4>
              <p className="text-sm text-muted-foreground">
                Your metabolizer status indicates how fast or slow your body processes certain medications. This can affect how well medications work and whether you experience side effects.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">How to use this information</h4>
              <p className="text-sm text-muted-foreground">
                Always share your pharmacogenomic results with your healthcare providers before starting new medications. They can use this information to select the right medication and dose for you.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">CPIC Guidelines</h4>
              <p className="text-sm text-muted-foreground">
                Our recommendations are based on Clinical Pharmacogenetics Implementation Consortium (CPIC) guidelines, which provide evidence-based gene-drug clinical practice guidelines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
