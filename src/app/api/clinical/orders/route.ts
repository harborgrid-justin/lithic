import { NextRequest, NextResponse } from 'next/server'
import { Order } from '@/types/clinical'

// Mock data
let orders: Order[] = [
  {
    id: '1',
    patientId: 'P001',
    patientName: 'John Doe',
    type: 'lab',
    description: 'Complete Blood Count (CBC)',
    orderingProviderId: 'PR001',
    orderingProviderName: 'Dr. Sarah Smith',
    status: 'completed',
    priority: 'routine',
    orderedAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-16T14:00:00Z',
    results: 'All values within normal range',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T14:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')

  let filtered = orders
  if (patientId) {
    filtered = orders.filter(o => o.patientId === patientId)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newOrder: Order = {
    id: `O${orders.length + 1}`,
    patientId: body.patientId,
    patientName: body.patientName,
    encounterId: body.encounterId,
    type: body.type,
    description: body.description,
    orderingProviderId: body.orderingProviderId,
    orderingProviderName: body.orderingProviderName,
    status: body.status || 'pending',
    priority: body.priority || 'routine',
    orderedAt: body.orderedAt || new Date().toISOString(),
    scheduledFor: body.scheduledFor,
    notes: body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  orders.push(newOrder)

  return NextResponse.json(newOrder, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  const index = orders.findIndex(o => o.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(orders[index])
}
