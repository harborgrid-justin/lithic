/**
 * Document Viewer Component
 * Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Document, DocumentAnnotation } from '@/types/documents';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCw, Download, Print, FileText } from 'lucide-react';

interface DocumentViewerProps {
  document: Document;
  onAnnotate?: (annotation: DocumentAnnotation) => void;
  allowAnnotations?: boolean;
  className?: string;
}

export function DocumentViewer({
  document,
  onAnnotate,
  allowAnnotations = false,
  className = '',
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load document
    const loadDocument = async () => {
      setIsLoading(true);
      try {
        // Simulate document loading
        await new Promise((resolve) => setTimeout(resolve, 500));
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [document.id]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    window.open(document.fileUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPages = document.metadata.pageCount || 1;

  return (
    <Card className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">{document.metadata.title}</h3>
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Print className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div
            className="mx-auto bg-white shadow-lg"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s',
            }}
          >
            {/* Document content would be rendered here */}
            <div className="aspect-[8.5/11] w-full max-w-4xl">
              <iframe
                src={document.fileUrl}
                className="h-full w-full border-0"
                title={document.metadata.title}
              />
            </div>
          </div>
        )}
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 rounded border px-2 py-1 text-center"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
}
