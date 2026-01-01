"use client";

/**
 * PatientsWidget - Recent and Favorite Patients Quick Access
 * Provides quick access to frequently accessed patient records
 */

import { useState } from "react";
import {
  User,
  Star,
  Clock,
  FileText,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, calculateAge } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "M" | "F" | "O";
  avatar?: string;
  lastVisit?: Date;
  nextAppointment?: Date;
  status: "active" | "inactive" | "critical";
  flags?: string[];
  isFavorite?: boolean;
}

interface PatientsWidgetProps {
  className?: string;
  maxItems?: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockPatients: Patient[] = [
  {
    id: "p1",
    mrn: "MRN-1247",
    firstName: "Sarah",
    lastName: "Johnson",
    dateOfBirth: new Date("1985-06-15"),
    gender: "F",
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    nextAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "active",
    flags: ["Diabetes", "Hypertension"],
    isFavorite: true,
  },
  {
    id: "p2",
    mrn: "MRN-2891",
    firstName: "Michael",
    lastName: "Chen",
    dateOfBirth: new Date("1972-03-22"),
    gender: "M",
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "active",
    flags: ["Asthma"],
    isFavorite: true,
  },
  {
    id: "p3",
    mrn: "MRN-3456",
    firstName: "Emily",
    lastName: "Davis",
    dateOfBirth: new Date("1990-11-08"),
    gender: "F",
    lastVisit: new Date(Date.now() - 1 * 60 * 60 * 1000),
    nextAppointment: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: "active",
    isFavorite: false,
  },
  {
    id: "p4",
    mrn: "MRN-4782",
    firstName: "Robert",
    lastName: "Wilson",
    dateOfBirth: new Date("1958-09-30"),
    gender: "M",
    lastVisit: new Date(Date.now() - 30 * 60 * 1000),
    status: "critical",
    flags: ["CHF", "COPD", "Anticoagulation"],
    isFavorite: true,
  },
  {
    id: "p5",
    mrn: "MRN-5123",
    firstName: "Jennifer",
    lastName: "Martinez",
    dateOfBirth: new Date("2015-04-12"),
    gender: "F",
    lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: "active",
    isFavorite: false,
  },
];

// ============================================================================
// Component
// ============================================================================

export function PatientsWidget({
  className,
  maxItems = 5,
}: PatientsWidgetProps) {
  const [patients] = useState<Patient[]>(mockPatients);
  const [activeTab, setActiveTab] = useState<"recent" | "favorites">("recent");

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "inactive":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getNextAppointment = (date: Date): string => {
    const days = Math.floor(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `In ${days} days`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const recentPatients = [...patients]
    .sort((a, b) => {
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return b.lastVisit.getTime() - a.lastVisit.getTime();
    })
    .slice(0, maxItems);

  const favoritePatients = patients
    .filter((p) => p.isFavorite)
    .slice(0, maxItems);

  const displayPatients =
    activeTab === "recent" ? recentPatients : favoritePatients;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "recent" | "favorites")}
      >
        <div className="flex items-center justify-between">
          <TabsList className="h-9">
            <TabsTrigger value="recent" className="text-xs">
              Recent
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Favorites
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            All Patients
          </Button>
        </div>

        {/* Patient List */}
        <TabsContent value={activeTab} className="mt-3 space-y-2">
          {displayPatients.map((patient) => (
            <div
              key={patient.id}
              className="group flex items-start gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer"
            >
              {/* Avatar */}
              <Avatar className="flex-shrink-0">
                <AvatarImage
                  src={patient.avatar}
                  alt={`${patient.firstName} ${patient.lastName}`}
                />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {getInitials(patient.firstName, patient.lastName)}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      {patient.isFavorite && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {patient.mrn} • {patient.gender} •{" "}
                      {calculateAge(patient.dateOfBirth)}y
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs flex-shrink-0",
                      getStatusColor(patient.status),
                    )}
                  >
                    {patient.status}
                  </Badge>
                </div>

                {/* Flags */}
                {patient.flags && patient.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {patient.flags.map((flag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                      >
                        {flag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  {patient.lastVisit && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Visited {getTimeAgo(patient.lastVisit)}</span>
                    </div>
                  )}
                  {patient.nextAppointment && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Next: {getNextAppointment(patient.nextAppointment)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    asChild
                  >
                    <a href={`/patients/${patient.id}`}>
                      <FileText className="w-3 h-3 mr-1" />
                      Chart
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {displayPatients.length === 0 && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">
            {activeTab === "favorites"
              ? "No favorite patients"
              : "No recent patients"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === "favorites"
              ? "Star patients to add them to your favorites"
              : "Patient visits will appear here"}
          </p>
        </div>
      )}
    </div>
  );
}
