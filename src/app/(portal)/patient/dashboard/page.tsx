/**
 * Patient Dashboard Page
 * Agent 1: Patient Portal & Experience Expert
 * Comprehensive health summary with vitals trends, appointments, and recommendations
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePatientPortalStore } from "@/stores/patient-portal-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Pill,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/utils";
import type { HealthSummary, VitalTrend } from "@/types/patient-portal";

export default function PatientDashboard() {
  const { session, healthSummary, setHealthSummary, setHealthSummaryLoading } =
    usePatientPortalStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealthSummary() {
      if (!session?.patientId) return;

      try {
        setHealthSummaryLoading(true);
        const response = await fetch(
          `/api/patient-portal/dashboard?patientId=${session.patientId}`,
        );
        const data = await response.json();

        if (data.success) {
          setHealthSummary(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch health summary:", error);
      } finally {
        setHealthSummaryLoading(false);
        setLoading(false);
      }
    }

    fetchHealthSummary();
  }, [session?.patientId, setHealthSummary, setHealthSummaryLoading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading your health summary...</p>
        </div>
      </div>
    );
  }

  if (!healthSummary) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load health summary</AlertTitle>
          <AlertDescription>
            Please try refreshing the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getVitalStatusColor = (status: string) => {
    switch (status) {
      case "NORMAL":
        return "text-green-600 bg-green-50 border-green-200";
      case "BORDERLINE":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "ABNORMAL":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "CRITICAL":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here&apos;s your health summary for {formatDate(new Date(), "long")}
        </p>
      </div>

      {/* Care Gaps Alert */}
      {healthSummary.careGaps.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Action Required</AlertTitle>
          <AlertDescription className="text-orange-800">
            You have {healthSummary.careGaps.length} care gap(s) that need attention.
            <Link href="#care-gaps" className="ml-2 font-medium underline">
              View Details
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Health Score Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Health Score
          </CardTitle>
          <CardDescription>
            Overall health assessment based on your medical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">
                {healthSummary.healthScore.overall}
              </div>
              <p className="text-sm text-muted-foreground">out of 100</p>
            </div>

            {/* Category Scores */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Cardiovascular</span>
                  <span className="font-medium">{healthSummary.healthScore.cardiovascular}</span>
                </div>
                <Progress value={healthSummary.healthScore.cardiovascular} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Metabolic</span>
                  <span className="font-medium">{healthSummary.healthScore.metabolic}</span>
                </div>
                <Progress value={healthSummary.healthScore.metabolic} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Mental</span>
                  <span className="font-medium">{healthSummary.healthScore.mental}</span>
                </div>
                <Progress value={healthSummary.healthScore.mental} className="mt-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Lifestyle</span>
                  <span className="font-medium">{healthSummary.healthScore.lifestyle}</span>
                </div>
                <Progress value={healthSummary.healthScore.lifestyle} className="mt-2" />
              </div>
            </div>

            {/* Key Factors */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Key Factors</h4>
              <div className="space-y-2">
                {healthSummary.healthScore.factors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {factor.impact === "positive" && (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    )}
                    {factor.impact === "negative" && (
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    {factor.impact === "neutral" && (
                      <Minus className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{factor.name}</p>
                      <p className="text-muted-foreground">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Vitals Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vital Signs
              </CardTitle>
              <CardDescription>Your recent vital measurements and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthSummary.vitals.map((vital) => (
                  <div
                    key={vital.type}
                    className={cn(
                      "rounded-lg border p-4",
                      getVitalStatusColor(vital.status),
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Heart className="h-5 w-5" />
                        <div>
                          <p className="font-medium">
                            {vital.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-2xl font-bold">
                            {vital.currentValue} {vital.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(vital.trend)}
                        <Badge variant={vital.status === "NORMAL" ? "default" : "destructive"}>
                          {vital.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Last recorded: {formatDate(vital.lastRecorded)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Test Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Test Results
                  </CardTitle>
                  <CardDescription>Latest laboratory and imaging results</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/patient/records">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthSummary.recentTestResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{result.testName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(result.resultDate)} • {result.provider}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.hasAbnormal && (
                        <Badge variant="danger">Abnormal</Badge>
                      )}
                      <Badge variant="outline">{result.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Care Gaps */}
          <Card id="care-gaps">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Care Gaps
              </CardTitle>
              <CardDescription>
                Recommended preventive care and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthSummary.careGaps.map((gap) => (
                  <Alert key={gap.id} className={cn(
                    gap.priority === "HIGH" || gap.priority === "URGENT"
                      ? "border-orange-200 bg-orange-50"
                      : "border-blue-200 bg-blue-50"
                  )}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      {gap.title}
                      <Badge variant={gap.priority === "HIGH" ? "destructive" : "default"}>
                        {gap.priority}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      {gap.description}
                      <div className="mt-2">
                        <Button size="sm" variant="outline">
                          {gap.recommendedAction}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthSummary.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{appointment.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.provider}
                        </p>
                      </div>
                      <Badge>{appointment.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDate(appointment.date)} at {appointment.time}
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/patient/appointments">
                    View All Appointments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Active Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthSummary.activeMedications.slice(0, 3).map((med) => (
                  <div key={med.id} className="space-y-1">
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage} • {med.frequency}
                    </p>
                    {med.refillsRemaining <= 1 && (
                      <Badge variant="danger" className="text-xs">
                        Low refills
                      </Badge>
                    )}
                  </div>
                ))}
                <Separator />
                <Button variant="outline" className="w-full" size="sm">
                  Request Refill
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Care Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Care Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Dr. Michael Chen</p>
                    <p className="text-sm text-muted-foreground">
                      Primary Care Physician
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/patient/messages">
                    Send Message
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Health Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthSummary.recommendations.map((rec) => (
                  <div key={rec.id} className="space-y-2">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                    {rec.actionable && rec.actionUrl && (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <Link href={rec.actionUrl}>
                          {rec.actionLabel}
                        </Link>
                      </Button>
                    )}
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
