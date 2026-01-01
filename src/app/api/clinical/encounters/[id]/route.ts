import { NextRequest, NextResponse } from 'next/server'
import { Encounter } from '@/types/clinical'

// Mock data - same as in route.ts (in production, use database)
let encounters: Encounter[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encounter = encounters.find(e => e.id === params.id)

  if (!encounter) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
  }

  return NextResponse.json(encounter)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = encounters.findIndex(e => e.id === params.id)

  if (index === -1) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
  }

  const body = await request.json()

  encounters[index] = {
    ...encounters[index],
    ...body,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(encounters[index])
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = encounters.findIndex(e => e.id === params.id)

  if (index === -1) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
  }

  const body = await request.json()

  encounters[index] = {
    ...encounters[index],
    ...body,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(encounters[index])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = encounters.findIndex(e => e.id === params.id)

  if (index === -1) {
    return NextResponse.json({ error: 'Encounter not found' }, { status: 404 })
  }

  encounters.splice(index, 1)

  return NextResponse.json({ success: true })
}
