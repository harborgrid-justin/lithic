"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ResponsiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  variant?: "default" | "bordered" | "elevated" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  clickable?: boolean;
}

export function ResponsiveCard({
  title,
  description,
  footer,
  variant = "default",
  padding = "md",
  hover = false,
  clickable = false,
  className,
  children,
  ...props
}: ResponsiveCardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    md: "p-4 md:p-6",
    lg: "p-6 md:p-8",
  };

  const variantClasses = {
    default: "",
    bordered: "border-2",
    elevated: "shadow-lg",
    flat: "shadow-none border-0 bg-muted/50",
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        variantClasses[variant],
        hover && "hover:shadow-md hover:-translate-y-1",
        clickable && "cursor-pointer hover:bg-accent/5",
        className,
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader className={cn("space-y-1.5", paddingClasses[padding])}>
          {title && (
            <CardTitle className="text-lg md:text-xl lg:text-2xl">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-sm md:text-base">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent
        className={cn(
          paddingClasses[padding],
          !(title || description) && "pt-6",
        )}
      >
        {children}
      </CardContent>

      {footer && (
        <CardFooter className={cn("border-t pt-4", paddingClasses[padding])}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
