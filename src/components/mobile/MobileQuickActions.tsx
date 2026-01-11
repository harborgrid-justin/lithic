"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  Stethoscope,
  Phone,
  Camera,
  type LucideIcon,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: number;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  disabled?: boolean;
}

interface MobileQuickActionsProps {
  actions: QuickAction[];
  layout?: "grid" | "list" | "carousel";
  columns?: 3 | 4;
  className?: string;
}

/**
 * Mobile Quick Actions
 * Touch-optimized action buttons for common tasks
 */
export function MobileQuickActions({
  actions,
  layout = "grid",
  columns = 4,
  className,
}: MobileQuickActionsProps) {
  if (layout === "grid") {
    return (
      <div
        className={cn(
          "mobile-quick-actions-grid",
          "grid gap-3",
          columns === 3 && "grid-cols-3",
          columns === 4 && "grid-cols-4",
          className
        )}
      >
        {actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className={cn("mobile-quick-actions-list", "space-y-2", className)}>
        {actions.map((action) => (
          <QuickActionListItem key={action.id} action={action} />
        ))}
      </div>
    );
  }

  // Carousel layout
  return (
    <div className={cn("mobile-quick-actions-carousel", className)}>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}

/**
 * Quick Action Button (Grid/Carousel)
 */
function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  const variantClasses = {
    default: "bg-muted text-muted-foreground hover:bg-muted/80",
    primary: "bg-primary/10 text-primary hover:bg-primary/20",
    success: "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  };

  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        "quick-action-button",
        "flex flex-col items-center justify-center",
        "gap-2 p-4",
        "rounded-lg",
        "transition-all duration-200",
        "active:scale-95",
        "relative",
        "min-w-[4.5rem]",
        variantClasses[action.variant || "default"],
        action.disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Badge */}
      {action.badge && action.badge > 0 && (
        <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
          {action.badge > 99 ? "99+" : action.badge}
        </span>
      )}

      {/* Icon */}
      <Icon className="w-6 h-6" />

      {/* Label */}
      <span className="text-xs font-medium text-center leading-tight">
        {action.label}
      </span>
    </button>
  );
}

/**
 * Quick Action List Item
 */
function QuickActionListItem({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  const variantClasses = {
    default: "hover:bg-accent/10",
    primary: "hover:bg-primary/5",
    success: "hover:bg-green-500/5",
    warning: "hover:bg-yellow-500/5",
    destructive: "hover:bg-destructive/5",
  };

  const iconColorClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-green-700 dark:text-green-400",
    warning: "text-yellow-700 dark:text-yellow-400",
    destructive: "text-destructive",
  };

  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        "quick-action-list-item",
        "flex items-center gap-3",
        "w-full p-4",
        "rounded-lg border",
        "bg-card",
        "transition-all duration-200",
        "active:scale-[0.98]",
        "relative",
        variantClasses[action.variant || "default"],
        action.disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0",
          "w-10 h-10 rounded-full",
          "flex items-center justify-center",
          "bg-muted",
          iconColorClasses[action.variant || "default"]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Label */}
      <span className="flex-1 text-left font-medium">{action.label}</span>

      {/* Badge */}
      {action.badge && action.badge > 0 && (
        <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-sm font-bold rounded-full min-w-[1.75rem] h-7 flex items-center justify-center px-2">
          {action.badge > 99 ? "99+" : action.badge}
        </span>
      )}
    </button>
  );
}

/**
 * Clinical Quick Actions Preset
 */
export function ClinicalQuickActions({
  onNewPatient,
  onNewAppointment,
  onClinicalNote,
  onPrescription,
  onLabOrder,
  onVitals,
  className,
}: {
  onNewPatient?: () => void;
  onNewAppointment?: () => void;
  onClinicalNote?: () => void;
  onPrescription?: () => void;
  onLabOrder?: () => void;
  onVitals?: () => void;
  className?: string;
}) {
  const actions: QuickAction[] = [
    {
      id: "new-patient",
      label: "New Patient",
      icon: Plus,
      onClick: onNewPatient || (() => {}),
      variant: "primary",
      disabled: !onNewPatient,
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      onClick: onNewAppointment || (() => {}),
      disabled: !onNewAppointment,
    },
    {
      id: "note",
      label: "Note",
      icon: FileText,
      onClick: onClinicalNote || (() => {}),
      disabled: !onClinicalNote,
    },
    {
      id: "rx",
      label: "Rx",
      icon: Pill,
      onClick: onPrescription || (() => {}),
      disabled: !onPrescription,
    },
    {
      id: "lab",
      label: "Lab",
      icon: FlaskConical,
      onClick: onLabOrder || (() => {}),
      disabled: !onLabOrder,
    },
    {
      id: "vitals",
      label: "Vitals",
      icon: Stethoscope,
      onClick: onVitals || (() => {}),
      disabled: !onVitals,
    },
  ];

  return (
    <MobileQuickActions
      actions={actions}
      layout="grid"
      columns={3}
      className={className}
    />
  );
}

/**
 * Communication Quick Actions
 */
export function CommunicationQuickActions({
  onCall,
  onMessage,
  onVideoCall,
  className,
}: {
  onCall?: () => void;
  onMessage?: () => void;
  onVideoCall?: () => void;
  className?: string;
}) {
  const actions: QuickAction[] = [
    {
      id: "call",
      label: "Call",
      icon: Phone,
      onClick: onCall || (() => {}),
      variant: "primary",
      disabled: !onCall,
    },
    {
      id: "message",
      label: "Message",
      icon: FileText,
      onClick: onMessage || (() => {}),
      disabled: !onMessage,
    },
    {
      id: "video",
      label: "Video",
      icon: Camera,
      onClick: onVideoCall || (() => {}),
      disabled: !onVideoCall,
    },
  ];

  return (
    <MobileQuickActions
      actions={actions}
      layout="grid"
      columns={3}
      className={className}
    />
  );
}

/**
 * Action Sheet for Quick Actions
 * Bottom sheet with action buttons
 */
interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: QuickAction[];
  className?: string;
}

export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  className,
}: MobileActionSheetProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleActionClick = (action: QuickAction) => {
    action.onClick();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Action sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-background rounded-t-2xl",
          "shadow-2xl",
          "transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-full",
          className
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-4 pb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-8 space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={cn(
                  "flex items-center gap-4",
                  "w-full p-4",
                  "rounded-lg",
                  "bg-muted hover:bg-muted/80",
                  "transition-colors duration-200",
                  "active:scale-[0.98]",
                  action.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-base font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cancel button */}
        <div className="px-4 pb-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-3 text-center font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
