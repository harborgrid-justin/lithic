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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";

interface MFAVerifyProps {
  userId: string;
  method?: "totp" | "sms" | "auto";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MFAVerify({
  userId,
  method = "auto",
  onSuccess,
  onCancel,
}: MFAVerifyProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [usingBackupCode, setUsingBackupCode] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const sendSMS = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/mfa/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, purpose: "verification" }),
      });

      if (!response.ok) throw new Error("Failed to send SMS");

      setSmsSent(true);
      toast.success("Verification code sent");
    } catch (error) {
      toast.error("Failed to send SMS code");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    try {
      setLoading(true);

      // Try TOTP first if method is auto or totp
      if (method === "auto" || method === "totp") {
        const totpResponse = await fetch("/api/auth/mfa/totp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, code }),
        });

        if (totpResponse.ok) {
          toast.success("Authentication successful");
          onSuccess?.();
          return;
        }
      }

      // Try SMS if method is auto or sms
      if (method === "auto" || method === "sms") {
        const smsResponse = await fetch("/api/auth/mfa/sms/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, code }),
        });

        if (smsResponse.ok) {
          toast.success("Authentication successful");
          onSuccess?.();
          return;
        }
      }

      throw new Error("Invalid verification code");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyBackupCode = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/auth/mfa/backup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          code: code.toUpperCase().replace(/\s/g, ""),
        }),
      });

      if (!response.ok) throw new Error("Invalid backup code");

      const data = await response.json();
      toast.success(
        `Backup code accepted. ${data.remainingCodes} codes remaining.`,
      );
      onSuccess?.();
    } catch (error) {
      toast.error("Invalid backup code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usingBackupCode) {
      verifyBackupCode();
    } else {
      verifyCode();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {usingBackupCode
            ? "Enter one of your backup codes"
            : "Enter your verification code to continue"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">
              {usingBackupCode ? "Backup Code" : "Verification Code"}
            </Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) =>
                setCode(
                  usingBackupCode
                    ? e.target.value.toUpperCase()
                    : e.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              placeholder={usingBackupCode ? "XXXX-XXXX" : "000000"}
              className="mt-2 text-center text-2xl tracking-widest"
              maxLength={usingBackupCode ? 9 : 6}
              autoFocus
            />
          </div>

          {method === "sms" && !smsSent && !usingBackupCode && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Send verification code to your phone</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sendSMS}
                    disabled={loading}
                  >
                    Send SMS
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length < (usingBackupCode ? 8 : 6)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <div className="space-y-2 text-center text-sm">
            {!usingBackupCode && (
              <button
                type="button"
                onClick={() => setUsingBackupCode(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Use a backup code instead
              </button>
            )}

            {usingBackupCode && (
              <button
                type="button"
                onClick={() => setUsingBackupCode(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Use verification code instead
              </button>
            )}

            {onCancel && (
              <div>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
