"use client";

import { ARAgingBucket } from "@/types/billing";
import { formatCurrency } from "@/lib/utils";
import { FileText, TrendingUp, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ARAgingReportProps {
  buckets: ARAgingBucket[];
}

export default function ARAgingReport({ buckets }: ARAgingReportProps) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const totalCount = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  const chartData = buckets.map((bucket) => ({
    range: bucket.range,
    amount: bucket.amount,
    count: bucket.count,
  }));

  const getBarColor = (range: string) => {
    if (range.includes("0-30")) return "#10b981";
    if (range.includes("31-60")) return "#3b82f6";
    if (range.includes("61-90")) return "#f59e0b";
    if (range.includes("91-120")) return "#ef4444";
    return "#991b1b";
  };

  const getRiskLevel = () => {
    const over90Days = buckets
      .filter((b) => b.range.includes("91-") || b.range.includes("120+"))
      .reduce((sum, b) => sum + b.amount, 0);

    const percentage = total > 0 ? (over90Days / total) * 100 : 0;

    if (percentage < 15)
      return { level: "Low", color: "text-green-600", bg: "bg-green-50" };
    if (percentage < 30)
      return { level: "Medium", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "High", color: "text-red-600", bg: "bg-red-50" };
  };

  const risk = getRiskLevel();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <p className="text-sm text-gray-500">Total A/R</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(total)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{totalCount} accounts</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">0-30 Days</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(
              buckets.find((b) => b.range.includes("0-30"))?.amount || 0,
            )}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {buckets.find((b) => b.range.includes("0-30"))?.percentage || 0}% of
            total
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">90+ Days</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(
              buckets
                .filter(
                  (b) => b.range.includes("91-") || b.range.includes("120+"),
                )
                .reduce((sum, b) => sum + b.amount, 0),
            )}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {buckets
              .filter(
                (b) => b.range.includes("91-") || b.range.includes("120+"),
              )
              .reduce((sum, b) => sum + b.percentage, 0)
              .toFixed(1)}
            % of total
          </p>
        </div>
        <div className={`${risk.bg} border-2 rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={`w-5 h-5 ${risk.color}`} />
            <p className="text-sm text-gray-700">Risk Level</p>
          </div>
          <p className={`text-2xl font-bold ${risk.color}`}>{risk.level}</p>
          <p className="text-xs text-gray-600 mt-1">
            Based on aging distribution
          </p>
        </div>
      </div>

      {/* Aging Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">A/R Aging Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "amount" ? formatCurrency(value) : value
              }
            />
            <Bar dataKey="amount" name="Amount">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aging Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Aging Bucket
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Count
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Visual
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {buckets.map((bucket, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bucket.range}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {bucket.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                  {formatCurrency(bucket.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {bucket.percentage.toFixed(1)}%
                </td>
                <td className="px-6 py-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="rounded-full h-2"
                      style={{
                        width: `${bucket.percentage}%`,
                        backgroundColor: getBarColor(bucket.range),
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                {totalCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                {formatCurrency(total)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                100.0%
              </td>
              <td className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Key Insights
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            •{" "}
            {(
              buckets.find((b) => b.range.includes("0-30"))?.percentage || 0
            ).toFixed(1)}
            % of receivables are current (0-30 days)
          </li>
          <li>• {totalCount} total accounts with outstanding balances</li>
          <li>
            • Focus collection efforts on{" "}
            {buckets
              .filter(
                (b) => b.range.includes("91-") || b.range.includes("120+"),
              )
              .reduce((sum, b) => sum + b.count, 0)}{" "}
            accounts over 90 days
          </li>
        </ul>
      </div>
    </div>
  );
}
