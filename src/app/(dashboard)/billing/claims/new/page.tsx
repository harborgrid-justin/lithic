'use client';

import { useRouter } from 'next/navigation';
import ClaimForm from '@/components/billing/ClaimForm';
import { ArrowLeft } from 'lucide-react';
import { Claim } from '@/types/billing';

export default function NewClaimPage() {
  const router = useRouter();

  const handleSubmit = async (data: Partial<Claim>) => {
    try {
      const response = await fetch('/api/billing/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const claim = await response.json();
        alert('Claim created successfully!');
        router.push(`/billing/claims/${claim.id}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create claim'}`);
      }
    } catch (error) {
      console.error('Error creating claim:', error);
      alert('Failed to create claim');
    }
  };

  const handleCancel = () => {
    router.push('/billing/claims');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/billing/claims')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Claims
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Claim</h1>
        <p className="text-gray-600 mt-2">Submit a new insurance claim</p>
      </div>

      {/* Claim Form */}
      <ClaimForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
