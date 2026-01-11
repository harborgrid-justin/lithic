/**
 * Consent Manager Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { ConsentForm } from '@/lib/consent/consent-manager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface ConsentManagerProps {
  consents: ConsentForm[];
  onGrant?: (consentId: string) => void;
  onWithdraw?: (consentId: string) => void;
  onView?: (consentId: string) => void;
  className?: string;
}

export function ConsentManager({ consents, onGrant, onWithdraw, onView, className = '' }: ConsentManagerProps) {
  const [activeTab, setActiveTab] = useState('active');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'withdrawn':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const activeConsents = consents.filter(c => c.status === 'granted' && c.isActive);
  const pendingConsents = consents.filter(c => c.status === 'pending');
  const withdrawnConsents = consents.filter(c => c.status === 'withdrawn');

  const renderConsentList = (list: ConsentForm[]) => (
    <div className="space-y-3">
      {list.map((consent) => (
        <Card key={consent.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(consent.status)}
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{consent.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{consent.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Type: {consent.type.replace('_', ' ')}</span>
                  <span>Version: {consent.version}</span>
                  {consent.expiresAt && <span>Expires: {new Date(consent.expiresAt).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant={consent.status === 'granted' ? 'default' : 'secondary'}>
                {consent.status}
              </Badge>
              {onView && (
                <Button variant="outline" size="sm" onClick={() => onView(consent.id)}>
                  View
                </Button>
              )}
              {consent.status === 'pending' && onGrant && (
                <Button size="sm" onClick={() => onGrant(consent.id)}>
                  Grant
                </Button>
              )}
              {consent.status === 'granted' && onWithdraw && (
                <Button variant="destructive" size="sm" onClick={() => onWithdraw(consent.id)}>
                  Withdraw
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
      {list.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No consents found
        </div>
      )}
    </div>
  );

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-xl font-semibold mb-4">Consent Management</h3>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({activeConsents.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingConsents.length})</TabsTrigger>
          <TabsTrigger value="withdrawn">Withdrawn ({withdrawnConsents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {renderConsentList(activeConsents)}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {renderConsentList(pendingConsents)}
        </TabsContent>

        <TabsContent value="withdrawn" className="mt-4">
          {renderConsentList(withdrawnConsents)}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
