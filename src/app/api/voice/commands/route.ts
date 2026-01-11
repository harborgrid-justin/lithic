/**
 * Voice Commands API
 * Command processing and execution endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit-logger";
import { getCommandProcessor, VOICE_COMMANDS } from "@/lib/voice/command-processor";
import {
  VoiceCommand,
  VoiceCommandCategory,
  VoiceCommandContext,
} from "@/types/voice";

// ============================================================================
// Types
// ============================================================================

interface ProcessCommandRequest {
  input: string;
  context?: VoiceCommandContext;
  autoExecute?: boolean;
}

interface AddCommandRequest {
  command: VoiceCommand;
}

// ============================================================================
// POST /api/voice/commands/process
// Process voice command
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const body: ProcessCommandRequest = await request.json();
    const { input, context = VoiceCommandContext.GLOBAL, autoExecute = false } = body;

    if (!input) {
      return NextResponse.json({ error: "Input required" }, { status: 400 });
    }

    // Get command processor
    const processor = getCommandProcessor();
    processor.setContext(context);

    // Process command
    const match = processor.process(input, session.user.id);

    if (!match) {
      // Audit log - no match
      await logAuditEvent({
        userId: session.user.id,
        action: "VOICE_COMMAND_NO_MATCH",
        resource: "voice/commands",
        details: { input, context },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });

      return NextResponse.json({
        success: false,
        message: `No command found for: "${input}"`,
      });
    }

    // Auto-execute if requested and allowed
    let result = null;
    if (autoExecute && !match.command.requiresConfirmation) {
      result = await processor.execute(match, session.user.id);
    }

    // Audit log - command matched
    await logAuditEvent({
      userId: session.user.id,
      action: "VOICE_COMMAND_PROCESSED",
      resource: "voice/commands",
      details: {
        input,
        commandId: match.command.id,
        commandName: match.command.command,
        confidence: match.confidence,
        autoExecute,
        executed: !!result,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      match,
      result,
    });
  } catch (error) {
    console.error("Command processing error:", error);
    return NextResponse.json(
      {
        error: "Command processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/voice/commands
// Get available commands
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const context = url.searchParams.get("context") as VoiceCommandContext | null;
    const category = url.searchParams.get("category") as VoiceCommandCategory | null;

    const processor = getCommandProcessor();

    let commands: VoiceCommand[] = VOICE_COMMANDS;

    // Filter by context
    if (context) {
      processor.setContext(context);
      commands = processor.getAvailableCommands();
    }

    // Filter by category
    if (category) {
      commands = processor.getCommandsByCategory(category);
    }

    return NextResponse.json({
      commands,
      count: commands.length,
      context: context || VoiceCommandContext.GLOBAL,
    });
  } catch (error) {
    console.error("Get commands error:", error);
    return NextResponse.json(
      {
        error: "Failed to get commands",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/voice/commands
// Add custom command
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions (would verify admin/custom command permissions)
    // For now, allow all authenticated users

    // Parse request
    const body: AddCommandRequest = await request.json();
    const { command } = body;

    if (!command || !command.id || !command.command || !command.pattern) {
      return NextResponse.json(
        { error: "Invalid command structure" },
        { status: 400 }
      );
    }

    // Add command to processor
    const processor = getCommandProcessor();
    processor.addCommand(command);

    // Audit log
    await logAuditEvent({
      userId: session.user.id,
      action: "VOICE_COMMAND_ADDED",
      resource: "voice/commands",
      details: {
        commandId: command.id,
        commandName: command.command,
        category: command.category,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Command added successfully",
      command,
    });
  } catch (error) {
    console.error("Add command error:", error);
    return NextResponse.json(
      {
        error: "Failed to add command",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/voice/commands/:id
// Remove custom command
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get command ID
    const url = new URL(request.url);
    const commandId = url.searchParams.get("id");

    if (!commandId) {
      return NextResponse.json({ error: "Command ID required" }, { status: 400 });
    }

    // Remove command
    const processor = getCommandProcessor();
    processor.removeCommand(commandId);

    // Audit log
    await logAuditEvent({
      userId: session.user.id,
      action: "VOICE_COMMAND_REMOVED",
      resource: "voice/commands",
      details: { commandId },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Command removed successfully",
    });
  } catch (error) {
    console.error("Remove command error:", error);
    return NextResponse.json(
      {
        error: "Failed to remove command",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate command structure
 */
function isValidCommand(command: any): command is VoiceCommand {
  return (
    typeof command === "object" &&
    typeof command.id === "string" &&
    typeof command.command === "string" &&
    (typeof command.pattern === "string" || command.pattern instanceof RegExp) &&
    typeof command.category === "string" &&
    typeof command.action === "string" &&
    typeof command.requiresConfirmation === "boolean" &&
    typeof command.description === "string" &&
    Array.isArray(command.examples)
  );
}

/**
 * Sanitize command for client
 */
function sanitizeCommand(command: VoiceCommand): VoiceCommand {
  return {
    ...command,
    // Remove sensitive data if any
    permissions: command.permissions || [],
  };
}
