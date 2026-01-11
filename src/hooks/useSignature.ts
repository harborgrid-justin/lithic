/**
 * useSignature Hook
 * Lithic Healthcare Platform v0.5
 */

'use client';

import { useState, useCallback } from 'react';
import { SignatureRequest, SignatureData } from '@/types/esignature';

export function useSignature() {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRequest = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/esignature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create signature request');
      }

      const request = await response.json();
      setRequests((prev) => [request, ...prev]);

      return request;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signDocument = useCallback(async (
    requestId: string,
    signerId: string,
    signatures: Record<string, SignatureData>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/esignature/${requestId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerId, signatures }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign document');
      }

      const request = await response.json();
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? request : r))
      );

      return request;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requests,
    loading,
    error,
    createRequest,
    signDocument,
  };
}
