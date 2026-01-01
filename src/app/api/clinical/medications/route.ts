import { NextRequest, NextResponse } from 'next/server'
import { Medication } from '@/types/clinical'

// Mock data
let medications: Medication[] = [
  {
    id: '1',
    patientId: 'P001',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    dosage: '500mg',
    route: 'oral',
    frequency: 'Twice daily with meals',
    startDate: '2020-05-15',
    status: 'active',
    prescriberId: 'PR001',
    prescriberName: 'Dr. Sarah Smith',
    refills: 5,
    instructions: 'Take with food to minimize GI upset',
    createdAt: '2020-05-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')

  let filtered = medications
  if (patientId) {
    filtered = medications.filter(m => m.patientId === patientId)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newMedication: Medication = {
    id: `M${medications.length + 1}`,
    patientId: body.patientId,
    name: body.name,
    genericName: body.genericName,
    dosage: body.dosage,
    route: body.route,
    frequency: body.frequency,
    startDate: body.startDate,
    endDate: body.endDate,
    status: body.status || 'active',
    prescriberId: body.prescriberId,
    prescriberName: body.prescriberName,
    pharmacy: body.pharmacy,
    refills: body.refills,
    instructions: body.instructions,
    notes: body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  medications.push(newMedication)

  return NextResponse.json(newMedication, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  const index = medications.findIndex(m => m.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
  }

  medications[index] = {
    ...medications[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(medications[index])
}
