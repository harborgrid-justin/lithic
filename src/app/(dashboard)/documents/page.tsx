/**
 * Documents Page - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { DocumentSearch } from '@/components/documents/DocumentSearch';
import { VersionHistory } from '@/components/documents/VersionHistory';
import { useDocuments } from '@/hooks/useDocuments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function DocumentsPage() {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const { documents, fetchDocuments } = useDocuments('org-1');

  const handleSearch = (query: string, filters: any) => {
    fetchDocuments({ query, ...filters });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document Management</h1>
      </div>

      <DocumentSearch onSearch={handleSearch} />

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="view">View Documents</TabsTrigger>
          {selectedDocument && <TabsTrigger value="viewer">Current Document</TabsTrigger>}
        </TabsList>

        <TabsContent value="upload">
          <DocumentUploader
            organizationId="org-1"
            onUploadComplete={(id) => {
              console.log('Uploaded:', id);
            }}
          />
        </TabsContent>

        <TabsContent value="view">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <h3 className="font-semibold mb-2">{doc.metadata.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {doc.metadata.type}
                  </p>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {selectedDocument && (
          <TabsContent value="viewer">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <DocumentViewer document={selectedDocument} />
              </div>
              <div>
                <VersionHistory
                  versions={selectedDocument.versions || []}
                  currentVersion={selectedDocument.currentVersion || 1}
                />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
