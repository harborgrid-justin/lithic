/**
 * Enterprise Security Dashboard
 * Comprehensive security posture monitoring
 * Lithic Enterprise Healthcare Platform v0.3
 */

"use client";

import { useState, useEffect as _useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Activity as _Activity, Users, Lock, Key as _Key } from "lucide-react";

export default function SecurityDashboardPage() {
  const [securityPosture, _setSecurityPosture] = useState({
    score: 87,
    grade: "A",
    trends: { daily: [], weekly: [], monthly: [] },
  });

  const [threats, _setThreats] = useState([
    {
      id: "1",
      type: "BRUTE_FORCE",
      severity: "HIGH",
      source: "192.168.1.100",
      status: "INVESTIGATING",
      detectedAt: new Date(),
    },
  ]);

  const [metrics, _setMetrics] = useState({
    totalLogins: 1234,
    failedLogins: 12,
    mfaAdoption: 85,
    activeUsers: 156,
    phiAccessCount: 2341,
    threatCount: 3,
    highSeverityThreats: 1,
    complianceScore: 92,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Enterprise security posture and threat monitoring
          </p>
        </div>
        <Badge
          variant={securityPosture.score >= 80 ? "default" : "danger"}
          className="text-lg px-4 py-2"
        >
          Security Score: {securityPosture.score}/100 ({securityPosture.grade})
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalLogins} logins today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MFA Adoption</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mfaAdoption}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.failedLogins} failed logins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.threatCount}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.highSeverityThreats} high severity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.complianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              HIPAA, SOC2, HITRUST
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Active Threats</TabsTrigger>
          <TabsTrigger value="access">Access Monitoring</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Threats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threats.map((threat) => (
                  <div
                    key={threat.id}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{threat.type}</p>
                      <p className="text-sm text-muted-foreground">
                        Source: {threat.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          threat.severity === "CRITICAL" ||
                          threat.severity === "HIGH"
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {threat.severity}
                      </Badge>
                      <Badge variant="outline">{threat.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PHI Access Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {metrics.phiAccessCount} PHI access events today
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">HIPAA Security Rule</span>
                  <Badge>95% Compliant</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SOC 2 Type II</span>
                  <Badge>88% Compliant</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">HITRUST CSF</span>
                  <Badge>92% Compliant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure organization-wide security policies
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
