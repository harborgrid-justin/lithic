/**
 * Version History Component
 * Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { DocumentVersion } from '@/types/documents';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Download, Eye, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  currentVersion: number;
  onVersionSelect?: (version: DocumentVersion) => void;
  onRestore?: (versionNumber: number) => void;
  className?: string;
}

export function VersionHistory({
  versions,
  currentVersion,
  onVersionSelect,
  onRestore,
  className = '',
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);

  const handleVersionClick = (version: DocumentVersion) => {
    setSelectedVersion(version);
    onVersionSelect?.(version);
  };

  const handleRestore = (versionNumber: number) => {
    if (confirm(`Are you sure you want to restore version ${versionNumber}?`)) {
      onRestore?.(versionNumber);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Version History</h3>
        <Badge variant="secondary">{versions.length} versions</Badge>
      </div>

      <div className="space-y-2">
        {versions
          .sort((a, b) => b.versionNumber - a.versionNumber)
          .map((version) => (
            <div
              key={version.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                version.versionNumber === currentVersion
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              } ${selectedVersion?.id === version.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleVersionClick(version)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">Version {version.versionNumber}</span>
                    {version.isCurrent && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {version.changeDescription}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{version.createdByName}</span>
                    <span>{formatDistanceToNow(version.createdAt, { addSuffix: true })}</span>
                    <span>{(version.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(version.fileUrl, '_blank');
                    }}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(version.fileUrl, '_blank');
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!version.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version.versionNumber);
                      }}
                      title="Restore"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}
