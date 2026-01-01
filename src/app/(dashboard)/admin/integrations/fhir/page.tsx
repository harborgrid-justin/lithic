"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert } from "@/components/ui/alert";
import {
  Server,
  Database,
  Download,
  Upload as _Upload,
  Settings,
  CheckCircle2,
  XCircle,
  Activity,
  Lock,
  Globe,
  FileText,
  Code,
} from "lucide-react";

export default function FHIRConfigurationPage() {
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [config, setConfig] = useState({
    baseUrl: "http://localhost:3000/api/fhir",
    enableSmartOnFHIR: true,
    enableBulkData: true,
    enableCORS: true,
    supportedResources: [] as string[],
  });
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = async () => {
    try {
      const res = await fetch("/api/fhir/metadata");
      const data = await res.json();
      setCapabilities(data);

      if (data.implementation) {
        setConfig((prev) => ({ ...prev, baseUrl: data.implementation.url }));
      }
    } catch (error) {
      console.error("Failed to load capabilities:", error);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fhir/metadata");
      const data = await res.json();

      setTestResults({
        success: true,
        message: "Connection successful",
        fhirVersion: data.fhirVersion,
        resourceCount: data.rest?.[0]?.resource?.length || 0,
      });
    } catch (error) {
      setTestResults({
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fhir/$export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "respond-async",
        },
        body: JSON.stringify({
          _type: "Patient,Observation,Condition",
          _outputFormat: "application/fhir+ndjson",
        }),
      });

      if (res.status === 202) {
        const statusUrl = res.headers.get("Content-Location");
        alert(`Export initiated. Status URL: ${statusUrl}`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FHIR Configuration</h1>
          <p className="text-gray-500 mt-2">
            Configure and manage FHIR R4 interoperability settings
          </p>
        </div>
        <Button onClick={testConnection} disabled={loading}>
          <Activity className="h-4 w-4 mr-2" />
          Test Connection
        </Button>
      </div>

      {testResults && (
        <Alert
          className={
            testResults.success ? "border-green-500" : "border-red-500"
          }
        >
          <div className="flex items-center gap-2">
            {testResults.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <p className="font-semibold">{testResults.message}</p>
              {testResults.success && (
                <p className="text-sm text-gray-500">
                  FHIR {testResults.fhirVersion} - {testResults.resourceCount}{" "}
                  resource types supported
                </p>
              )}
            </div>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  FHIR Version
                </CardTitle>
                <Server className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {capabilities?.fhirVersion || "Loading..."}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  HL7 FHIR R4 Standard
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Supported Resources
                </CardTitle>
                <Database className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {capabilities?.rest?.[0]?.resource?.length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Resource types available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Server Status
                </CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Server is operational
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Capability Statement</CardTitle>
              <CardDescription>
                Server capabilities and supported interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {capabilities ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Publisher</Label>
                    <p className="text-sm text-gray-600">
                      {capabilities.publisher}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Formats</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {capabilities.format?.map((format: string) => (
                        <Badge key={format} variant="secondary">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Interactions</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {capabilities.rest?.[0]?.interaction?.map((int: any) => (
                        <Badge key={int.code} variant="secondary">
                          {int.code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Loading capabilities...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
              <CardDescription>
                Configure FHIR server settings and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={config.baseUrl}
                  onChange={(e) =>
                    setConfig({ ...config, baseUrl: e.target.value })
                  }
                  placeholder="http://localhost:3000/api/fhir"
                />
                <p className="text-xs text-gray-500">
                  The base URL for FHIR API endpoints
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label>SMART on FHIR</Label>
                      <p className="text-xs text-gray-500">
                        Enable OAuth2 authentication with SMART scopes
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.enableSmartOnFHIR}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, enableSmartOnFHIR: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label>Bulk Data Export</Label>
                      <p className="text-xs text-gray-500">
                        Enable $export operation for bulk data access
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.enableBulkData}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, enableBulkData: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label>CORS</Label>
                      <p className="text-xs text-gray-500">
                        Allow cross-origin requests
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config.enableCORS}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, enableCORS: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <Button className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Supported Resources</CardTitle>
              <CardDescription>
                FHIR resource types available on this server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {capabilities?.rest?.[0]?.resource?.map((resource: any) => (
                  <Card key={resource.type}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {resource.type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {resource.interaction?.slice(0, 4).map((int: any) => (
                            <Badge
                              key={int.code}
                              variant="secondary"
                              className="text-xs"
                            >
                              {int.code}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {resource.searchParam?.length || 0} search parameters
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>FHIR Operations</CardTitle>
              <CardDescription>
                Extended operations and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold">Bulk Data Export</h3>
                    <p className="text-sm text-gray-500">
                      Export large datasets using the $export operation
                    </p>
                  </div>
                </div>
                <Button onClick={initiateExport} disabled={loading}>
                  Start Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-semibold">Document Generation</h3>
                    <p className="text-sm text-gray-500">
                      Generate C-CDA/CCD documents
                    </p>
                  </div>
                </div>
                <Button variant="secondary">Generate CCD</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Code className="h-8 w-8 text-purple-500" />
                  <div>
                    <h3 className="font-semibold">Resource Validation</h3>
                    <p className="text-sm text-gray-500">
                      Validate FHIR resources against profiles
                    </p>
                  </div>
                </div>
                <Button variant="secondary">Validate</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Authentication and authorization settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold">SMART on FHIR</Label>
                <div className="mt-4 space-y-3">
                  <div>
                    <Label className="text-sm">Authorization Endpoint</Label>
                    <Input
                      value="/api/fhir/oauth/authorize"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Token Endpoint</Label>
                    <Input
                      value="/api/fhir/oauth/token"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Supported Scopes</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        "patient/*.read",
                        "patient/*.write",
                        "user/*.read",
                        "user/*.write",
                        "offline_access",
                      ].map((scope) => (
                        <Badge key={scope} variant="secondary">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold">API Keys</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Manage API keys for system-to-system integration
                </p>
                <Button variant="outline" className="mt-3">
                  Generate API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
