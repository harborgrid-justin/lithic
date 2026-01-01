/**
 * SDOH Analytics Dashboard Page
 * Population health insights and outcomes analysis
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, DollarSign } from "lucide-react";

export default function SDOHAnalyticsPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SDOH Analytics</h1>
          <p className="text-gray-600 mt-2">
            Population health insights and program outcomes
          </p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="q4-2024">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="fy-2024">FY 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Screening Rate</p>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">68%</p>
          <p className="text-sm text-green-600 mt-1">+5% from last quarter</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Resolution Rate</p>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">72%</p>
          <p className="text-sm text-green-600 mt-1">+8% from last quarter</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Time to Resolution</p>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">42 days</p>
          <p className="text-sm text-green-600 mt-1">-6 days improvement</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Cost Savings</p>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">$247K</p>
          <p className="text-sm text-green-600 mt-1">+12% ROI</p>
        </Card>
      </div>

      {/* Outcomes Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Need Distribution</h2>
          <div className="space-y-3">
            {[
              { need: "Food Insecurity", count: 156, resolved: 112, color: "bg-blue-500" },
              { need: "Housing", count: 98, resolved: 65, color: "bg-green-500" },
              { need: "Transportation", count: 87, resolved: 71, color: "bg-purple-500" },
              { need: "Utilities", count: 76, resolved: 58, color: "bg-orange-500" },
              { need: "Financial", count: 106, resolved: 79, color: "bg-red-500" },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{item.need}</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((item.resolved / item.count) * 100)}% resolved
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${(item.resolved / item.count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Healthcare Utilization Impact</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">ER Visits Reduction</p>
              <p className="text-2xl font-bold text-green-700">-23%</p>
              <p className="text-sm text-gray-600 mt-1">189 fewer visits</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Hospitalizations Reduction</p>
              <p className="text-2xl font-bold text-blue-700">-18%</p>
              <p className="text-sm text-gray-600 mt-1">45 fewer admissions</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Primary Care Increase</p>
              <p className="text-2xl font-bold text-purple-700">+31%</p>
              <p className="text-sm text-gray-600 mt-1">Better preventive care</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Patient Outcomes */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Outcomes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <p className="text-4xl font-bold text-green-600">78%</p>
            <p className="text-gray-600 mt-2">Reported Improvement</p>
          </div>
          <div className="text-center p-4">
            <p className="text-4xl font-bold text-blue-600">4.3/5</p>
            <p className="text-gray-600 mt-2">Patient Satisfaction</p>
          </div>
          <div className="text-center p-4">
            <p className="text-4xl font-bold text-purple-600">89%</p>
            <p className="text-gray-600 mt-2">Would Recommend</p>
          </div>
        </div>
      </Card>

      {/* Health Equity Analysis */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Health Equity Analysis</h2>
        <p className="text-gray-600 mb-4">
          Analyzing outcomes across demographic groups to identify and address disparities
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">By Race/Ethnicity</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hispanic/Latino</span>
                <span className="font-semibold">74% resolution rate</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Black/African American</span>
                <span className="font-semibold">71% resolution rate</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>White</span>
                <span className="font-semibold">75% resolution rate</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">By Language</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>English</span>
                <span className="font-semibold">76% resolution rate</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Spanish</span>
                <span className="font-semibold">70% resolution rate</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Other</span>
                <span className="font-semibold">68% resolution rate</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
