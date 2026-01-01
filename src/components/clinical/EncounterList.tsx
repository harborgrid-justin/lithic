"use client";

import { Encounter } from "@/types/clinical";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, User, FileText } from "lucide-react";
import Link from "next/link";

interface EncounterListProps {
  encounters: Encounter[];
}

export function EncounterList({ encounters }: EncounterListProps) {
  const getStatusColor = (status: Encounter["status"]) => {
    const colors = {
      scheduled: "info",
      "in-progress": "warning",
      completed: "success",
      cancelled: "danger",
    };
    return colors[status] as "info" | "warning" | "success" | "danger";
  };

  const getTypeLabel = (type: Encounter["type"]) => {
    const labels = {
      "office-visit": "Office Visit",
      telehealth: "Telehealth",
      emergency: "Emergency",
      hospital: "Hospital",
      consultation: "Consultation",
    };
    return labels[type];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Encounters</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Chief Complaint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {encounters.map((encounter) => (
              <TableRow key={encounter.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDateTime(encounter.date)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getTypeLabel(encounter.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {encounter.patientName}
                  </div>
                </TableCell>
                <TableCell>{encounter.providerName}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {encounter.chiefComplaint}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(encounter.status)}>
                    {encounter.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/clinical/encounters/${encounter.id}`}>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {encounters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No encounters found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
