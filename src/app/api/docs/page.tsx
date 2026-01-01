"use client";

/**
 * API Documentation Page
 * Interactive Swagger UI for API documentation
 */

import { useEffect, useRef } from "react";
import { openApiSpec } from "@/lib/openapi/spec";

export default function APIDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import Swagger UI
    const loadSwaggerUI = async () => {
      // @ts-ignore
      if (typeof window !== "undefined" && window.SwaggerUIBundle) {
        // @ts-ignore
        window.SwaggerUIBundle({
          spec: openApiSpec,
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            // @ts-ignore
            window.SwaggerUIBundle.presets.apis,
            // @ts-ignore
            window.SwaggerUIStandalonePreset,
          ],
          plugins: [
            // @ts-ignore
            window.SwaggerUIBundle.plugins.DownloadUrl,
          ],
          layout: "StandaloneLayout",
        });
      }
    };

    // Load Swagger UI CSS and JS
    const loadResources = () => {
      // Load CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css";
      document.head.appendChild(link);

      // Load JS
      const script1 = document.createElement("script");
      script1.src =
        "https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js";
      script1.onload = () => {
        const script2 = document.createElement("script");
        script2.src =
          "https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js";
        script2.onload = () => loadSwaggerUI();
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
    };

    loadResources();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">
            Lithic Healthcare API Documentation
          </h1>
          <p className="mt-2 text-muted-foreground">
            Complete REST API, FHIR R4, and HL7 v2 integration documentation
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-4 flex-wrap">
            <a
              href="#tag/Patients"
              className="text-sm text-primary hover:underline"
            >
              Patient API
            </a>
            <a
              href="#tag/FHIR"
              className="text-sm text-primary hover:underline"
            >
              FHIR R4 API
            </a>
            <a href="#tag/HL7" className="text-sm text-primary hover:underline">
              HL7 v2 API
            </a>
            <a
              href="#tag/Webhooks"
              className="text-sm text-primary hover:underline"
            >
              Webhooks
            </a>
            <a
              href="#tag/Laboratory"
              className="text-sm text-primary hover:underline"
            >
              Laboratory
            </a>
            <a
              href="#tag/Pharmacy"
              className="text-sm text-primary hover:underline"
            >
              Pharmacy
            </a>
            <a
              href="#tag/Billing"
              className="text-sm text-primary hover:underline"
            >
              Billing
            </a>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Use Bearer tokens or API keys for authentication. Include in
              Authorization header.
            </p>
            <code className="text-xs mt-2 block bg-muted p-2 rounded">
              Authorization: Bearer YOUR_TOKEN
            </code>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Rate Limits</h3>
            <p className="text-sm text-muted-foreground">
              100 requests per minute for standard tier. Enterprise plans have
              higher limits.
            </p>
            <ul className="text-xs mt-2 space-y-1">
              <li>• Standard: 100 req/min</li>
              <li>• Professional: 500 req/min</li>
              <li>• Enterprise: Custom limits</li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">API Versions</h3>
            <p className="text-sm text-muted-foreground">
              Current version: v1. FHIR R4 compliant. HL7 v2.5 support.
            </p>
            <ul className="text-xs mt-2 space-y-1">
              <li>• REST API: v1</li>
              <li>• FHIR: R4 (4.0.1)</li>
              <li>• HL7: v2.5.1</li>
            </ul>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Quick Start Examples</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">Create Patient (FHIR)</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {`POST /api/fhir/Patient
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "name": [{
    "family": "Smith",
    "given": ["John"]
  }],
  "birthDate": "1990-01-01",
  "gender": "male"
}`}
              </pre>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">Register Webhook</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {`POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["patient.created", "appointment.scheduled"],
  "secret": "your-webhook-secret"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="container mx-auto px-4 pb-8">
        <div id="swagger-ui" ref={containerRef} />
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/20 mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="text-sm text-muted-foreground">
            <p>
              For support, contact{" "}
              <a
                href="mailto:support@lithic.health"
                className="text-primary hover:underline"
              >
                support@lithic.health
              </a>
            </p>
            <p className="mt-2">
              View our{" "}
              <a href="/docs/guides" className="text-primary hover:underline">
                integration guides
              </a>{" "}
              and{" "}
              <a
                href="/docs/changelog"
                className="text-primary hover:underline"
              >
                changelog
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
