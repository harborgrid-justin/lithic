'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImagingOrderList from '@/components/imaging/ImagingOrderList';
import { ImagingOrder } from '@/services/imaging.service';

export default function ImagingOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<ImagingOrder | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Imaging Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track imaging orders</p>
        </div>
        <Link
          href="/imaging/orders/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Order
        </Link>
      </div>

      {/* Orders List */}
      <ImagingOrderList onSelectOrder={setSelectedOrder} />

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Patient Information</h3>
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedOrder.patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">MRN:</span>
                      <span className="font-medium">{selectedOrder.patientMRN}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Order Details</h3>
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Procedure:</span>
                      <span className="font-medium">{selectedOrder.procedure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modality:</span>
                      <span className="font-medium">{selectedOrder.modality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Body Part:</span>
                      <span className="font-medium">{selectedOrder.bodyPart}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className="font-medium">{selectedOrder.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{selectedOrder.status}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Clinical Indication</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-900">{selectedOrder.clinicalIndication}</p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-gray-900">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Link
                    href={`/imaging/orders/${selectedOrder.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
                  >
                    Edit Order
                  </Link>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
