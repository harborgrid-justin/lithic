'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Encounter } from '@/types/clinical'
import { getEncounter, updateEncounter, completeEncounter } from '@/services/encounter.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, CheckCircle, Edit } from 'lucide-react'

export default function EncounterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadEncounter(params.id as string)
    }
  }, [params.id])

  const loadEncounter = async (id: string) => {
    try {
      const data = await getEncounter(id)
      setEncounter(data)
    } catch (error) {
      console.error('Failed to load encounter:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!encounter) return
    try {
      const updated = await completeEncounter(encounter.id)
      setEncounter(updated)
    } catch (error) {
      console.error('Failed to complete encounter:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <p>Loading encounter...</p>
        </div>
      </div>
    )
  }

  if (!encounter) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <p>Encounter not found</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: Encounter['status']) => {
    const colors = {
      scheduled: 'info',
      'in-progress': 'warning',
      completed: 'success',
      cancelled: 'danger',
    }
    return colors[status] as 'info' | 'warning' | 'success' | 'danger'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Encounter Details</h1>
              <p className="text-gray-600 mt-1">
                {encounter.patientName} - {formatDateTime(encounter.date)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {encounter.status !== 'completed' && (
              <Button onClick={handleComplete} variant="secondary">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Encounter
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle>Encounter Information</CardTitle>
              <Badge variant={getStatusColor(encounter.status)}>
                {encounter.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-medium">{encounter.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="font-medium">{encounter.providerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{encounter.type.replace('-', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">{formatDateTime(encounter.date)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Chief Complaint</p>
              <p className="font-medium">{encounter.chiefComplaint}</p>
            </div>

            {encounter.diagnosis.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Diagnoses</p>
                <div className="space-y-2">
                  {encounter.diagnosis.map((dx) => (
                    <div key={dx.id} className="flex items-center gap-2">
                      <Badge variant={dx.type === 'primary' ? 'default' : 'secondary'}>
                        {dx.icd10Code}
                      </Badge>
                      <span className="text-sm">{dx.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {encounter.vitals && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Vital Signs</p>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  {encounter.vitals.temperature && (
                    <div>
                      <p className="text-gray-500">Temperature</p>
                      <p className="font-medium">
                        {encounter.vitals.temperature}°{encounter.vitals.temperatureUnit}
                      </p>
                    </div>
                  )}
                  {encounter.vitals.bloodPressureSystolic && (
                    <div>
                      <p className="text-gray-500">BP</p>
                      <p className="font-medium">
                        {encounter.vitals.bloodPressureSystolic}/
                        {encounter.vitals.bloodPressureDiastolic}
                      </p>
                    </div>
                  )}
                  {encounter.vitals.heartRate && (
                    <div>
                      <p className="text-gray-500">Heart Rate</p>
                      <p className="font-medium">{encounter.vitals.heartRate} bpm</p>
                    </div>
                  )}
                  {encounter.vitals.oxygenSaturation && (
                    <div>
                      <p className="text-gray-500">O2 Sat</p>
                      <p className="font-medium">{encounter.vitals.oxygenSaturation}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {encounter.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{encounter.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
