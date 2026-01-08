/**
 * Preferences Panel Component
 * Lithic Healthcare Platform v0.5
 *
 * Allows users to configure notification preferences per channel and category.
 */

'use client';

import React from 'react';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import {
  NotificationChannel,
  NotificationCategory,
} from '@/types/notifications';

export function PreferencesPanel() {
  const {
    preferences,
    isLoading,
    updateChannelEnabled,
    updateCategoryEnabled,
  } = useNotificationPreferences();

  const channelIcons = {
    [NotificationChannel.IN_APP]: Bell,
    [NotificationChannel.PUSH]: Smartphone,
    [NotificationChannel.SMS]: MessageSquare,
    [NotificationChannel.EMAIL]: Mail,
  };

  const channelNames = {
    [NotificationChannel.IN_APP]: 'In-App',
    [NotificationChannel.PUSH]: 'Push',
    [NotificationChannel.SMS]: 'SMS',
    [NotificationChannel.EMAIL]: 'Email',
  };

  const categoryNames = {
    [NotificationCategory.CLINICAL_ALERT]: 'Clinical Alerts',
    [NotificationCategory.APPOINTMENT]: 'Appointments',
    [NotificationCategory.LAB_RESULT]: 'Lab Results',
    [NotificationCategory.MEDICATION]: 'Medications',
    [NotificationCategory.MESSAGE]: 'Messages',
    [NotificationCategory.SYSTEM]: 'System',
    [NotificationCategory.BILLING]: 'Billing',
    [NotificationCategory.DOCUMENT]: 'Documents',
    [NotificationCategory.TASK]: 'Tasks',
    [NotificationCategory.WORKFLOW]: 'Workflows',
  };

  if (isLoading || !preferences) {
    return <div>Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(channelNames).map(([channel, name]) => {
            const Icon = channelIcons[channel as NotificationChannel];
            const isEnabled =
              preferences.channels[channel as NotificationChannel]?.enabled || false;

            return (
              <div
                key={channel}
                className="flex items-center justify-between space-x-2"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label
                      htmlFor={`channel-${channel}`}
                      className="text-sm font-medium"
                    >
                      {name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive notifications via {name.toLowerCase()}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`channel-${channel}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) =>
                    updateChannelEnabled(channel as NotificationChannel, checked)
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Separator />

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Control which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(categoryNames).map(([category, name]) => {
            const categoryPrefs = preferences.categories?.[category as NotificationCategory];
            const isEnabled = categoryPrefs?.enabled !== false;
            const channels = categoryPrefs?.channels || [];

            return (
              <div
                key={category}
                className="flex items-start justify-between space-x-2"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium"
                    >
                      {name}
                    </Label>
                    {categoryPrefs?.priority && (
                      <Badge variant="outline" className="text-xs">
                        {categoryPrefs.priority}
                      </Badge>
                    )}
                  </div>
                  {channels.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Channels: {channels.map((ch) => channelNames[ch]).join(', ')}
                    </p>
                  )}
                </div>
                <Switch
                  id={`category-${category}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) =>
                    updateCategoryEnabled(category as NotificationCategory, checked)
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
