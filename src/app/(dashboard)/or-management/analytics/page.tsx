import { Metadata } from "next";
import { UtilizationChart } from "@/components/or/utilization-chart";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "OR Analytics | Lithic",
  description: "Comprehensive OR analytics and performance metrics",
};

export default function AnalyticsPage() {
  const mockUtilizationData = [
    { date: "Jan 1", utilization: 78, target: 85, primeTime: 85 },
    { date: "Jan 8", utilization: 82, target: 85, primeTime: 88 },
    { date: "Jan 15", utilization: 75, target: 85, primeTime: 80 },
    { date: "Jan 22", utilization: 88, target: 85, primeTime: 92 },
    { date: "Jan 29", utilization: 85, target: 85, primeTime: 90 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">OR Analytics</h1>
        <p className="text-gray-600">Performance metrics and trend analysis</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-3xl font-bold">85.2%</p>
          <p className="text-sm text-green-600 mt-1">+2.4% from last week</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">On-Time Starts</p>
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">87%</p>
          <p className="text-sm text-gray-600 mt-1">Target: 90%</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Turnover</p>
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold">28 min</p>
          <p className="text-sm text-green-600 mt-1">-3 min from target</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Cancellation Rate</p>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-3xl font-bold">3.2%</p>
          <p className="text-sm text-red-600 mt-1">+0.5% from last week</p>
        </Card>
      </div>

      <UtilizationChart data={mockUtilizationData} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Top Performing Surgeons</h3>
          <div className="space-y-3">
            {[
              { name: "Dr. Smith", cases: 45, utilization: 92 },
              { name: "Dr. Johnson", cases: 38, utilization: 88 },
              { name: "Dr. Williams", cases: 35, utilization: 85 },
            ].map((surgeon) => (
              <div key={surgeon.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{surgeon.name}</p>
                  <p className="text-sm text-gray-600">{surgeon.cases} cases this month</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{surgeon.utilization}%</p>
                  <p className="text-xs text-gray-600">Block Utilization</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Room Performance</h3>
          <div className="space-y-3">
            {[
              { name: "OR 1", utilization: 88, turnover: 25 },
              { name: "OR 2", utilization: 85, turnover: 28 },
              { name: "OR 3", utilization: 82, turnover: 30 },
            ].map((room) => (
              <div key={room.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-sm text-gray-600">Utilization: {room.utilization}%</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{room.turnover} min</p>
                  <p className="text-xs text-gray-600">Avg Turnover</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
