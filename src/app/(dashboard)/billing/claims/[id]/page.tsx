"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Claim } from "@/types/billing";
import ClaimDetail from "@/components/billing/ClaimDetail";
import { ArrowLeft } from "lucide-react";

export default function ClaimDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClaim();
  }, [params.id]);

  const fetchClaim = async () => {
    try {
      const response = await fetch(`/api/billing/claims/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setClaim(data);
      } else {
        router.push("/billing/claims");
      }
    } catch (error) {
      console.error("Error fetching claim:", error);
      router.push("/billing/claims");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!claim) return;

    try {
      const response = await fetch("/api/billing/claims/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: claim.id }),
      });

      if (response.ok) {
        alert("Claim submitted successfully!");
        fetchClaim();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to submit claim"}`);
      }
    } catch (error) {
      console.error("Error submitting claim:", error);
      alert("Failed to submit claim");
    }
  };

  const handleEdit = () => {
    router.push(`/billing/claims/${params.id}/edit`);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/billing/claims")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Claims
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Claim Details</h1>
      </div>

      {/* Claim Detail */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Loading claim...</p>
        </div>
      ) : claim ? (
        <ClaimDetail
          claim={claim}
          onEdit={handleEdit}
          onSubmit={handleSubmit}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Claim not found</p>
        </div>
      )}
    </div>
  );
}
