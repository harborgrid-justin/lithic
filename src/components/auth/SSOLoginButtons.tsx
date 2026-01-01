"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SSOProvider {
  id: string;
  name: string;
  type: "SAML" | "OIDC";
  enabled: boolean;
  icon?: string;
}

interface SSOLoginButtonsProps {
  providers?: SSOProvider[];
  className?: string;
}

export function SSOLoginButtons({
  providers = [],
  className,
}: SSOLoginButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSSOLogin = async (provider: SSOProvider) => {
    try {
      setLoading(provider.id);

      // Determine which API to call based on provider type
      const endpoint =
        provider.type === "SAML" ? "/api/auth/sso/saml" : "/api/auth/sso/oidc";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: provider.id,
          action: "initiate",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initiate SSO");
      }

      const data = await response.json();

      // Redirect to SSO provider
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "SSO login failed");
      setLoading(null);
    }
  };

  if (providers.length === 0) {
    return null;
  }

  const enabledProviders = providers.filter((p) => p.enabled);

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {enabledProviders.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSSOLogin(provider)}
            disabled={loading !== null}
          >
            {loading === provider.id ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                {provider.icon && (
                  <img
                    src={provider.icon}
                    alt={provider.name}
                    className="mr-2 h-4 w-4"
                  />
                )}
                Continue with {provider.name}
              </>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Default SSO providers configuration
export const defaultSSOProviders: SSOProvider[] = [
  {
    id: "okta",
    name: "Okta",
    type: "SAML",
    enabled: false,
  },
  {
    id: "azure-ad",
    name: "Microsoft Azure AD",
    type: "OIDC",
    enabled: false,
  },
  {
    id: "google-workspace",
    name: "Google Workspace",
    type: "OIDC",
    enabled: false,
  },
  {
    id: "onelogin",
    name: "OneLogin",
    type: "SAML",
    enabled: false,
  },
];
