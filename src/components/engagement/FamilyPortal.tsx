/**
 * Family Access Portal Component
 * Agent 5: Patient Engagement Platform
 */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { FamilyMember, FamilyActivity } from "@/types/engagement";
import { Users, Heart, MessageCircle, Shield } from "lucide-react";

interface FamilyPortalProps {
  familyMembers: FamilyMember[];
  recentActivity: FamilyActivity[];
  onInviteMember?: () => void;
  onViewMember?: (member: FamilyMember) => void;
  className?: string;
}

export function FamilyPortal({
  familyMembers,
  recentActivity,
  onInviteMember,
  onViewMember,
  className,
}: FamilyPortalProps) {
  const activeMembers = familyMembers.filter((m) => m.isActive);
  const pendingInvites = familyMembers.filter((m) => m.invitationStatus === "PENDING");

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Care Circle
            </CardTitle>
            <CardDescription>
              {activeMembers.length} active member{activeMembers.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => onViewMember?.(member)}
              >
                <Avatar>
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {member.relationship.toLowerCase()}
                  </div>
                </div>
                <Badge variant="outline">{member.accessLevel}</Badge>
              </div>
            ))}
            {onInviteMember && (
              <Button onClick={onInviteMember} variant="outline" className="w-full mt-2">
                Invite Family Member
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Support from your care circle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2">
                <MessageCircle className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvites.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Invited {new Date(member.invitationSentDate!).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
