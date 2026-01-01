import { Metadata } from "next";
import { TimelineView } from "@/components/or/timeline-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "OR Schedule | Lithic",
  description: "Daily OR schedule and timeline view",
};

export default function ORSchedulePage() {
  const mockCases = [
    {
      id: "1",
      room: "OR 1",
      patient: "John Doe",
      procedure: "Total Knee Replacement",
      startTime: new Date(new Date().setHours(7, 30, 0, 0)),
      endTime: new Date(new Date().setHours(9, 30, 0, 0)),
      surgeon: "Dr. Smith",
    },
    {
      id: "2",
      room: "OR 2",
      patient: "Jane Smith",
      procedure: "Hip Replacement",
      startTime: new Date(new Date().setHours(8, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 30, 0, 0)),
      surgeon: "Dr. Johnson",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">OR Schedule</h1>
          <p className="text-gray-600">Daily surgical schedule timeline</p>
        </div>
        <Button>Add Case</Button>
      </div>
      <TimelineView cases={mockCases} date={new Date()} />
    </div>
  );
}
