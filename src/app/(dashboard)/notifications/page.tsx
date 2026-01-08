/**
 * Notifications Page
 * Lithic Healthcare Platform v0.5
 *
 * Main notifications page displaying all notifications with filtering and management.
 */

import { Metadata } from 'next';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const metadata: Metadata = {
  title: 'Notifications | Lithic Healthcare',
  description: 'View and manage your notifications',
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] max-w-7xl py-6">
      <NotificationCenter />
    </div>
  );
}
