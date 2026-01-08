/**
 * Quiet Hours Settings Component
 * Lithic Healthcare Platform v0.5
 *
 * Allows users to configure quiet hours and do-not-disturb settings.
 */

'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const PRESETS = [
  {
    name: 'Nighttime',
    startTime: '22:00',
    endTime: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    name: 'Work Hours',
    startTime: '09:00',
    endTime: '17:00',
    days: [1, 2, 3, 4, 5],
  },
  {
    name: 'Weekends',
    startTime: '00:00',
    endTime: '23:59',
    days: [0, 6],
  },
];

export function QuietHoursSettings() {
  const {
    preferences,
    isLoading,
    updateQuietHours,
  } = useNotificationPreferences();

  if (isLoading || !preferences) {
    return <div>Loading...</div>;
  }

  const quietHours = preferences.quietHours;

  const handleToggle = (enabled: boolean) => {
    updateQuietHours({
      ...quietHours,
      enabled,
    });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    updateQuietHours({
      ...quietHours,
      [field]: value,
    });
  };

  const handleDayToggle = (day: number, checked: boolean) => {
    const days = checked
      ? [...quietHours.days, day]
      : quietHours.days.filter((d) => d !== day);

    updateQuietHours({
      ...quietHours,
      days: days.sort((a, b) => a - b),
    });
  };

  const handleAllowCritical = (checked: boolean) => {
    updateQuietHours({
      ...quietHours,
      allowCritical: checked,
    });
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    updateQuietHours({
      ...quietHours,
      startTime: preset.startTime,
      endTime: preset.endTime,
      days: preset.days,
      enabled: true,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Silence notifications during specific times
              </CardDescription>
            </div>
            <Switch
              checked={quietHours.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardHeader>

        {quietHours.enabled && (
          <CardContent className="space-y-6">
            {/* Time Range */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={quietHours.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={quietHours.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Notifications will be silenced from {quietHours.startTime} to{' '}
                {quietHours.endTime}
              </p>
            </div>

            {/* Days Selection */}
            <div className="space-y-3">
              <Label>Active Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isChecked = quietHours.days.includes(day.value);
                  return (
                    <div
                      key={day.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleDayToggle(day.value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`day-${day.value}`}
                        className="text-sm font-normal"
                      >
                        {day.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Allow Critical */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="allow-critical">Allow Critical Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Critical notifications will bypass quiet hours
                </p>
              </div>
              <Switch
                id="allow-critical"
                checked={quietHours.allowCritical}
                onCheckedChange={handleAllowCritical}
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-3">
              <Label>Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Status Display */}
      {quietHours.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {/* Would show Sun or Moon based on current time */}
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Quiet hours active
                </p>
                <p className="text-xs text-muted-foreground">
                  Ends at {quietHours.endTime}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
