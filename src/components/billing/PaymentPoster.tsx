"use client";

/**
 * Lithic Enterprise v0.3 - Payment Poster Component
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Plus } from "lucide-react";

interface PaymentPosterProps {
  claimId: string;
  charges: Array<{
    id: string;
    code: string;
    description: string;
    billed: number;
    balance: number;
  }>;
  onPost: (payment: any) => Promise<void>;
}

export function PaymentPoster({ claimId, charges, onPost }: PaymentPosterProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [allocations, setAllocations] = useState<{ [chargeId: string]: number }>(
    {}
  );

  const totalAllocated = Object.values(allocations).reduce(
    (sum, amt) => sum + amt,
    0
  );

  const handlePost = async () => {
    await onPost({
      amount: parseFloat(paymentAmount),
      checkNumber,
      allocations: Object.entries(allocations).map(([chargeId, amount]) => ({
        chargeId,
        amount,
      })),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Check Number</Label>
            <Input
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Allocate to Charges</Label>
          <div className="border rounded-lg divide-y">
            {charges.map((charge) => (
              <div key={charge.id} className="p-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">{charge.code}</div>
                  <div className="text-sm text-gray-500">
                    {charge.description}
                  </div>
                  <div className="text-sm">
                    Billed: ${charge.billed.toFixed(2)} | Balance: $
                    {charge.balance.toFixed(2)}
                  </div>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  className="w-32"
                  value={allocations[charge.id] || ""}
                  onChange={(e) =>
                    setAllocations({
                      ...allocations,
                      [charge.id]: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <span>Total Allocated:</span>
          <span className="text-xl font-bold">
            ${totalAllocated.toFixed(2)}
          </span>
        </div>

        <Button onClick={handlePost} className="w-full">
          <DollarSign className="h-4 w-4 mr-2" />
          Post Payment
        </Button>
      </CardContent>
    </Card>
  );
}
