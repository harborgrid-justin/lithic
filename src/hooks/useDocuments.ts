/**
 * useDocuments Hook
 * Lithic Healthcare Platform v0.5
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentSearchParams, DocumentUploadOptions } from '@/types/documents';

export function useDocuments(organizationId: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async (params: DocumentSearchParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.query) queryParams.set('query', params.query);
      if (params.patientId) queryParams.set('patientId', params.patientId);
      if (params.types) queryParams.set('types', params.types.join(','));
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());

      const response = await fetch(`/api/documents?${queryParams}`);

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (
    file: File,
    options: DocumentUploadOptions
  ) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const document = await response.json();
      setDocuments((prev) => [document, ...prev]);

      return document;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
}
