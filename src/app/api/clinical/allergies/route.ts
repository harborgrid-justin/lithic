import { NextRequest, NextResponse } from 'next/server'
import { Allergy } from '@/types/clinical'

// Mock data
let allergies: Allergy[] = [
  {
    id: '1',
    patientId: 'P001',
    allergen: 'Penicillin',
    type: 'medication',
    reaction: 'Rash, itching',
    severity: 'moderate',
    onsetDate: '2015-03-20',
    notes: 'Developed hives after taking amoxicillin',
    createdAt: '2015-03-20T10:00:00Z',
    updatedAt: '2015-03-20T10:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')

  let filtered = allergies
  if (patientId) {
    filtered = allergies.filter(a => a.patientId === patientId)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newAllergy: Allergy = {
    id: `A${allergies.length + 1}`,
    patientId: body.patientId,
    allergen: body.allergen,
    type: body.type,
    reaction: body.reaction,
    severity: body.severity,
    onsetDate: body.onsetDate,
    notes: body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  allergies.push(newAllergy)

  return NextResponse.json(newAllergy, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  const index = allergies.findIndex(a => a.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Allergy not found' }, { status: 404 })
  }

  allergies[index] = {
    ...allergies[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(allergies[index])
}
