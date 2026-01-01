"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Settings,
  Shield,
  CheckCircle2,
  XCircle,
  Download,
} from "lucide-react";

interface SSOProvider {
  id: string;
  providerId: string;
  providerName: string;
  provider: "SAML" | "OIDC";
  enabled: boolean;
  configuration: any;
  createdAt: string;
  updatedAt: string;
}

export default function SSOAdminPage() {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("providers");

  // SAML form state
  const [samlForm, setSamlForm] = useState({
    providerId: "",
    providerName: "",
    entityId: "",
    ssoUrl: "",
    sloUrl: "",
    certificate: "",
    nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    wantAssertionsSigned: true,
    enabled: true,
  });

  // OIDC form state
  const [oidcForm, setOidcForm] = useState({
    providerId: "",
    providerName: "",
    issuer: "",
    clientId: "",
    clientSecret: "",
    scopes: "openid email profile",
    pkceEnabled: true,
    enabled: true,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/admin/sso/providers");
      if (!response.ok) throw new Error("Failed to fetch providers");
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      toast.error("Failed to load SSO providers");
    } finally {
      setLoading(false);
    }
  };

  const saveSAMLProvider = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/sso/saml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(samlForm),
      });

      if (!response.ok) throw new Error("Failed to save SAML provider");

      toast.success("SAML provider saved successfully");
      fetchProviders();
      resetSAMLForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save provider",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveOIDCProvider = async () => {
    try {
      setSaving(true);

      // Auto-discover OIDC configuration if issuer is provided
      let config = { ...oidcForm };

      if (oidcForm.issuer && !oidcForm.authorizationEndpoint) {
        const discoveryResponse = await fetch("/api/admin/sso/oidc/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issuer: oidcForm.issuer }),
        });

        if (discoveryResponse.ok) {
          const discovered = await discoveryResponse.json();
          config = { ...config, ...discovered };
        }
      }

      const response = await fetch("/api/admin/sso/oidc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Failed to save OIDC provider");

      toast.success("OIDC provider saved successfully");
      fetchProviders();
      resetOIDCForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save provider",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = async (providerId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/sso/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) throw new Error("Failed to update provider");

      toast.success(`Provider ${enabled ? "enabled" : "disabled"}`);
      fetchProviders();
    } catch (error) {
      toast.error("Failed to update provider");
    }
  };

  const deleteProvider = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this SSO provider?")) return;

    try {
      const response = await fetch(`/api/admin/sso/providers/${providerId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete provider");

      toast.success("Provider deleted successfully");
      fetchProviders();
    } catch (error) {
      toast.error("Failed to delete provider");
    }
  };

  const downloadMetadata = async () => {
    try {
      const response = await fetch("/api/auth/sso/saml?action=metadata");
      if (!response.ok) throw new Error("Failed to generate metadata");

      const metadata = await response.text();
      const blob = new Blob([metadata], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sp-metadata.xml";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download metadata");
    }
  };

  const resetSAMLForm = () => {
    setSamlForm({
      providerId: "",
      providerName: "",
      entityId: "",
      ssoUrl: "",
      sloUrl: "",
      certificate: "",
      nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      wantAssertionsSigned: true,
      enabled: true,
    });
  };

  const resetOIDCForm = () => {
    setOidcForm({
      providerId: "",
      providerName: "",
      issuer: "",
      clientId: "",
      clientSecret: "",
      scopes: "openid email profile",
      pkceEnabled: true,
      enabled: true,
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SSO Configuration</h1>
          <p className="text-muted-foreground">
            Manage Single Sign-On providers for your organization
          </p>
        </div>
        <Button variant="outline" onClick={downloadMetadata}>
          <Download className="mr-2 h-4 w-4" />
          Download SP Metadata
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="saml">Add SAML</TabsTrigger>
          <TabsTrigger value="oidc">Add OIDC</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {providers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-semibold">
                  No SSO providers configured
                </p>
                <p className="text-sm text-muted-foreground">
                  Add a SAML or OIDC provider to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {providers.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {provider.providerName}
                          <Badge
                            variant={
                              provider.provider === "SAML"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {provider.provider}
                          </Badge>
                          {provider.enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          ID: {provider.providerId}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(checked) =>
                            toggleProvider(provider.id, checked)
                          }
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteProvider(provider.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Created:</span>{" "}
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-semibold">Last Updated:</span>{" "}
                        {new Date(provider.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add SAML 2.0 Provider</CardTitle>
              <CardDescription>
                Configure a SAML 2.0 identity provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="saml-id">Provider ID</Label>
                  <Input
                    id="saml-id"
                    value={samlForm.providerId}
                    onChange={(e) =>
                      setSamlForm({ ...samlForm, providerId: e.target.value })
                    }
                    placeholder="okta"
                  />
                </div>

                <div>
                  <Label htmlFor="saml-name">Provider Name</Label>
                  <Input
                    id="saml-name"
                    value={samlForm.providerName}
                    onChange={(e) =>
                      setSamlForm({ ...samlForm, providerName: e.target.value })
                    }
                    placeholder="Okta"
                  />
                </div>

                <div>
                  <Label htmlFor="saml-entity">Entity ID</Label>
                  <Input
                    id="saml-entity"
                    value={samlForm.entityId}
                    onChange={(e) =>
                      setSamlForm({ ...samlForm, entityId: e.target.value })
                    }
                    placeholder="https://idp.example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="saml-sso">SSO URL</Label>
                  <Input
                    id="saml-sso"
                    value={samlForm.ssoUrl}
                    onChange={(e) =>
                      setSamlForm({ ...samlForm, ssoUrl: e.target.value })
                    }
                    placeholder="https://idp.example.com/sso/saml"
                  />
                </div>

                <div>
                  <Label htmlFor="saml-slo">SLO URL (Optional)</Label>
                  <Input
                    id="saml-slo"
                    value={samlForm.sloUrl}
                    onChange={(e) =>
                      setSamlForm({ ...samlForm, sloUrl: e.target.value })
                    }
                    placeholder="https://idp.example.com/slo/saml"
                  />
                </div>

                <div>
                  <Label htmlFor="saml-nameid">Name ID Format</Label>
                  <Select
                    value={samlForm.nameIdFormat}
                    onValueChange={(value) =>
                      setSamlForm({ ...samlForm, nameIdFormat: value })
                    }
                  >
                    <SelectTrigger id="saml-nameid">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
                        Email Address
                      </SelectItem>
                      <SelectItem value="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">
                        Unspecified
                      </SelectItem>
                      <SelectItem value="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">
                        Persistent
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="saml-cert">X.509 Certificate</Label>
                <Textarea
                  id="saml-cert"
                  value={samlForm.certificate}
                  onChange={(e) =>
                    setSamlForm({ ...samlForm, certificate: e.target.value })
                  }
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="saml-signed"
                  checked={samlForm.wantAssertionsSigned}
                  onCheckedChange={(checked) =>
                    setSamlForm({ ...samlForm, wantAssertionsSigned: checked })
                  }
                />
                <Label htmlFor="saml-signed">Require signed assertions</Label>
              </div>

              <Button
                onClick={saveSAMLProvider}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add SAML Provider
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oidc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add OIDC/OAuth 2.0 Provider</CardTitle>
              <CardDescription>
                Configure an OpenID Connect or OAuth 2.0 identity provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="oidc-id">Provider ID</Label>
                  <Input
                    id="oidc-id"
                    value={oidcForm.providerId}
                    onChange={(e) =>
                      setOidcForm({ ...oidcForm, providerId: e.target.value })
                    }
                    placeholder="google"
                  />
                </div>

                <div>
                  <Label htmlFor="oidc-name">Provider Name</Label>
                  <Input
                    id="oidc-name"
                    value={oidcForm.providerName}
                    onChange={(e) =>
                      setOidcForm({ ...oidcForm, providerName: e.target.value })
                    }
                    placeholder="Google Workspace"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="oidc-issuer">Issuer URL</Label>
                  <Input
                    id="oidc-issuer"
                    value={oidcForm.issuer}
                    onChange={(e) =>
                      setOidcForm({ ...oidcForm, issuer: e.target.value })
                    }
                    placeholder="https://accounts.google.com"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Configuration will be auto-discovered from
                    /.well-known/openid-configuration
                  </p>
                </div>

                <div>
                  <Label htmlFor="oidc-client">Client ID</Label>
                  <Input
                    id="oidc-client"
                    value={oidcForm.clientId}
                    onChange={(e) =>
                      setOidcForm({ ...oidcForm, clientId: e.target.value })
                    }
                    placeholder="your-client-id"
                  />
                </div>

                <div>
                  <Label htmlFor="oidc-secret">Client Secret</Label>
                  <Input
                    id="oidc-secret"
                    type="password"
                    value={oidcForm.clientSecret}
                    onChange={(e) =>
                      setOidcForm({ ...oidcForm, clientSecret: e.target.value })
                    }
                    placeholder="your-client-secret"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="oidc-scopes">Scopes</Label>
                  <Input
                    id="oidc-scopes"
                    value={oidcForm.scopes}
                    onChange={(e) =>
                      setOidcForm({ ...oidcForm, scopes: e.target.value })
                    }
                    placeholder="openid email profile"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="oidc-pkce"
                  checked={oidcForm.pkceEnabled}
                  onCheckedChange={(checked) =>
                    setOidcForm({ ...oidcForm, pkceEnabled: checked })
                  }
                />
                <Label htmlFor="oidc-pkce">Enable PKCE (recommended)</Label>
              </div>

              <Button
                onClick={saveOIDCProvider}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add OIDC Provider
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
