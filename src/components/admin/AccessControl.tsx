"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Lock, Users } from "lucide-react";

export default function AccessControl() {
  const accessLevels = [
    {
      name: "Super Admin",
      description: "Full system access across all organizations",
      scope: "ALL",
      users: 2,
      color: "bg-red-100 text-red-800",
    },
    {
      name: "Organization Admin",
      description: "Full access within organization",
      scope: "ORGANIZATION",
      users: 5,
      color: "bg-orange-100 text-orange-800",
    },
    {
      name: "Department Manager",
      description: "Access to department resources",
      scope: "DEPARTMENT",
      users: 12,
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "User",
      description: "Access to own resources only",
      scope: "OWN",
      users: 45,
      color: "bg-green-100 text-green-800",
    },
  ];

  const recentGrants = [
    {
      user: "Dr. Sarah Johnson",
      resource: "Patient #12345",
      action: "read",
      grantedBy: "Admin User",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      user: "Nurse Mike Davis",
      resource: "Medication Orders",
      action: "write",
      grantedBy: "Dr. Smith",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Access Levels</CardTitle>
          <CardDescription>
            Overview of permission scopes in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessLevels.map((level) => (
              <div
                key={level.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold">{level.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={level.color}>{level.scope}</Badge>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{level.users}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Temporary Access Grants</CardTitle>
          <CardDescription>Recent temporary access permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentGrants.map((grant, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{grant.user}</p>
                    <p className="text-xs text-muted-foreground">
                      {grant.action} access to {grant.resource}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Expires: {grant.expiresAt.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    By: {grant.grantedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IP Whitelist</CardTitle>
          <CardDescription>
            Restrict access to specific IP addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>No IP restrictions configured</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
