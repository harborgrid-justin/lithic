/**
 * MFA Setup Component
 * Configure multi-factor authentication
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Mail, Key } from "lucide-react";

export function MFASetup() {
  const [method, setMethod] = useState<"TOTP" | "SMS" | "EMAIL">("TOTP");
  const [qrCode, setQrCode] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={method === "TOTP" ? "default" : "outline"}
            onClick={() => setMethod("TOTP")}
          >
            <Key className="mr-2 h-4 w-4" />
            Authenticator App
          </Button>
          <Button
            variant={method === "SMS" ? "default" : "outline"}
            onClick={() => setMethod("SMS")}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            SMS
          </Button>
          <Button
            variant={method === "EMAIL" ? "default" : "outline"}
            onClick={() => setMethod("EMAIL")}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
        </div>

        {method === "TOTP" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              {/* QR Code would be displayed here */}
              <div className="w-48 h-48 bg-muted flex items-center justify-center">
                QR Code
              </div>
            </div>
            <Input
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <Button className="w-full">Verify and Enable</Button>
          </div>
        )}

        {method === "SMS" && (
          <div className="space-y-4">
            <Input placeholder="Enter phone number" />
            <Button className="w-full">Send Verification Code</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
