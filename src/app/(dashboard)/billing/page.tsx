import Link from "next/link";
import {
  FileText,
  DollarSign,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function BillingDashboard() {
  // Mock data - in production, fetch from API
  const stats = {
    totalRevenue: 125000,
    pendingClaims: 45,
    deniedClaims: 12,
    outstandingAR: 85000,
    collectionRate: 87,
    daysInAR: 42,
  };

  const recentActivity = [
    {
      id: 1,
      type: "claim",
      description: "Claim CLM-123456 submitted",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "payment",
      description: "Payment $250 received",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "denial",
      description: "Claim CLM-123450 denied",
      time: "6 hours ago",
    },
    {
      id: 4,
      type: "invoice",
      description: "Invoice INV-789012 sent",
      time: "1 day ago",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Billing & Revenue Cycle
        </h1>
        <p className="text-gray-600 mt-2">
          Manage claims, payments, and revenue cycle operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4">+12% from last month</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Claims</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.pendingClaims}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <Link
            href="/billing/claims?status=pending"
            className="text-sm text-primary-600 hover:text-primary-700 mt-4 inline-block"
          >
            View claims →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Denied Claims</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.deniedClaims}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <Link
            href="/billing/denials"
            className="text-sm text-primary-600 hover:text-primary-700 mt-4 inline-block"
          >
            Manage denials →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding A/R</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.outstandingAR)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            {stats.daysInAR} days average
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collection Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.collectionRate}%
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 rounded-full h-2"
              style={{ width: `${stats.collectionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Days in A/R</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.daysInAR}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">Target: &lt; 45 days</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/billing/claims/new"
          className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors group"
        >
          <FileText className="w-10 h-10 mx-auto text-gray-400 group-hover:text-primary-600" />
          <p className="mt-3 font-semibold text-gray-900">Create Claim</p>
          <p className="text-sm text-gray-500 mt-1">
            Submit new insurance claim
          </p>
        </Link>

        <Link
          href="/billing/payments"
          className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors group"
        >
          <CreditCard className="w-10 h-10 mx-auto text-gray-400 group-hover:text-primary-600" />
          <p className="mt-3 font-semibold text-gray-900">Post Payment</p>
          <p className="text-sm text-gray-500 mt-1">
            Record patient or insurance payment
          </p>
        </Link>

        <Link
          href="/billing/invoices"
          className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors group"
        >
          <FileText className="w-10 h-10 mx-auto text-gray-400 group-hover:text-primary-600" />
          <p className="mt-3 font-semibold text-gray-900">Generate Invoice</p>
          <p className="text-sm text-gray-500 mt-1">Create patient statement</p>
        </Link>

        <Link
          href="/billing/insurance"
          className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors group"
        >
          <CheckCircle className="w-10 h-10 mx-auto text-gray-400 group-hover:text-primary-600" />
          <p className="mt-3 font-semibold text-gray-900">Check Eligibility</p>
          <p className="text-sm text-gray-500 mt-1">
            Verify insurance coverage
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="p-2 bg-gray-100 rounded-full">
                {activity.type === "claim" && (
                  <FileText className="w-5 h-5 text-gray-600" />
                )}
                {activity.type === "payment" && (
                  <DollarSign className="w-5 h-5 text-green-600" />
                )}
                {activity.type === "denial" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {activity.type === "invoice" && (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
