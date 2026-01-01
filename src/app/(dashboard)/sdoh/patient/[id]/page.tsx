/**
 * Patient SDOH Profile Page
 * Comprehensive view of patient's SDOH screening, needs, and referrals
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NeedsSummary } from "@/components/sdoh/needs-summary";
import { ReferralTracker } from "@/components/sdoh/referral-tracker";
import { FileText, Send, TrendingUp, Calendar } from "lucide-react";
import { ReferralStatus } from "@/lib/sdoh/referrals/referral-engine";

interface PageProps {
  params: {
    id: string;
  };
}

export default function PatientSDOHProfilePage({ params }: PageProps) {
  const patientId = params.id;

  // Mock data - would come from API in production
  const mockNeeds = [
    {
      category: "Food Insecurity",
      severity: "high" as const,
      description: "Patient reports running out of food before having money to buy more",
      status: "in_progress" as const,
      identifiedDate: "2024-01-15",
      actions: ["SNAP Referral", "Food Pantry"],
    },
    {
      category: "Housing Instability",
      severity: "critical" as const,
      description: "At risk of eviction, behind on rent payments",
      status: "identified" as const,
      identifiedDate: "2024-01-15",
      actions: ["Emergency Housing", "Legal Aid"],
    },
  ];

  const mockReferral = {
    id: "1",
    resourceName: "Community Food Bank",
    needCategory: "Food Insecurity",
    status: ReferralStatus.IN_PROGRESS,
    sentDate: "2024-01-16",
    urgency: "ROUTINE",
    receivingOrganizationName: "Metro Food Bank Network",
    statusHistory: [
      {
        status: ReferralStatus.SENT,
        timestamp: "2024-01-16T10:00:00Z",
        updatedBy: "Dr. Smith",
        notes: "Referral sent to food bank",
      },
      {
        status: ReferralStatus.RECEIVED,
        timestamp: "2024-01-16T14:30:00Z",
        updatedBy: "Food Bank Staff",
        notes: "Referral received, processing intake",
      },
      {
        status: ReferralStatus.ACCEPTED,
        timestamp: "2024-01-17T09:00:00Z",
        updatedBy: "Food Bank Staff",
        notes: "Patient scheduled for food assistance",
      },
      {
        status: ReferralStatus.IN_PROGRESS,
        timestamp: "2024-01-18T11:00:00Z",
        updatedBy: "Food Bank Staff",
        notes: "Patient attended first visit, enrolled in weekly food program",
      },
    ],
  };

  return (
    <div className="p-8 space-y-6">
      {/* Patient Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Patient SDOH Profile</h1>
          <p className="text-gray-600 mt-2">ID: {patientId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            New Screening
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Create Referral
          </Button>
        </div>
      </div>

      {/* SDOH Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Screening</p>
              <p className="text-lg font-semibold mt-1">Jan 15, 2024</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Needs</p>
              <p className="text-lg font-semibold mt-1">2</p>
              <Badge className="mt-1 bg-orange-100 text-orange-800">High Priority</Badge>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Referrals</p>
              <p className="text-lg font-semibold mt-1">1</p>
            </div>
            <Send className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Risk Level</p>
              <p className="text-lg font-semibold mt-1">High</p>
              <Badge className="mt-1 bg-red-100 text-red-800">Action Needed</Badge>
            </div>
            <TrendingUp className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="needs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="needs">Identified Needs</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="history">Screening History</TabsTrigger>
        </TabsList>

        <TabsContent value="needs">
          <NeedsSummary
            needs={mockNeeds}
            onCreateReferral={(need) => console.log("Create referral:", need)}
            onViewDetails={(need) => console.log("View details:", need)}
          />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralTracker
            referral={mockReferral}
            onUpdateStatus={(status, notes) =>
              console.log("Update status:", status, notes)
            }
            onSendMessage={() => console.log("Send message")}
          />
        </TabsContent>

        <TabsContent value="outcomes">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Outcome Tracking</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">Food Insecurity</h3>
                  <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-gray-600">Baseline</p>
                    <p className="font-semibold">Severe food insecurity</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Status</p>
                    <p className="font-semibold text-green-600">Improving</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Follow-up Scheduled</p>
                  <p className="font-semibold">Feb 15, 2024</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">Housing Instability</h3>
                  <Badge className="bg-blue-100 text-blue-800">Identified</Badge>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Next Action</p>
                  <p className="font-semibold">Connect with housing assistance program</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Screening History</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-semibold">PRAPARE Screening</p>
                  <p className="text-sm text-gray-600">Jan 15, 2024 by Dr. Smith</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <Badge className="bg-orange-100 text-orange-800">High</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-semibold">AHC HRSN Screening</p>
                  <p className="text-sm text-gray-600">Oct 12, 2023 by Dr. Smith</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Risk Level</p>
                  <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Items */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recommended Actions</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full" />
              <span className="font-medium">
                Create housing assistance referral - High Priority
              </span>
            </div>
            <Button size="sm">Create Referral</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              <span className="font-medium">
                Schedule 1-month food security follow-up
              </span>
            </div>
            <Button size="sm" variant="outline">
              Schedule
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
