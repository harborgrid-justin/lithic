'use client'

import { useRouter } from 'next/navigation'
import { Encounter } from '@/types/clinical'
import { EncounterForm } from '@/components/clinical/EncounterForm'
import { createEncounter } from '@/services/encounter.service'

export default function NewEncounterPage() {
  const router = useRouter()

  const handleSubmit = async (data: Partial<Encounter>) => {
    try {
      await createEncounter(data)
      router.push('/clinical/encounters')
    } catch (error) {
      console.error('Failed to create encounter:', error)
      alert('Failed to create encounter. Please try again.')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Encounter</h1>
          <p className="text-gray-600 mt-1">Create a new patient encounter</p>
        </div>

        <EncounterForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  )
}
