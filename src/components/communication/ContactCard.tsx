'use client';

/**
 * ContactCard Component
 * Display contact information with presence and quick actions
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PresenceIndicator } from './PresenceIndicator';
import { MessageSquare, Video, Phone, Mail } from 'lucide-react';
import { UserPresence, PresenceStatus } from '@/types/communication';

interface ContactCardProps {
  userId: string;
  name: string;
  avatar?: string;
  role?: string;
  department?: string;
  presence?: UserPresence;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
}

export function ContactCard({
  userId,
  name,
  avatar,
  role,
  department,
  presence,
  onMessage,
  onCall,
  onVideoCall,
}: ContactCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-4">
        {/* Avatar with presence */}
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-lg">{name[0]}</AvatarFallback>
          </Avatar>
          {presence && (
            <div className="absolute bottom-0 right-0">
              <PresenceIndicator status={presence.status} size="md" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-semibold">{name}</h3>
          {role && <p className="text-sm text-muted-foreground">{role}</p>}
          {department && (
            <p className="text-sm text-muted-foreground">{department}</p>
          )}
          {presence?.statusMessage && (
            <p className="mt-1 text-sm italic text-muted-foreground">
              {presence.statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onMessage}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Message
        </Button>
        <Button variant="outline" size="sm" onClick={onVideoCall}>
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onCall}>
          <Phone className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
