"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Download, UserPlus, Search } from "lucide-react";

interface PatientRegistryProps {
  registryId: string;
  onClose: () => void;
}

export function PatientRegistry({ registryId, onClose }: PatientRegistryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const patients = [
    {
      id: "1",
      name: "John Smith",
      mrn: "MRN-001234",
      riskLevel: "HIGH",
      careGaps: 3,
      lastContact: "2024-11-15",
    },
    {
      id: "2",
      name: "Mary Johnson",
      mrn: "MRN-002345",
      riskLevel: "MEDIUM",
      careGaps: 1,
      lastContact: "2024-11-20",
    },
    {
      id: "3",
      name: "Robert Williams",
      mrn: "MRN-003456",
      riskLevel: "LOW",
      careGaps: 0,
      lastContact: "2024-11-18",
    },
    {
      id: "4",
      name: "Patricia Brown",
      mrn: "MRN-004567",
      riskLevel: "VERY_HIGH",
      careGaps: 5,
      lastContact: "2024-11-10",
    },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "CRITICAL":
      case "VERY_HIGH":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Registry Patients</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll Patients
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <CardContent className="flex-1 overflow-auto p-0">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MRN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Care Gaps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {patient.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.mrn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getRiskColor(patient.riskLevel)}>
                      {patient.riskLevel}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.careGaps > 0 ? (
                      <span className="text-orange-600 font-medium">
                        {patient.careGaps} gaps
                      </span>
                    ) : (
                      <span className="text-green-600">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(patient.lastContact).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
