/**
 * Signature Request Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { SignatureRequest as SignatureRequestType } from '@/types/esignature';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SignatureRequestProps {
  request: SignatureRequestType;
  onSign?: () => void;
  onView?: () => void;
  className?: string;
}

export function SignatureRequest({ request, onSign, onView, className = '' }: SignatureRequestProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-500',
      sent: 'bg-blue-500',
      signed: 'bg-purple-500',
      declined: 'bg-red-500',
      expired: 'bg-gray-500',
    };
    return colors[status] || 'bg-yellow-500';
  };

  const signedCount = request.signers.filter((s) => s.status === 'signed').length;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{request.title}</h3>
            <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{request.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{signedCount} of {request.signers.length} signed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{formatDistanceToNow(request.createdAt, { addSuffix: true })}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {request.signers.map((signer) => (
          <div key={signer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">{signer.name}</p>
              <p className="text-sm text-muted-foreground">{signer.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {signer.status === 'signed' && <CheckCircle className="h-5 w-5 text-green-500" />}
              <Badge variant={signer.status === 'signed' ? 'default' : 'secondary'}>{signer.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {onView && <Button variant="outline" onClick={onView} className="flex-1">View Document</Button>}
        {onSign && request.status !== 'completed' && <Button onClick={onSign} className="flex-1">Sign Document</Button>}
      </div>
    </Card>
  );
}
