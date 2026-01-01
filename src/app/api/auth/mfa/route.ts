import { NextRequest, NextResponse } from "next/server";
import { authOptions, getServerSession } from "@/lib/auth";
import {
  generateMFASecret,
  enableMFA,
  disableMFA,
  verifyTOTP,
  regenerateBackupCodes,
  getMFAStatus,
} from "@/lib/mfa";
import { z } from "zod";

// GET /api/auth/mfa - Get MFA status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const status = await getMFAStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get MFA status";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// POST /api/auth/mfa - Enable/disable/verify MFA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, code } = body;

    switch (action) {
      case "generate":
        const secret = await generateMFASecret(session.user.id);
        return NextResponse.json({
          success: true,
          data: secret,
        });

      case "enable":
        if (!code) {
          return NextResponse.json(
            { success: false, error: "Verification code required" },
            { status: 400 },
          );
        }
        await enableMFA(session.user.id, code);
        return NextResponse.json({
          success: true,
          message: "MFA enabled successfully",
        });

      case "disable":
        await disableMFA(session.user.id, code);
        return NextResponse.json({
          success: true,
          message: "MFA disabled successfully",
        });

      case "verify":
        if (!code) {
          return NextResponse.json(
            { success: false, error: "Verification code required" },
            { status: 400 },
          );
        }
        const isValid = await verifyTOTP(session.user.id, code);
        return NextResponse.json({
          success: true,
          valid: isValid,
        });

      case "regenerate-backup-codes":
        if (!code) {
          return NextResponse.json(
            { success: false, error: "Verification code required" },
            { status: 400 },
          );
        }
        const backupCodes = await regenerateBackupCodes(session.user.id, code);
        return NextResponse.json({
          success: true,
          data: { backupCodes },
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MFA operation failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
