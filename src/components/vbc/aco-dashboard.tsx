"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, AlertTriangle } from "lucide-react";

interface ACODashboardProps {
  acoId: string;
  performanceYear: number;
}

export function ACODashboard({ acoId, performanceYear }: ACODashboardProps) {
  // Mock data - would come from API
  const metrics = {
    assignedBeneficiaries: 15000,
    attributionStabilityRate: 97.0,
    overallQualityScore: 87.5,
    totalExpenditure: 165000000,
    benchmark: 170000000,
    savings: 5000000,
    savingsRate: 2.94,
    projectedPayment: 1500000,
    averageRiskScore: 1.24,
  };

  const qualityMeasures = [
    { name: "Diabetes HbA1c Control", rate: 92.5, benchmark: 88.0, met: true },
    { name: "Blood Pressure Control", rate: 85.2, benchmark: 83.0, met: true },
    { name: "Breast Cancer Screening", rate: 76.8, benchmark: 72.0, met: true },
    { name: "Colorectal Cancer Screening", rate: 71.5, benchmark: 67.0, met: true },
  ];

  const costCategories = [
    { category: "Inpatient", cost: 45000000, percent: 27.3, variance: -5.2 },
    { category: "Outpatient", cost: 35000000, percent: 21.2, variance: 2.1 },
    { category: "Professional", cost: 55000000, percent: 33.3, variance: -1.5 },
    { category: "Pharmacy", cost: 30000000, percent: 18.2, variance: 3.8 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Assigned Beneficiaries
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.assignedBeneficiaries.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {metrics.attributionStabilityRate}% stability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Quality Score
            </CardTitle>
            <Activity className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.overallQualityScore.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Above 75th percentile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Shared Savings
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(metrics.savings / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.savingsRate.toFixed(2)}% savings rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Projected Payment
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(metrics.projectedPayment / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">Performance year {performanceYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="quality" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quality">Quality Performance</TabsTrigger>
          <TabsTrigger value="cost">Cost Management</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="savings">Shared Savings</TabsTrigger>
        </TabsList>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quality Measure Performance</CardTitle>
              <CardDescription>
                Performance on key ACO quality measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityMeasures.map((measure, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{measure.name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Rate: {measure.rate.toFixed(1)}%</span>
                        <span>Benchmark: {measure.benchmark.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {measure.met ? (
                        <div className="text-green-600 font-semibold">
                          <TrendingUp className="w-5 h-5 inline mr-1" />
                          Met
                        </div>
                      ) : (
                        <div className="text-orange-600 font-semibold">
                          <TrendingDown className="w-5 h-5 inline mr-1" />
                          Below
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Category</CardTitle>
              <CardDescription>
                Expenditure breakdown and variance from benchmark
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costCategories.map((category, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          ${(category.cost / 1000000).toFixed(1)}M ({category.percent.toFixed(1)}%)
                        </span>
                        <span className={`text-sm font-medium ${category.variance < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {category.variance > 0 ? '+' : ''}{category.variance.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${category.variance < 0 ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${category.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attribution Stability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.attributionStabilityRate}%
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Low patient churn indicates strong provider relationships
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.averageRiskScore.toFixed(2)}</div>
                <p className="text-sm text-gray-500 mt-2">
                  RAF score affects benchmark adjustment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attribution Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Retrospective</span>
                    <span className="font-medium">90%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Voluntary</span>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shared Savings Calculation</CardTitle>
              <CardDescription>
                Two-sided risk model with quality adjustment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Benchmark</div>
                    <div className="text-2xl font-bold">
                      ${(metrics.benchmark / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Actual Expenditure</div>
                    <div className="text-2xl font-bold">
                      ${(metrics.totalExpenditure / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Gross Savings</span>
                    <span className="text-lg font-bold text-green-600">
                      ${(metrics.savings / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Quality Multiplier</span>
                    <span className="text-lg font-medium">0.95x</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Sharing Rate</span>
                    <span className="text-lg font-medium">60%</span>
                  </div>
                </div>

                <div className="border-t pt-4 bg-green-50 -mx-6 -mb-6 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Earned Shared Savings</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${(metrics.projectedPayment / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
