'use client';

import { useState, useEffect } from 'react';
import { Claim } from '@/types/billing';
import ClaimsList from '@/components/billing/ClaimsList';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/billing/claims');
      if (response.ok) {
        const data = await response.json();
        setClaims(data);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimSelect = (claim: Claim) => {
    router.push(`/billing/claims/${claim.id}`);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
          <p className="text-gray-600 mt-2">View and manage insurance claims</p>
        </div>
        <Link
          href="/billing/claims/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          New Claim
        </Link>
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading claims...</p>
        </div>
      ) : (
        <ClaimsList claims={claims} onClaimSelect={handleClaimSelect} />
      )}
    </div>
  );
}
