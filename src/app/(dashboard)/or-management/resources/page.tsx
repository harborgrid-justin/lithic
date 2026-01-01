import { Metadata } from "next";
import { PreferenceCardEditor } from "@/components/or/preference-card-editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Users, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Resource Management | Lithic",
  description: "Manage OR resources, equipment, and staff",
};

export default function ResourcesPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resource Management</h1>
          <p className="text-gray-600">Manage equipment, staff, and preference cards</p>
        </div>
        <Button>Add Resource</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Equipment</h3>
            <Wrench className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-3xl font-bold mb-1">24</p>
          <p className="text-sm text-gray-600">Available items</p>
          <div className="mt-4">
            <Badge variant="outline" className="mr-2">3 in maintenance</Badge>
            <Badge variant="outline">1 unavailable</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Staff</h3>
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-3xl font-bold mb-1">18</p>
          <p className="text-sm text-gray-600">Available staff</p>
          <div className="mt-4">
            <Badge variant="outline" className="mr-2">6 on call</Badge>
            <Badge variant="outline">2 on break</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Preference Cards</h3>
            <Package className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-3xl font-bold mb-1">45</p>
          <p className="text-sm text-gray-600">Active cards</p>
          <div className="mt-4">
            <Badge variant="outline">12 surgeons</Badge>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PreferenceCardEditor />

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Equipment Status</h3>
          <div className="space-y-3">
            {[
              { name: "C-Arm Fluoroscopy", status: "AVAILABLE", room: "Equipment Room A" },
              { name: "Arthroscope Set", status: "IN_USE", room: "OR 2" },
              { name: "Laser System", status: "MAINTENANCE", room: "Service" },
              { name: "Microscope", status: "AVAILABLE", room: "Equipment Room B" },
            ].map((equipment, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{equipment.name}</p>
                  <p className="text-sm text-gray-600">{equipment.room}</p>
                </div>
                <Badge
                  variant={
                    equipment.status === "AVAILABLE"
                      ? "outline"
                      : equipment.status === "IN_USE"
                        ? "default"
                        : "secondary"
                  }
                >
                  {equipment.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
