/**
 * Document Uploader Component
 * Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dnd-html5-backend';
import { DocumentType, DocumentUploadOptions } from '@/types/documents';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

interface DocumentUploaderProps {
  organizationId: string;
  patientId?: string;
  encounterId?: string;
  onUploadComplete?: (documentId: string) => void;
  className?: string;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function DocumentUploader({
  organizationId,
  patientId,
  encounterId,
  onUploadComplete,
  className = '',
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('medical_record');
  const [tags, setTags] = useState('');
  const [performOcr, setPerformOcr] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadDocument } = useDocuments(organizationId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setIsDragging(false);
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    onDrop(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      if (!fileItem || fileItem.status !== 'pending') continue;

      try {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'uploading' as const } : f
          )
        );

        const options: DocumentUploadOptions = {
          organizationId,
          patientId,
          encounterId,
          type: documentType,
          title: title || fileItem.file.name,
          description,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          performOcr,
        };

        const document = await uploadDocument(fileItem.file, options);

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'completed' as const, progress: 100 } : f
          )
        );

        if (onUploadComplete) {
          onUploadComplete(document.id);
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
      }
    }
  };

  const canUpload = files.some((f) => f.status === 'pending');

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>

      {/* Dropzone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
        <p className="text-sm text-muted-foreground mb-4">
          Supports PDF, JPEG, PNG, TIFF, DOCX (Max 50MB)
        </p>
        <Input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.docx"
          onChange={(e) => {
            if (e.target.files) {
              onDrop(Array.from(e.target.files));
            }
          }}
          className="hidden"
          id="file-upload"
        />
        <Button asChild variant="outline">
          <label htmlFor="file-upload" className="cursor-pointer">
            Select Files
          </label>
        </Button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="font-medium">Files ({files.length})</h4>
          {files.map((fileItem, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <File className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fileItem.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {fileItem.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {fileItem.status === 'uploading' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                )}
                {fileItem.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {fileItem.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload options */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title (optional)"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Document description (optional)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Document Type</Label>
            <Select value={documentType} onValueChange={(value: DocumentType) => setDocumentType(value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical_record">Medical Record</SelectItem>
                <SelectItem value="lab_result">Lab Result</SelectItem>
                <SelectItem value="imaging">Imaging</SelectItem>
                <SelectItem value="consent_form">Consent Form</SelectItem>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="insurance_card">Insurance Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., cardiology, urgent, follow-up"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ocr"
              checked={performOcr}
              onChange={(e) => setPerformOcr(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="ocr" className="cursor-pointer">
              Perform OCR text extraction
            </Label>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!canUpload}
            className="w-full"
          >
            Upload {files.filter((f) => f.status === 'pending').length} File(s)
          </Button>
        </div>
      )}
    </Card>
  );
}
