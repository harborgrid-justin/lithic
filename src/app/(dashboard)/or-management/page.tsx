import { Metadata } from "next";
import { ORBoard } from "@/components/or/or-board";
import { UtilizationChart } from "@/components/or/utilization-chart";
import { Card } from "@/components/ui/card";
import { Activity, Clock, Calendar, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "OR Management Dashboard | Lithic",
  description: "Comprehensive OR management and surgical scheduling",
};

export default function ORManagementPage() {
  const mockCases = [
    {
      caseId: "1",
      patient: "John Doe",
      procedure: "Total Knee Replacement",
      surgeon: "Dr. Smith",
      status: "IN_ROOM",
      startTime: "07:30",
      progress: 45,
    },
    {
      caseId: "2",
      patient: "Jane Smith",
      procedure: "Hip Replacement",
      surgeon: "Dr. Johnson",
      status: "PROCEDURE_START",
      startTime: "09:00",
      progress: 65,
    },
  ];

  const mockUtilizationData = [
    { date: "Mon", utilization: 78, target: 85, primeTime: 85 },
    { date: "Tue", utilization: 82, target: 85, primeTime: 88 },
    { date: "Wed", utilization: 75, target: 85, primeTime: 80 },
    { date: "Thu", utilization: 88, target: 85, primeTime: 92 },
    { date: "Fri", utilization: 85, target: 85, primeTime: 90 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">OR Management Dashboard</h1>
        <p className="text-gray-600">Real-time surgical scheduling and OR analytics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cases</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Utilization</p>
              <p className="text-2xl font-bold">85%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Turnover</p>
              <p className="text-2xl font-bold">28 min</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled Tomorrow</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Live OR Board</h2>
          <ORBoard cases={mockCases} />
        </div>
        <div>
          <UtilizationChart data={mockUtilizationData} />
        </div>
      </div>
    </div>
  );
}
