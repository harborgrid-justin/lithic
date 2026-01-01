"use client";

import { useState, useEffect } from "react";
import { RevenueMetrics, ARAgingBucket } from "@/types/billing";
import RevenueChart from "@/components/billing/RevenueChart";
import ARAgingReport from "@/components/billing/ARAgingReport";
import { BarChart3, TrendingUp, Calendar, FileText } from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"revenue" | "aging">("revenue");
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics[]>([]);
  const [agingBuckets, setAgingBuckets] = useState<ARAgingBucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production, fetch from API
    const mockRevenueMetrics: RevenueMetrics[] = [
      {
        period: "Jan 2024",
        totalCharges: 125000,
        totalPayments: 108000,
        totalAdjustments: 5000,
        netRevenue: 103000,
        claimsSubmitted: 450,
        claimsPaid: 380,
        claimsDenied: 25,
        averageReimbursementRate: 82,
        daysInAR: 42,
        collectionRate: 87,
      },
      {
        period: "Feb 2024",
        totalCharges: 135000,
        totalPayments: 118000,
        totalAdjustments: 6000,
        netRevenue: 112000,
        claimsSubmitted: 480,
        claimsPaid: 410,
        claimsDenied: 22,
        averageReimbursementRate: 83,
        daysInAR: 40,
        collectionRate: 88,
      },
      {
        period: "Mar 2024",
        totalCharges: 142000,
        totalPayments: 125000,
        totalAdjustments: 7000,
        netRevenue: 118000,
        claimsSubmitted: 500,
        claimsPaid: 430,
        claimsDenied: 20,
        averageReimbursementRate: 84,
        daysInAR: 38,
        collectionRate: 89,
      },
    ];

    const mockAgingBuckets: ARAgingBucket[] = [
      { range: "0-30 days", count: 125, amount: 42000, percentage: 35 },
      { range: "31-60 days", count: 85, amount: 38000, percentage: 32 },
      { range: "61-90 days", count: 45, amount: 22000, percentage: 18 },
      { range: "91-120 days", count: 25, amount: 12000, percentage: 10 },
      { range: "120+ days", count: 20, amount: 6000, percentage: 5 },
    ];

    setTimeout(() => {
      setRevenueMetrics(mockRevenueMetrics);
      setAgingBuckets(mockAgingBuckets);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Billing Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          View revenue metrics and accounts receivable aging
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-500">Collection Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {revenueMetrics.length > 0
              ? `${revenueMetrics[revenueMetrics.length - 1].collectionRate}%`
              : "-"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-500">Days in A/R</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {revenueMetrics.length > 0
              ? revenueMetrics[revenueMetrics.length - 1].daysInAR
              : "-"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-500">Denial Rate</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {revenueMetrics.length > 0
              ? `${Math.round((revenueMetrics[revenueMetrics.length - 1].claimsDenied / revenueMetrics[revenueMetrics.length - 1].claimsSubmitted) * 100)}%`
              : "-"}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-gray-500">Claims Submitted</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {revenueMetrics.length > 0
              ? revenueMetrics[revenueMetrics.length - 1].claimsSubmitted
              : "-"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "revenue"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Revenue Analysis
          </button>
          <button
            onClick={() => setActiveTab("aging")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "aging"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            A/R Aging Report
          </button>
        </nav>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      ) : (
        <>
          {activeTab === "revenue" && (
            <RevenueChart metrics={revenueMetrics} chartType="bar" />
          )}
          {activeTab === "aging" && <ARAgingReport buckets={agingBuckets} />}
        </>
      )}
    </div>
  );
}
