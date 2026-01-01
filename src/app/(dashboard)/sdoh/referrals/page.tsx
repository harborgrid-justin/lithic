/**
 * SDOH Referral Management Page
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { ReferralStatus } from "@/lib/sdoh/referrals/referral-engine";

export default function SDOHReferralsPage() {
  const mockReferrals = [
    {
      id: "1",
      patientName: "John Doe",
      resourceName: "Community Food Bank",
      needCategory: "Food Insecurity",
      status: ReferralStatus.ACCEPTED,
      sentDate: "2024-01-15",
      urgency: "ROUTINE",
    },
    {
      id: "2",
      patientName: "Jane Smith",
      resourceName: "Housing First Program",
      needCategory: "Housing",
      status: ReferralStatus.IN_PROGRESS,
      sentDate: "2024-01-14",
      urgency: "URGENT",
    },
  ];

  const getStatusIcon = (status: ReferralStatus) => {
    switch (status) {
      case ReferralStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case ReferralStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case ReferralStatus.SENT:
        return <Send className="h-5 w-5 text-purple-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Referral Management</h1>
          <p className="text-gray-600 mt-2">
            Track and manage SDOH referrals to community resources
          </p>
        </div>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          New Referral
        </Button>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Referrals</p>
          <p className="text-2xl font-bold mt-1">513</p>
          <p className="text-sm text-green-600 mt-1">+23 this week</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold mt-1">45</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold mt-1">123</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Completion Rate</p>
          <p className="text-2xl font-bold mt-1">85%</p>
        </Card>
      </div>

      {/* Referral Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Referrals</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {mockReferrals.map((referral) => (
            <Card key={referral.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(referral.status)}
                    <h3 className="font-semibold">{referral.patientName}</h3>
                    <Badge variant="outline">{referral.needCategory}</Badge>
                    {referral.urgency === "URGENT" && (
                      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">
                    Resource: {referral.resourceName}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Status: {referral.status.replace(/_/g, " ")}</span>
                    <span>
                      Sent: {new Date(referral.sentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending">
          <Card className="p-8 text-center">
            <p className="text-gray-600">No pending referrals</p>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card className="p-8 text-center">
            <p className="text-gray-600">No active referrals</p>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="p-8 text-center">
            <p className="text-gray-600">No completed referrals</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
