/**
 * SMART Apps Management Page
 * Admin interface for app registration, configuration, and usage analytics
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Key,
  BarChart3,
  Shield,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * Form Schema
 */
const appFormSchema = z.object({
  clientName: z.string().min(1, "App name is required"),
  description: z.string().min(1, "Description is required"),
  clientType: z.enum(["public", "confidential"]),
  applicationType: z.enum(["web", "native"]),
  redirectUris: z.string().min(1, "At least one redirect URI is required"),
  scope: z.string().min(1, "Scopes are required"),
  logoUri: z.string().url().optional().or(z.literal("")),
  launchUrl: z.string().url().optional().or(z.literal("")),
  fhirVersions: z.string().optional(),
});

type AppFormValues = z.infer<typeof appFormSchema>;

/**
 * Mock Data
 */
const mockApps = [
  {
    id: "app_1",
    clientId: "smart-app-001",
    clientName: "Diabetes Tracker",
    clientType: "public" as const,
    status: "active" as const,
    redirectUris: ["https://diabetes-tracker.example.com/callback"],
    scope: ["patient/Observation.read", "patient/MedicationRequest.read"],
    launchCount: 1234,
    lastLaunched: "2024-01-15T10:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "app_2",
    clientId: "smart-app-002",
    clientName: "Care Coordination Portal",
    clientType: "confidential" as const,
    status: "active" as const,
    redirectUris: ["https://care-portal.example.com/auth/callback"],
    scope: ["user/*.read", "user/*.write"],
    launchCount: 567,
    lastLaunched: "2024-01-14T15:45:00Z",
    createdAt: "2023-12-15T00:00:00Z",
  },
];

export default function SMARTAppsPage() {
  const [apps, setApps] = useState(mockApps);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<typeof mockApps[0] | null>(null);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const form = useForm<AppFormValues>({
    resolver: zodResolver(appFormSchema),
    defaultValues: {
      clientName: "",
      description: "",
      clientType: "public",
      applicationType: "web",
      redirectUris: "",
      scope: "",
      logoUri: "",
      launchUrl: "",
      fhirVersions: "4.0.1",
    },
  });

  const handleCreateApp = () => {
    setSelectedApp(null);
    form.reset();
    setShowDialog(true);
  };

  const handleEditApp = (app: typeof mockApps[0]) => {
    setSelectedApp(app);
    form.reset({
      clientName: app.clientName,
      description: "Description placeholder",
      clientType: app.clientType,
      applicationType: "web",
      redirectUris: app.redirectUris.join("\n"),
      scope: app.scope.join(" "),
      logoUri: "",
      launchUrl: "",
      fhirVersions: "4.0.1",
    });
    setShowDialog(true);
  };

  const handleDeleteApp = (appId: string) => {
    if (confirm("Are you sure you want to delete this app?")) {
      setApps(apps.filter((app) => app.id !== appId));
    }
  };

  const handleGenerateSecret = (app: typeof mockApps[0]) => {
    // Mock secret generation
    const mockSecret = "secret_" + Math.random().toString(36).substring(2, 15);
    setClientSecret(mockSecret);
    setSelectedApp(app);
    setShowSecretDialog(true);
  };

  const onSubmit = (values: AppFormValues) => {
    console.log("Form values:", values);
    // In production, submit to API
    setShowDialog(false);
    form.reset();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMART on FHIR Apps</h1>
          <p className="text-muted-foreground">
            Manage registered SMART on FHIR applications
          </p>
        </div>
        <Button onClick={handleCreateApp}>
          <Plus className="mr-2 h-4 w-4" />
          Register New App
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apps</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Apps</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apps.filter((app) => app.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Launches</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apps.reduce((sum, app) => sum + app.launchCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Apps</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apps.filter((app) => app.clientType === "public").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="apps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apps">Registered Apps</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Applications</CardTitle>
              <CardDescription>
                Manage SMART on FHIR application registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App Name</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Launches</TableHead>
                    <TableHead>Last Launch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.clientName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {app.clientId}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(app.clientId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{app.clientType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={app.status === "active" ? "default" : "secondary"}
                        >
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.launchCount.toLocaleString()}</TableCell>
                      <TableCell>
                        {new Date(app.lastLaunched).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {app.clientType === "confidential" && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleGenerateSecret(app)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditApp(app)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteApp(app.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                App launch statistics and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMART on FHIR Settings</CardTitle>
              <CardDescription>
                Configure SMART on FHIR authorization server settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings panel coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* App Registration Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedApp ? "Edit Application" : "Register New Application"}
            </DialogTitle>
            <DialogDescription>
              {selectedApp
                ? "Update application configuration"
                : "Register a new SMART on FHIR application"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My SMART App" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the application"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="confidential">Confidential</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Public for browser apps, Confidential for server apps
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applicationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="native">Native</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="redirectUris"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URIs</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="https://example.com/callback&#10;https://example.com/auth"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>One URI per line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scopes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="patient/*.read patient/Observation.write"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Space-separated scopes</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="launchUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Launch URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/launch"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedApp ? "Update" : "Register"} App
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Client Secret Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Secret Generated</DialogTitle>
            <DialogDescription>
              Save this secret securely. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <code className="text-sm break-all">{clientSecret}</code>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => clientSecret && copyToClipboard(clientSecret)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSecretDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
