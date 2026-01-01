import { Metadata } from "next";
import { BlockCalendar } from "@/components/or/block-calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Block Management | Lithic",
  description: "Manage OR block schedules and utilization",
};

export default function BlocksPage() {
  const mockBlocks = [
    {
      id: "1",
      surgeon: "Dr. Smith",
      room: "OR 1",
      startTime: "07:00",
      endTime: "15:00",
      utilization: 85,
    },
    {
      id: "2",
      surgeon: "Dr. Johnson",
      room: "OR 2",
      startTime: "08:00",
      endTime: "16:00",
      utilization: 78,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Block Management</h1>
          <p className="text-gray-600">Manage surgeon block schedules and allocation</p>
        </div>
        <Button>Create Block</Button>
      </div>
      <BlockCalendar blocks={mockBlocks} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Total Blocks</h3>
          <p className="text-3xl font-bold">24</p>
          <p className="text-sm text-gray-600 mt-1">Active this week</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Avg Utilization</h3>
          <p className="text-3xl font-bold">82%</p>
          <p className="text-sm text-gray-600 mt-1">Above target</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Released Blocks</h3>
          <p className="text-3xl font-bold">3</p>
          <p className="text-sm text-gray-600 mt-1">This week</p>
        </Card>
      </div>
    </div>
  );
}
