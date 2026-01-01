'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Encounter } from '@/types/clinical'
import { EncounterList } from '@/components/clinical/EncounterList'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function EncountersPage() {
  const router = useRouter()
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEncounters()
  }, [])

  const loadEncounters = async () => {
    try {
      const response = await fetch('/api/clinical/encounters')
      const data = await response.json()
      setEncounters(data)
    } catch (error) {
      console.error('Failed to load encounters:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading encounters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Encounters</h1>
            <p className="text-gray-600 mt-1">Manage patient visits and consultations</p>
          </div>
          <Button onClick={() => router.push('/clinical/encounters/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Encounter
          </Button>
        </div>

        <EncounterList encounters={encounters} />
      </div>
    </div>
  )
}
