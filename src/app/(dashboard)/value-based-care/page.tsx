"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Activity,
  Award,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  BarChart3,
  FileText,
} from "lucide-react";

export default function ValueBasedCareDashboard() {
  const overviewMetrics = {
    acoMembers: 15000,
    mipsScore: 86.74,
    qualityScore: 87.5,
    careGaps: 450,
    projectedSavings: 5000000,
    paymentAdjustment: 6.2,
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Value-Based Care</h1>
        <p className="text-gray-500 mt-1">
          Manage ACO performance, MIPS reporting, and quality measures
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ACO Members
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewMetrics.acoMembers.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              97% attribution stability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              MIPS Final Score
            </CardTitle>
            <Award className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overviewMetrics.mipsScore.toFixed(1)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              +{overviewMetrics.paymentAdjustment}% payment adjustment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Projected Shared Savings
            </CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(overviewMetrics.projectedSavings / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-gray-500 mt-1">Performance year 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/value-based-care/aco">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">ACO Management</CardTitle>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardDescription>
                Attribution, shared savings, and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Beneficiaries:</span>
                  <span className="font-semibold">15,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quality Score:</span>
                  <span className="font-semibold text-green-600">87.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Savings Rate:</span>
                  <span className="font-semibold text-green-600">2.94%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/value-based-care/mips">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">MIPS Reporting</CardTitle>
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <CardDescription>
                Quality, PI, IA, and cost measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Score:</span>
                  <span className="font-semibold">86.74</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Adj:</span>
                  <span className="font-semibold text-green-600">+6.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">On Track</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/value-based-care/quality">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Quality Measures</CardTitle>
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <CardDescription>
                HEDIS, benchmarking, and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">HEDIS Measures:</span>
                  <span className="font-semibold">18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Star Rating:</span>
                  <span className="font-semibold text-green-600">4.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Above 90th %ile:</span>
                  <span className="font-semibold">6</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/value-based-care/care-gaps">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Care Gaps</CardTitle>
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <CardDescription>
                Patient outreach and gap closure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Gaps:</span>
                  <span className="font-semibold">{overviewMetrics.careGaps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical:</span>
                  <span className="font-semibold text-red-600">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Closure Rate:</span>
                  <span className="font-semibold text-green-600">52%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across value-based programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium">MIPS quality measures submitted</div>
                <div className="text-sm text-gray-600">6 measures reported for Q4 2024</div>
                <div className="text-xs text-gray-500 mt-1">2 hours ago</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium">ACO shared savings projection updated</div>
                <div className="text-sm text-gray-600">
                  Projected savings increased to $5.0M based on current trends
                </div>
                <div className="text-xs text-gray-500 mt-1">5 hours ago</div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 border rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium">45 critical care gaps identified</div>
                <div className="text-sm text-gray-600">
                  Patients require immediate outreach for preventive screenings
                </div>
                <div className="text-xs text-gray-500 mt-1">1 day ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
