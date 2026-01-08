/**
 * Notification Settings Page
 * Lithic Healthcare Platform v0.5
 *
 * Allows users to configure notification preferences, channels, and quiet hours.
 */

import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PreferencesPanel } from '@/components/notifications/PreferencesPanel';
import { QuietHoursSettings } from '@/components/notifications/QuietHoursSettings';

export const metadata: Metadata = {
  title: 'Notification Settings | Lithic Healthcare',
  description: 'Configure your notification preferences',
};

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="quiet-hours">Quiet Hours</TabsTrigger>
          <TabsTrigger value="digest">Digest</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesPanel />
        </TabsContent>

        <TabsContent value="quiet-hours" className="space-y-6">
          <QuietHoursSettings />
        </TabsContent>

        <TabsContent value="digest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Digest</CardTitle>
              <CardDescription>
                Receive a summary of notifications at scheduled times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Daily Digest</p>
                    <p className="text-xs text-muted-foreground">
                      Receive a daily summary of notifications at 8:00 AM
                    </p>
                  </div>
                  {/* Would add Switch component here */}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Weekly Digest</p>
                    <p className="text-xs text-muted-foreground">
                      Receive a weekly summary every Monday at 8:00 AM
                    </p>
                  </div>
                  {/* Would add Switch component here */}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About Notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Notifications help you stay informed about important events, appointments,
            test results, and messages. You can customize how you receive notifications
            by choosing your preferred channels and setting quiet hours to minimize
            disruptions during specific times.
          </p>
          <p className="mt-2">
            Critical alerts will always be delivered to ensure patient safety and care
            quality, even during quiet hours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
