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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Smartphone, QrCode, Copy, CheckCircle2, Loader2 } from "lucide-react";

interface MFASetupProps {
  userId: string;
  onComplete?: () => void;
}

export function MFASetup({ userId, onComplete }: MFASetupProps) {
  const [step, setStep] = useState<
    "choose" | "totp-setup" | "sms-setup" | "verify"
  >("choose");
  const [method, setMethod] = useState<"totp" | "sms">("totp");
  const [loading, setLoading] = useState(false);

  // TOTP state
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceName, setDeviceName] = useState("My Device");

  // SMS state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");

  // Verification
  const [verificationCode, setVerificationCode] = useState("");

  const handleChooseMethod = (selectedMethod: "totp" | "sms") => {
    setMethod(selectedMethod);
    if (selectedMethod === "totp") {
      setStep("totp-setup");
      setupTOTP();
    } else {
      setStep("sms-setup");
    }
  };

  const setupTOTP = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/mfa/totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, deviceName }),
      });

      if (!response.ok) throw new Error("Failed to setup TOTP");

      const data = await response.json();
      setTotpSecret(data.secret);
      setQrCodeUrl(data.qrCodeDataUrl);
      setBackupCodes(data.backupCodes);
      setDeviceId(data.deviceId);
      setStep("verify");
    } catch (error) {
      toast.error("Failed to setup authenticator app");
    } finally {
      setLoading(false);
    }
  };

  const sendSMSCode = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/mfa/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phoneNumber }),
      });

      if (!response.ok) throw new Error("Failed to send SMS");

      const data = await response.json();
      setVerificationId(data.verificationId);
      setStep("verify");
      toast.success("Verification code sent to your phone");
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    try {
      setLoading(true);

      if (method === "totp") {
        const response = await fetch("/api/auth/mfa/totp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, deviceId, code: verificationCode }),
        });

        if (!response.ok) throw new Error("Invalid verification code");

        toast.success("Authenticator app enabled successfully");
      } else {
        const response = await fetch("/api/auth/mfa/sms/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            verificationId,
            code: verificationCode,
          }),
        });

        if (!response.ok) throw new Error("Invalid verification code");

        toast.success("SMS authentication enabled successfully");
      }

      onComplete?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (step === "choose") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enable Multi-Factor Authentication</CardTitle>
          <CardDescription>
            Choose your preferred authentication method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="h-auto w-full justify-start p-4"
            onClick={() => handleChooseMethod("totp")}
          >
            <QrCode className="mr-3 h-8 w-8" />
            <div className="text-left">
              <div className="font-semibold">Authenticator App</div>
              <div className="text-sm text-muted-foreground">
                Use Google Authenticator, Authy, or similar app
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto w-full justify-start p-4"
            onClick={() => handleChooseMethod("sms")}
          >
            <Smartphone className="mr-3 h-8 w-8" />
            <div className="text-left">
              <div className="font-semibold">SMS Authentication</div>
              <div className="text-sm text-muted-foreground">
                Receive verification codes via text message
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (
    step === "totp-setup" ||
    (step === "verify" && method === "totp" && !verificationCode)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Authenticator App</CardTitle>
          <CardDescription>
            Scan this QR code with your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="rounded-lg border"
                  />
                )}
              </div>

              <div>
                <Label>Or enter this key manually:</Label>
                <div className="mt-2 flex gap-2">
                  <Input value={totpSecret} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(totpSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="My iPhone"
                  className="mt-2"
                />
              </div>

              {backupCodes.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      Save these backup codes:
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, i) => (
                        <div key={i}>{code}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "sms-setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up SMS Authentication</CardTitle>
          <CardDescription>
            Enter your phone number to receive verification codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="mt-2"
            />
          </div>

          <Button
            onClick={sendSMSCode}
            disabled={loading || !phoneNumber}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Verification Code"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Verify {method === "totp" ? "Authenticator" : "SMS"} Code
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code from your{" "}
            {method === "totp" ? "authenticator app" : "phone"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              placeholder="000000"
              className="mt-2 text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          <Button
            onClick={verifyAndEnable}
            disabled={loading || verificationCode.length !== 6}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verify and Enable
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
