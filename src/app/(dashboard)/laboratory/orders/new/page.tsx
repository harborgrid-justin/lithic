"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import LabOrderForm from "@/components/laboratory/LabOrderForm";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();

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
          <h1 className="text-3xl font-bold">New Laboratory Order</h1>
          <p className="text-muted-foreground mt-2">
            Create a new laboratory test order
          </p>
        </div>
      </div>

      <LabOrderForm
        onSuccess={(order) => {
          router.push(`/laboratory/orders/${order.id}`);
        }}
        onCancel={() => {
          router.push("/laboratory/orders");
        }}
      />
    </div>
  );
}
