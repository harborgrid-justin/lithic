'use client';

/**
 * TypingIndicator Component
 * Shows when users are typing
 */

import React from 'react';
import { TypingIndicator as TypingIndicatorType } from '@/types/communication';

interface TypingIndicatorProps {
  users: TypingIndicatorType[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const names = users.map((u) => u.userName);
  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : `${names[0]} and ${names.length - 1} others are typing...`;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{text}</span>
      <div className="flex gap-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}
