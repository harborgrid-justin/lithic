/**
 * Collaboration Hub Page
 * Main entry point for all collaboration features
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, FileText, Layout, Calendar, Users } from "lucide-react";
import Link from "next/link";

export default function CollaborationPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Collaboration Hub</h1>
        <p className="text-gray-600">
          Connect, collaborate, and communicate with your healthcare team
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Video Conferencing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Video Conferencing</CardTitle>
            </div>
            <CardDescription>
              HIPAA-compliant video calls with screen sharing and recording
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/collaboration/room/new">Start New Meeting</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/collaboration/schedule">Schedule Meeting</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Clinical Whiteboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-100 p-2">
                <Layout className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Clinical Whiteboard</CardTitle>
            </div>
            <CardDescription>
              Collaborative visual workspace with clinical templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/collaboration/whiteboard/new">New Whiteboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/collaboration/whiteboard">Browse Templates</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Document Collaboration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Collaborative Documents</CardTitle>
            </div>
            <CardDescription>
              Real-time document editing with version history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/collaboration/document/new">New Document</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/collaboration/document">My Documents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              No recent collaboration activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Active Sessions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Online Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                0 team members currently online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                No upcoming meetings scheduled
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
