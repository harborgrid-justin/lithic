'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImagingOrderForm from '@/components/imaging/ImagingOrderForm';
import { imagingService, ImagingOrder } from '@/services/imaging.service';

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<ImagingOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const data = await imagingService.getOrder(params.id);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    router.push('/imaging/orders');
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Order not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Imaging Order</h1>
        <p className="text-gray-600 mt-1">Order ID: {params.id}</p>
      </div>

      <ImagingOrderForm
        order={order}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
