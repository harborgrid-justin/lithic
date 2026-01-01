"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function MFASetup() {
  const [mfaStatus, setMfaStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"status" | "setup" | "verify">("status");

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/mfa");
      const data = await response.json();

      if (data.success) {
        setMfaStatus(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch MFA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMFA = async () => {
    try {
      const response = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await response.json();

      if (data.success) {
        setQrCode(data.data.qrCode);
        setBackupCodes(data.data.backupCodes);
        setStep("setup");
      } else {
        toast.error(data.error || "Failed to generate MFA secret");
      }
    } catch (error) {
      toast.error("Failed to generate MFA secret");
    }
  };

  const enableMFA = async () => {
    if (!verificationCode) {
      toast.error("Please enter verification code");
      return;
    }

    try {
      const response = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code: verificationCode }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("MFA enabled successfully");
        setStep("status");
        fetchMFAStatus();
      } else {
        toast.error(data.error || "Invalid verification code");
      }
    } catch (error) {
      toast.error("Failed to enable MFA");
    }
  };

  const disableMFA = async () => {
    if (!confirm("Are you sure you want to disable MFA?")) return;

    try {
      const response = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("MFA disabled successfully");
        fetchMFAStatus();
      } else {
        toast.error(data.error || "Failed to disable MFA");
      }
    } catch (error) {
      toast.error("Failed to disable MFA");
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {step === "status" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Multi-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
              {mfaStatus?.enabled && (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mfaStatus?.enabled ? (
              <>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    MFA is currently enabled. You have{" "}
                    {mfaStatus.backupCodesRemaining} backup codes remaining.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={disableMFA}>
                    Disable MFA
                  </Button>
                  <Button variant="outline">Regenerate Backup Codes</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  MFA is not enabled. Enable it to protect your account with
                  TOTP authentication.
                </p>
                <Button onClick={generateMFA}>
                  <Shield className="h-4 w-4 mr-2" />
                  Enable MFA
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === "setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Set Up MFA</CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>

            <Alert>
              <AlertDescription>
                <strong>Backup Codes</strong>
                <p className="text-sm mt-2">
                  Save these codes in a safe place. You can use them to access
                  your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-gray-100 rounded">
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBackupCodes}
                  className="mt-3"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Codes
                </Button>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="code">Enter Verification Code</Label>
              <Input
                id="code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep("status")} variant="outline">
                Cancel
              </Button>
              <Button onClick={enableMFA}>Verify and Enable</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
