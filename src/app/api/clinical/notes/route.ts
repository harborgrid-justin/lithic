import { NextRequest, NextResponse } from 'next/server'
import { ClinicalNote } from '@/types/clinical'

// Mock data
let notes: ClinicalNote[] = [
  {
    id: '1',
    encounterId: '1',
    patientId: 'P001',
    patientName: 'John Doe',
    providerId: 'PR001',
    providerName: 'Dr. Sarah Smith',
    type: 'soap',
    title: 'Annual Physical - SOAP Note',
    content: '',
    subjective: 'Patient reports feeling well overall. No new complaints.',
    objective: 'Vital signs normal. Physical exam unremarkable.',
    assessment: 'Healthy adult, no acute concerns.',
    plan: 'Continue current lifestyle. Return in 1 year for next annual exam.',
    signed: true,
    signedBy: 'Dr. Sarah Smith',
    signedAt: '2024-01-15T11:00:00Z',
    signature: 'Sarah Smith, MD',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')
  const encounterId = searchParams.get('encounterId')

  let filtered = notes
  if (patientId) {
    filtered = filtered.filter(n => n.patientId === patientId)
  }
  if (encounterId) {
    filtered = filtered.filter(n => n.encounterId === encounterId)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newNote: ClinicalNote = {
    id: `N${notes.length + 1}`,
    encounterId: body.encounterId,
    patientId: body.patientId,
    patientName: body.patientName,
    providerId: body.providerId,
    providerName: body.providerName,
    type: body.type,
    title: body.title,
    content: body.content || '',
    subjective: body.subjective,
    objective: body.objective,
    assessment: body.assessment,
    plan: body.plan,
    template: body.template,
    signed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  notes.push(newNote)

  return NextResponse.json(newNote, { status: 201 })
}
