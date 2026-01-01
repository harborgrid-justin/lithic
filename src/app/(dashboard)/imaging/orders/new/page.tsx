'use client';

import { useRouter } from 'next/navigation';
import ImagingOrderForm from '@/components/imaging/ImagingOrderForm';

export default function NewOrderPage() {
  const router = useRouter();

  const handleSubmit = () => {
    router.push('/imaging/orders');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Imaging Order</h1>
        <p className="text-gray-600 mt-1">Create a new imaging order</p>
      </div>

      <ImagingOrderForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
