'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import LabOrderList from '@/components/laboratory/LabOrderList';
import { LabOrder } from '@/types/laboratory';
import Link from 'next/link';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laboratory Orders</h1>
          <p className="text-muted-foreground mt-2">
            View and manage laboratory test orders
          </p>
        </div>
        <Link href="/laboratory/orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      <LabOrderList 
        onViewOrder={(order) => {
          setSelectedOrder(order);
          window.location.href = `/laboratory/orders/${order.id}`;
        }}
      />
    </div>
  );
}
