"use client";

/**
 * Voice Commands Hook
 * React hook for voice command processing and execution
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCommandProcessor } from "@/lib/voice/command-processor";
import { useVoiceRecognition } from "./useVoiceRecognition";
import {
  VoiceCommand,
  VoiceCommandMatch,
  VoiceCommandResult,
  VoiceCommandContext,
  VoiceCommandExecution,
} from "@/types/voice";
import { useAuth } from "./useAuth";

interface UseVoiceCommandsOptions {
  context?: VoiceCommandContext;
  autoExecute?: boolean;
  confirmationRequired?: boolean;
  onCommandMatch?: (match: VoiceCommandMatch) => void;
  onCommandExecute?: (execution: VoiceCommandExecution) => void;
  onCommandResult?: (result: VoiceCommandResult) => void;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}) {
  const {
    context = VoiceCommandContext.GLOBAL,
    autoExecute = true,
    confirmationRequired = false,
  } = options;

  const [currentMatch, setCurrentMatch] = useState<VoiceCommandMatch | null>(
    null
  );
  const [pendingCommand, setPendingCommand] = useState<VoiceCommandMatch | null>(
    null
  );
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [availableCommands, setAvailableCommands] = useState<VoiceCommand[]>(
    []
  );

  const router = useRouter();
  const { user } = useAuth();
  const commandProcessor = useRef(getCommandProcessor());

  // Initialize command processor
  useEffect(() => {
    const processor = commandProcessor.current;

    // Set context
    processor.setContext(context);

    // Update available commands
    setAvailableCommands(processor.getAvailableCommands());

    // Setup event listeners
    processor.on("match", (match: VoiceCommandMatch) => {
      setCurrentMatch(match);
      options.onCommandMatch?.(match);

      // Auto-execute or require confirmation
      if (autoExecute && !match.command.requiresConfirmation && !confirmationRequired) {
        executeCommand(match);
      } else {
        setPendingCommand(match);
      }
    });

    processor.on("nomatch", (input: string) => {
      setLastResult({
        success: false,
        message: `No command found for: "${input}"`,
      });
    });

    processor.on("action", (data: any) => {
      handleAction(data);
    });

    processor.on("afterexecute", (execution: VoiceCommandExecution) => {
      options.onCommandExecute?.(execution);
    });

    return () => {
      processor.reset();
    };
  }, [context, autoExecute, confirmationRequired]);

  // Voice recognition for command input
  const {
    start: startListening,
    stop: stopListening,
    isListening,
    status,
    transcript,
  } = useVoiceRecognition({
    continuous: false,
    interimResults: false,
    onFinalResult: (result) => {
      if (result.transcript && user) {
        processCommand(result.transcript);
      }
    },
  });

  // Process voice command
  const processCommand = useCallback(
    (input: string) => {
      if (!user) return;

      const match = commandProcessor.current.process(input, user.id);
      if (match) {
        setCurrentMatch(match);
      }
    },
    [user]
  );

  // Execute command
  const executeCommand = useCallback(
    async (match: VoiceCommandMatch) => {
      if (!user) return;

      const result = await commandProcessor.current.execute(match, user.id);
      setLastResult(result);
      setPendingCommand(null);
      options.onCommandResult?.(result);
    },
    [user, options]
  );

  // Confirm pending command
  const confirmCommand = useCallback(() => {
    if (pendingCommand) {
      executeCommand(pendingCommand);
    }
  }, [pendingCommand, executeCommand]);

  // Cancel pending command
  const cancelCommand = useCallback(() => {
    setPendingCommand(null);
    setCurrentMatch(null);
  }, []);

  // Handle command actions
  const handleAction = useCallback(
    (data: { action: string; command: VoiceCommand; parameters: any; resolve: Function }) => {
      const { action, parameters, resolve } = data;

      let result: VoiceCommandResult = {
        success: false,
        message: `Action not implemented: ${action}`,
      };

      switch (action) {
        case "navigate":
          if (parameters.route) {
            router.push(parameters.route);
            result = {
              success: true,
              message: `Navigating to ${parameters.route}`,
            };
          }
          break;

        case "searchPatient":
          if (parameters.param3) {
            router.push(`/patients?search=${encodeURIComponent(parameters.param3)}`);
            result = {
              success: true,
              message: `Searching for patient: ${parameters.param3}`,
            };
          }
          break;

        case "searchPatientByMRN":
          if (parameters.param3) {
            router.push(`/patients?mrn=${encodeURIComponent(parameters.param3)}`);
            result = {
              success: true,
              message: `Searching for MRN: ${parameters.param3}`,
            };
          }
          break;

        case "startNote":
          router.push("/encounters/new?action=note");
          result = {
            success: true,
            message: "Starting new note",
          };
          break;

        case "saveNote":
          result = {
            success: true,
            message: "Note saved",
            requiresConfirmation: true,
          };
          break;

        case "signNote":
          result = {
            success: true,
            message: "Note signed",
            requiresConfirmation: true,
          };
          break;

        case "orderLab":
          if (parameters.param3) {
            router.push(`/orders/lab/new?test=${encodeURIComponent(parameters.param3)}`);
            result = {
              success: true,
              message: `Ordering lab: ${parameters.param3}`,
            };
          }
          break;

        case "orderImaging":
          if (parameters.param3) {
            router.push(`/orders/imaging/new?study=${encodeURIComponent(parameters.param3)}`);
            result = {
              success: true,
              message: `Ordering imaging: ${parameters.param3}`,
            };
          }
          break;

        case "orderMedication":
          if (parameters.param3) {
            router.push(`/medications/new?drug=${encodeURIComponent(parameters.param3)}`);
            result = {
              success: true,
              message: `Prescribing medication: ${parameters.param3}`,
            };
          }
          break;

        case "scheduleAppointment":
          router.push("/schedule/new");
          result = {
            success: true,
            message: "Opening appointment scheduler",
          };
          break;

        case "addDiagnosis":
          if (parameters.param3) {
            result = {
              success: true,
              message: `Adding diagnosis: ${parameters.param3}`,
              data: { diagnosis: parameters.param3 },
              requiresConfirmation: true,
            };
          }
          break;

        case "addAllergy":
          if (parameters.param3) {
            result = {
              success: true,
              message: `Adding allergy: ${parameters.param3}`,
              data: { allergen: parameters.param3 },
              requiresConfirmation: true,
            };
          }
          break;

        case "recordVitals":
          router.push("?action=vitals");
          result = {
            success: true,
            message: "Opening vitals entry",
          };
          break;

        case "showHelp":
          result = {
            success: true,
            message: "Showing available commands",
            data: { commands: commandProcessor.current.getAvailableCommands() },
          };
          break;

        case "stopListening":
          stopListening();
          result = {
            success: true,
            message: "Voice recognition stopped",
          };
          break;

        case "readScreen":
          result = {
            success: true,
            message: "Reading screen content",
          };
          break;

        case "describePage":
          result = {
            success: true,
            message: `You are on ${window.location.pathname}`,
          };
          break;

        default:
          result = {
            success: false,
            message: `Unknown action: ${action}`,
          };
      }

      resolve(result);
    },
    [router, stopListening]
  );

  // Add custom command
  const addCommand = useCallback((command: VoiceCommand) => {
    commandProcessor.current.addCommand(command);
    setAvailableCommands(commandProcessor.current.getAvailableCommands());
  }, []);

  // Remove custom command
  const removeCommand = useCallback((commandId: string) => {
    commandProcessor.current.removeCommand(commandId);
    setAvailableCommands(commandProcessor.current.getAvailableCommands());
  }, []);

  // Get command suggestions
  const getSuggestions = useCallback((partialInput: string, limit?: number) => {
    return commandProcessor.current.getSuggestions(partialInput, limit);
  }, []);

  // Set context
  const setContext = useCallback((newContext: VoiceCommandContext) => {
    commandProcessor.current.setContext(newContext);
    setAvailableCommands(commandProcessor.current.getAvailableCommands());
  }, []);

  return {
    // State
    currentMatch,
    pendingCommand,
    lastResult,
    availableCommands,
    isListening,
    status,
    transcript,

    // Methods
    startListening,
    stopListening,
    processCommand,
    executeCommand,
    confirmCommand,
    cancelCommand,
    addCommand,
    removeCommand,
    getSuggestions,
    setContext,
  };
}
