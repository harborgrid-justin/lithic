"use client";

import {
  Activity,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "Total Patients",
    value: "2,543",
    change: "+12.5%",
    icon: Users,
    trend: "up",
  },
  {
    title: "Appointments Today",
    value: "48",
    change: "+4.8%",
    icon: Calendar,
    trend: "up",
  },
  {
    title: "Active Cases",
    value: "167",
    change: "-2.3%",
    icon: Activity,
    trend: "down",
  },
  {
    title: "Average Wait Time",
    value: "12 min",
    change: "-8.1%",
    icon: Clock,
    trend: "up",
  },
];

const recentAppointments = [
  {
    id: "1",
    patient: "Sarah Johnson",
    doctor: "Dr. Smith",
    time: "09:00 AM",
    type: "Checkup",
    status: "Confirmed",
  },
  {
    id: "2",
    patient: "Michael Brown",
    doctor: "Dr. Davis",
    time: "10:30 AM",
    type: "Follow-up",
    status: "In Progress",
  },
  {
    id: "3",
    patient: "Emily Wilson",
    doctor: "Dr. Johnson",
    time: "11:00 AM",
    type: "Consultation",
    status: "Waiting",
  },
  {
    id: "4",
    patient: "David Lee",
    doctor: "Dr. Martinez",
    time: "02:00 PM",
    type: "Emergency",
    status: "Urgent",
  },
  {
    id: "5",
    patient: "Lisa Anderson",
    doctor: "Dr. Smith",
    time: "03:30 PM",
    type: "Checkup",
    status: "Confirmed",
  },
];

const alerts = [
  {
    id: "1",
    message: "Lab results ready for patient #2543",
    time: "5 minutes ago",
    severity: "info",
  },
  {
    id: "2",
    message: "Equipment maintenance scheduled for tomorrow",
    time: "1 hour ago",
    severity: "warning",
  },
  {
    id: "3",
    message: "New patient registration pending approval",
    time: "2 hours ago",
    severity: "info",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <Breadcrumbs items={[{ title: "Dashboard" }]} className="mt-2" />
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={cn(
                      stat.trend === "up" ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {stat.change}
                  </span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Appointments */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointment.patient}
                    </TableCell>
                    <TableCell>{appointment.doctor}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appointment.status === "Urgent"
                            ? "destructive"
                            : appointment.status === "In Progress"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div
                    className={cn(
                      "mt-0.5 h-2 w-2 rounded-full",
                      alert.severity === "warning"
                        ? "bg-yellow-500"
                        : "bg-blue-500",
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>New Patient</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>Book Appointment</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Activity className="h-6 w-6" />
              <span>View Records</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
