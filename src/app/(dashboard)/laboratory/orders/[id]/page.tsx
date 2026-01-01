"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LabReport from "@/components/laboratory/LabReport";
import ResultViewer from "@/components/laboratory/ResultViewer";
import SpecimenTracker from "@/components/laboratory/SpecimenTracker";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/laboratory/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground mt-1">Order ID: {orderId}</p>
        </div>
      </div>

      <div className="space-y-6">
        <LabReport orderId={orderId} />
        <ResultViewer orderId={orderId} />
        <SpecimenTracker orderId={orderId} />
      </div>
    </div>
  );
}
