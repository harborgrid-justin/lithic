'use client'

import { useEffect, useState } from 'react'
import { Order } from '@/types/clinical'
import { getOrders } from '@/services/clinical.service'
import { OrdersPanel } from '@/components/clinical/OrdersPanel'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Orders</h1>
            <p className="text-gray-600 mt-1">Lab, imaging, and procedure orders</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>

        <OrdersPanel orders={orders} />
      </div>
    </div>
  )
}
