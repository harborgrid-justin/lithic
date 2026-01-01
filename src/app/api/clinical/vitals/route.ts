import { NextRequest, NextResponse } from 'next/server'
import { VitalSigns } from '@/types/clinical'

// Mock data
let vitals: VitalSigns[] = [
  {
    id: '1',
    patientId: 'P001',
    recordedAt: '2024-01-15T10:00:00Z',
    recordedBy: 'Nurse Johnson',
    temperature: 98.6,
    temperatureUnit: 'F',
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    weight: 170,
    weightUnit: 'lbs',
    height: 70,
    heightUnit: 'in',
    bmi: 24.4,
    painLevel: 0,
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')

  let filtered = vitals
  if (patientId) {
    filtered = vitals.filter(v => v.patientId === patientId)
  }

  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Calculate BMI if height and weight provided
  let bmi: number | undefined
  if (body.height && body.weight) {
    const heightInMeters = body.heightUnit === 'cm'
      ? body.height / 100
      : body.height * 0.0254
    const weightInKg = body.weightUnit === 'kg'
      ? body.weight
      : body.weight * 0.453592
    bmi = Number((weightInKg / (heightInMeters * heightInMeters)).toFixed(1))
  }

  const newVitals: VitalSigns = {
    id: `V${vitals.length + 1}`,
    patientId: body.patientId,
    encounterId: body.encounterId,
    recordedAt: body.recordedAt || new Date().toISOString(),
    recordedBy: body.recordedBy,
    temperature: body.temperature,
    temperatureUnit: body.temperatureUnit || 'F',
    bloodPressureSystolic: body.bloodPressureSystolic,
    bloodPressureDiastolic: body.bloodPressureDiastolic,
    heartRate: body.heartRate,
    respiratoryRate: body.respiratoryRate,
    oxygenSaturation: body.oxygenSaturation,
    weight: body.weight,
    weightUnit: body.weightUnit || 'lbs',
    height: body.height,
    heightUnit: body.heightUnit || 'in',
    bmi: bmi || body.bmi,
    painLevel: body.painLevel,
  }

  vitals.push(newVitals)

  return NextResponse.json(newVitals, { status: 201 })
}
