'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Upload,
  Activity,
  AlertTriangle,
  FileText,
  TrendingUp,
  Pill,
  Heart,
  Dna,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function GenomicsDashboard() {
  const [stats] = useState({
    totalTests: 12,
    pendingReviews: 3,
    highRiskFindings: 2,
    pgxAlerts: 5,
  });

  const recentTests = [
    {
      id: 'GEN-1234567890',
      type: 'Comprehensive Genomic Analysis',
      date: '2024-01-15',
      status: 'completed',
      hasAlerts: true,
    },
    {
      id: 'GEN-1234567891',
      type: 'Pharmacogenomic Panel',
      date: '2024-01-10',
      status: 'completed',
      hasAlerts: false,
    },
    {
      id: 'GEN-1234567892',
      type: 'Cancer Risk Panel',
      date: '2024-01-05',
      status: 'processing',
      hasAlerts: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Genomics</h1>
          <p className="text-muted-foreground mt-1">
            Precision medicine through genetic analysis
          </p>
        </div>
        <Link href="/genomics/upload">
          <Button size="lg">
            <Upload className="mr-2 h-4 w-4" />
            Upload VCF File
          </Button>
        </Link>
      </div>

      {/* Critical Alerts */}
      {stats.pgxAlerts > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pharmacogenomic Alerts</AlertTitle>
          <AlertDescription>
            {stats.pgxAlerts} medication(s) require attention based on genetic profile.{' '}
            <Link href="/genomics/pgx" className="font-medium underline">
              Review now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <p className="text-xs text-muted-foreground">Genomic tests performed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highRiskFindings}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PGx Alerts</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pgxAlerts}</div>
            <p className="text-xs text-muted-foreground">Medication interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/genomics/upload">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <Upload className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Upload VCF</CardTitle>
              <CardDescription>
                Start a new genomic analysis
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/genomics/pgx">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <Pill className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Pharmacogenomics</CardTitle>
              <CardDescription>
                Drug-gene interactions
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/genomics/results/latest">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
              <CardDescription>
                Polygenic risk scores
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/genomics/counseling">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <Heart className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Genetic Counseling</CardTitle>
              <CardDescription>
                Schedule consultation
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Tests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>Your latest genomic tests</CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/genomics/history">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Dna className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{test.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {test.id} • {new Date(test.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {test.hasAlerts && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Alerts
                    </Badge>
                  )}
                  <Badge
                    variant={test.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {test.status}
                  </Badge>
                  <Link href={`/genomics/results/${test.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Educational Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Your Genetic Results</CardTitle>
          <CardDescription>
            Learn more about genomic testing and what your results mean
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">What is VCF?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Learn about Variant Call Format and how genomic data is stored
              </p>
              <Button variant="link" className="p-0 h-auto">
                Learn more →
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Pharmacogenomics</h4>
              <p className="text-sm text-muted-foreground mb-3">
                How your genes affect medication response and dosing
              </p>
              <Button variant="link" className="p-0 h-auto">
                Learn more →
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Genetic Risk</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Understanding polygenic risk scores and disease predisposition
              </p>
              <Button variant="link" className="p-0 h-auto">
                Learn more →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
