/**
 * SDOH Dashboard Page
 * Main overview of SDOH program metrics
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { Card } from "@/components/ui/card";
import { Users, FileText, Send, TrendingUp, AlertCircle } from "lucide-react";

export default function SDOHDashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SDOH Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Social Determinants of Health - Program Overview
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Patients Screened</p>
              <p className="text-3xl font-bold mt-2">1,247</p>
              <p className="text-sm text-green-600 mt-1">+12% this month</p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Identified</p>
              <p className="text-3xl font-bold mt-2">523</p>
              <p className="text-sm text-orange-600 mt-1">42% screening rate</p>
            </div>
            <AlertCircle className="h-12 w-12 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Referrals</p>
              <p className="text-3xl font-bold mt-2">189</p>
              <p className="text-sm text-blue-600 mt-1">85% completion rate</p>
            </div>
            <Send className="h-12 w-12 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Resolved</p>
              <p className="text-3xl font-bold mt-2">312</p>
              <p className="text-sm text-green-600 mt-1">+18% vs last month</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Identified Needs</h2>
          <div className="space-y-3">
            {[
              { need: "Food Insecurity", count: 156, percent: 30 },
              { need: "Housing Instability", count: 98, percent: 19 },
              { need: "Transportation", count: 87, percent: 17 },
              { need: "Utilities", count: 76, percent: 15 },
              { need: "Financial Strain", count: 106, percent: 20 },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium">{item.need}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Referral Status</h2>
          <div className="space-y-3">
            {[
              { status: "Pending", count: 45, color: "bg-yellow-500" },
              { status: "Accepted", count: 78, color: "bg-blue-500" },
              { status: "In Progress", count: 66, color: "bg-purple-500" },
              { status: "Completed", count: 312, color: "bg-green-500" },
              { status: "Rejected", count: 12, color: "bg-red-500" },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="font-medium">{item.status}</span>
                </div>
                <span className="text-gray-600">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/sdoh/screening"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-8 w-8 text-blue-500 mb-2" />
            <h3 className="font-semibold">Start Screening</h3>
            <p className="text-sm text-gray-600">Screen patient for SDOH needs</p>
          </a>
          <a
            href="/sdoh/resources"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-green-500 mb-2" />
            <h3 className="font-semibold">Find Resources</h3>
            <p className="text-sm text-gray-600">Search community resources</p>
          </a>
          <a
            href="/sdoh/referrals"
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Send className="h-8 w-8 text-purple-500 mb-2" />
            <h3 className="font-semibold">Manage Referrals</h3>
            <p className="text-sm text-gray-600">Track referral status</p>
          </a>
        </div>
      </Card>
    </div>
  );
}
