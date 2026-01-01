import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Management | Lithic",
  description: "Manage surgical cases and scheduling",
};

export default function CasesPage() {
  const mockCases = [
    {
      id: "1",
      caseNumber: "OR-2026-001",
      patient: "John Doe",
      mrn: "MRN001",
      procedure: "Total Knee Replacement",
      surgeon: "Dr. Smith",
      scheduledDate: "2026-01-15",
      scheduledTime: "07:30",
      room: "OR 1",
      status: "SCHEDULED",
    },
    {
      id: "2",
      caseNumber: "OR-2026-002",
      patient: "Jane Smith",
      mrn: "MRN002",
      procedure: "Hip Replacement",
      surgeon: "Dr. Johnson",
      scheduledDate: "2026-01-15",
      scheduledTime: "09:00",
      room: "OR 2",
      status: "CONFIRMED",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Case Management</h1>
          <p className="text-gray-600">Manage surgical cases and scheduling</p>
        </div>
        <Link href="/or-management/cases/new">
          <Button>Schedule New Case</Button>
        </Link>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surgeon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockCases.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{c.caseNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {c.patient}
                    <br />
                    <span className="text-gray-500">{c.mrn}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{c.procedure}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{c.surgeon}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {c.scheduledDate}
                    <br />
                    <span className="text-gray-500">{c.scheduledTime}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{c.room}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">{c.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
