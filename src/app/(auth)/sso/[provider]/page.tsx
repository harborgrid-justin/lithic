"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SSOPageProps {
  params: {
    provider: string;
  };
}

export default function SSOCallbackPage({ params }: SSOPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleSAMLCallback = async (
      samlResponse: string,
      state: string | null,
    ) => {
      const response = await fetch("/api/auth/sso/saml", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: params.provider,
          SAMLResponse: samlResponse,
          RelayState: state,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "SAML authentication failed");
      }

      const data = await response.json();

      setStatus("success");
      setMessage("Authentication successful. Redirecting...");

      // Redirect after brief delay
      setTimeout(() => {
        router.push(data.redirectUrl || "/dashboard");
      }, 1500);
    };

    const handleOIDCCallback = async (code: string, state: string | null) => {
      const response = await fetch("/api/auth/sso/oidc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: params.provider,
          code,
          state,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "OIDC authentication failed");
      }

      const data = await response.json();

      setStatus("success");
      setMessage("Authentication successful. Redirecting...");

      // Redirect after brief delay
      setTimeout(() => {
        router.push(data.redirectUrl || "/dashboard");
      }, 1500);
    };

    const handleSSOCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const samlResponse = searchParams.get("SAMLResponse");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Handle OAuth/OIDC error
        if (error) {
          setStatus("error");
          setMessage(errorDescription || `SSO error: ${error}`);
          return;
        }

        // Determine which flow to use
        if (samlResponse) {
          // SAML flow
          await handleSAMLCallback(samlResponse, state);
        } else if (code) {
          // OIDC/OAuth flow
          await handleOIDCCallback(code, state);
        } else {
          setStatus("error");
          setMessage("Invalid SSO callback: missing required parameters");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "SSO authentication failed",
        );
      }
    };

    handleSSOCallback();
  }, [searchParams, params.provider, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SSO Authentication</CardTitle>
          <CardDescription>
            {status === "processing" && "Processing your authentication..."}
            {status === "success" && "Authentication successful"}
            {status === "error" && "Authentication failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "processing" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">
                Verifying your credentials...
              </p>
            </div>
          )}

          {status === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-primary hover:underline"
              >
                Return to login
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
