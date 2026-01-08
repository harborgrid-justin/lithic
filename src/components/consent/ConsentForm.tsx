/**
 * Consent Form Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, CheckCircle } from 'lucide-react';

interface ConsentFormProps {
  title: string;
  content: string;
  onAccept?: (signature: string) => void;
  onDecline?: (reason: string) => void;
  requireSignature?: boolean;
  className?: string;
}

export function ConsentForm({ title, content, onAccept, onDecline, requireSignature = true, className = '' }: ConsentFormProps) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');

  const handleAccept = () => {
    if (requireSignature && !signature) {
      alert('Please provide your signature');
      return;
    }
    onAccept?.(signature);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>

      <ScrollArea className="h-96 border rounded-lg p-4 mb-4">
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      </ScrollArea>

      {requireSignature && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Signature</label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
        <label htmlFor="agree" className="text-sm cursor-pointer">
          I have read and agree to the terms described in this consent form
        </label>
      </div>

      <div className="flex gap-2">
        {onDecline && (
          <Button variant="outline" onClick={() => onDecline('Declined by user')} className="flex-1">
            Decline
          </Button>
        )}
        <Button onClick={handleAccept} disabled={!agreed} className="flex-1">
          <CheckCircle className="h-4 w-4 mr-2" />
          Accept & Sign
        </Button>
      </div>
    </Card>
  );
}
