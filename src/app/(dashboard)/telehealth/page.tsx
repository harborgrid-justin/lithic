"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, User, FileText, Play } from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/utils";
import { SessionSummary, SessionStatus, SessionType } from "@/types/telehealth";
import Link from "next/link";

export default function TelehealthDashboard() {
  const [upcomingSessions, setUpcomingSessions] = useState<SessionSummary[]>(
    [],
  );
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // In production, get actual user ID from auth context
      const providerId = "provider_001";

      const upcomingRes = await fetch(
        `/api/telehealth/sessions?providerId=${providerId}&upcoming=true`,
      );
      const upcoming = await upcomingRes.json();
      setUpcomingSessions(upcoming);

      const recentRes = await fetch(
        `/api/telehealth/sessions?providerId=${providerId}`,
      );
      const all = await recentRes.json();
      const recent = all
        .filter((s: any) => s.status === "COMPLETED")
        .sort(
          (a: any, b: any) =>
            new Date(b.scheduledStartTime).getTime() -
            new Date(a.scheduledStartTime).getTime(),
        )
        .slice(0, 5);
      setRecentSessions(recent);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    const variants: Record<SessionStatus, any> = {
      SCHEDULED: "secondary",
      WAITING: "default",
      IN_PROGRESS: "default",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
      NO_SHOW: "destructive",
      TECHNICAL_FAILURE: "destructive",
    };

    return <Badge variant={variants[status]}>{status.replace("_", " ")}</Badge>;
  };

  const getTypeBadge = (type: SessionType) => {
    return <Badge variant="outline">{type.replace(/_/g, " ")}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Telehealth</h1>
          <p className="text-gray-600 mt-1">
            Manage your virtual consultations
          </p>
        </div>
        <Button asChild>
          <Link href="/telehealth/new-session">
            <Video className="h-4 w-4 mr-2" />
            New Session
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Sessions
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                upcomingSessions.filter((s) => {
                  const today = new Date();
                  const sessionDate = new Date(s.scheduledStartTime);
                  return sessionDate.toDateString() === today.toDateString();
                }).length
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
            <p className="text-xs text-gray-600 mt-1">
              Total upcoming sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentSessions.length}</div>
            <p className="text-xs text-gray-600 mt-1">Sessions completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>
            Your scheduled telehealth appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming sessions</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/telehealth/new-session">Schedule a Session</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{session.patientName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeBadge(session.type)}
                        {getStatusBadge(session.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.scheduledStartTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(session.scheduledStartTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/telehealth/session/${session.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/telehealth/room/${session.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Session
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your recently completed sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent sessions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{session.patientName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeBadge(session.type)}
                        {getStatusBadge(session.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div>{formatDateTime(session.scheduledStartTime)}</div>
                        {session.duration && (
                          <div>{session.duration} minutes</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.recordingAvailable && (
                      <Badge variant="outline">
                        <Video className="h-3 w-3 mr-1" />
                        Recording Available
                      </Badge>
                    )}
                    {session.clinicalNoteCompleted && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        Note Complete
                      </Badge>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/telehealth/session/${session.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
