/**
 * Signed Document Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { SignatureRequest } from '@/types/esignature';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Download, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SignedDocumentProps {
  request: SignatureRequest;
  onDownload?: () => void;
  className?: string;
}

export function SignedDocument({ request, onDownload, className = '' }: SignedDocumentProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FileCheck className="h-6 w-6 text-green-500" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{request.title}</h3>
          <p className="text-sm text-muted-foreground">Fully Executed Document</p>
        </div>
        <Badge variant="default" className="bg-green-500">Completed</Badge>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium mb-2">Document Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Document Name:</span>
            <span className="font-medium">{request.documentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed:</span>
            <span>{request.completedAt && formatDistanceToNow(request.completedAt, { addSuffix: true })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Signers:</span>
            <span>{request.signers.length}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Signatures</h4>
        <div className="space-y-2">
          {request.signers.map((signer) => (
            <div key={signer.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{signer.name}</p>
                <p className="text-sm text-muted-foreground">
                  Signed {signer.signedAt && formatDistanceToNow(signer.signedAt, { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={onDownload} className="w-full">
        <Download className="h-4 w-4 mr-2" />
        Download Signed Document
      </Button>
    </Card>
  );
}
