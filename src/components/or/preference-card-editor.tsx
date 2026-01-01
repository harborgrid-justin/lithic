"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

export function PreferenceCardEditor() {
  const [equipment, setEquipment] = useState([
    { id: "1", name: "C-Arm", required: true },
  ]);

  const addEquipment = () => {
    setEquipment([
      ...equipment,
      { id: Date.now().toString(), name: "", required: false },
    ]);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Preference Card Editor</h2>
      <div className="space-y-4">
        <div>
          <Label>Surgeon</Label>
          <Input placeholder="Select surgeon..." />
        </div>
        <div>
          <Label>Procedure</Label>
          <Input placeholder="Select procedure..." />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Equipment</Label>
            <Button size="sm" onClick={addEquipment}>
              <Plus className="h-4 w-4 mr-1" /> Add Equipment
            </Button>
          </div>
          {equipment.map((eq) => (
            <div key={eq.id} className="flex gap-2 mb-2">
              <Input
                value={eq.name}
                onChange={(e) => {
                  const updated = equipment.map((item) =>
                    item.id === eq.id ? { ...item, name: e.target.value } : item
                  );
                  setEquipment(updated);
                }}
                placeholder="Equipment name"
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={eq.required}
                  onCheckedChange={(checked) => {
                    const updated = equipment.map((item) =>
                      item.id === eq.id
                        ? { ...item, required: checked as boolean }
                        : item
                    );
                    setEquipment(updated);
                  }}
                />
                <Label className="text-sm">Required</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEquipment(equipment.filter((item) => item.id !== eq.id))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full">Save Preference Card</Button>
      </div>
    </Card>
  );
}
