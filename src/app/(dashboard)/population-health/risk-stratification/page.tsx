"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskScoreCard } from "@/components/population-health/RiskScoreCard";
import { AlertTriangle, TrendingUp, Users, Activity } from "lucide-react";

export default function RiskStratificationPage() {
  const riskDistribution = {
    critical: 45,
    veryHigh: 89,
    high: 234,
    medium: 876,
    low: 2003,
  };

  const total = Object.values(riskDistribution).reduce((a, b) => a + b, 0);

  const highRiskPatients = [
    {
      id: "1",
      name: "John Smith",
      mrn: "MRN-001234",
      riskScore: 87,
      level: "CRITICAL",
      primaryCondition: "CHF",
    },
    {
      id: "2",
      name: "Mary Johnson",
      mrn: "MRN-002345",
      riskScore: 82,
      level: "VERY_HIGH",
      primaryCondition: "Diabetes",
    },
    {
      id: "3",
      name: "Robert Williams",
      mrn: "MRN-003456",
      riskScore: 78,
      level: "VERY_HIGH",
      primaryCondition: "COPD",
    },
    {
      id: "4",
      name: "Patricia Brown",
      mrn: "MRN-004567",
      riskScore: 75,
      level: "HIGH",
      primaryCondition: "CKD",
    },
    {
      id: "5",
      name: "Michael Davis",
      mrn: "MRN-005678",
      riskScore: 73,
      level: "HIGH",
      primaryCondition: "Diabetes",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Risk Stratification
        </h1>
        <p className="text-gray-500 mt-1">
          Identify and manage high-risk patients using evidence-based risk
          scores
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Patients
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Stratified patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              High Risk
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {riskDistribution.high}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((riskDistribution.high / total) * 100).toFixed(1)}% of
              population
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Very High Risk
            </CardTitle>
            <Activity className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {riskDistribution.veryHigh}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Intensive management needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Critical
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {riskDistribution.critical}
            </div>
            <p className="text-xs text-red-600 mt-1">
              Immediate attention required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Level Distribution</CardTitle>
          <CardDescription>
            Population stratified by composite risk score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-700 font-medium">Critical</span>
                <span>
                  {riskDistribution.critical} (
                  {((riskDistribution.critical / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-700 h-3 rounded-full"
                  style={{
                    width: `${(riskDistribution.critical / total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600 font-medium">Very High</span>
                <span>
                  {riskDistribution.veryHigh} (
                  {((riskDistribution.veryHigh / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-600 h-3 rounded-full"
                  style={{
                    width: `${(riskDistribution.veryHigh / total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-600 font-medium">High</span>
                <span>
                  {riskDistribution.high} (
                  {((riskDistribution.high / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-600 h-3 rounded-full"
                  style={{ width: `${(riskDistribution.high / total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-600 font-medium">Medium</span>
                <span>
                  {riskDistribution.medium} (
                  {((riskDistribution.medium / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-600 h-3 rounded-full"
                  style={{
                    width: `${(riskDistribution.medium / total) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">Low</span>
                <span>
                  {riskDistribution.low} (
                  {((riskDistribution.low / total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${(riskDistribution.low / total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Risk Patients */}
      <Card>
        <CardHeader>
          <CardTitle>High Risk Patients</CardTitle>
          <CardDescription>
            Patients requiring intensive care management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {highRiskPatients.map((patient) => (
              <RiskScoreCard key={patient.id} patient={patient} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
