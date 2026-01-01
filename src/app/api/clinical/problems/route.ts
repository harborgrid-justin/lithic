import { NextRequest, NextResponse } from 'next/server'
import { Problem } from '@/types/clinical'

// Mock data
let problems: Problem[] = [
  {
    id: '1',
    patientId: 'P001',
    icd10Code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    status: 'chronic',
    severity: 'moderate',
    onsetDate: '2020-05-15',
    notes: 'Well controlled with metformin',
    createdAt: '2020-05-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')

  let filtered = problems
  if (patientId) {
    filtered = problems.filter(p => p.patientId === patientId)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newProblem: Problem = {
    id: `PR${problems.length + 1}`,
    patientId: body.patientId,
    icd10Code: body.icd10Code,
    description: body.description,
    status: body.status || 'active',
    severity: body.severity,
    onsetDate: body.onsetDate,
    resolvedDate: body.resolvedDate,
    notes: body.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  problems.push(newProblem)

  return NextResponse.json(newProblem, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  const index = problems.findIndex(p => p.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
  }

  problems[index] = {
    ...problems[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json(problems[index])
}
