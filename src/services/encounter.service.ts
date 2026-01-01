import { Encounter } from '@/types/clinical'

const API_BASE = '/api/clinical'

export async function getEncounters(patientId?: string): Promise<Encounter[]> {
  const url = patientId 
    ? `${API_BASE}/encounters?patientId=${patientId}` 
    : `${API_BASE}/encounters`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch encounters')
  return response.json()
}

export async function getEncounter(id: string): Promise<Encounter> {
  const response = await fetch(`${API_BASE}/encounters/${id}`)
  if (!response.ok) throw new Error('Failed to fetch encounter')
  return response.json()
}

export async function createEncounter(encounter: Partial<Encounter>): Promise<Encounter> {
  const response = await fetch(`${API_BASE}/encounters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encounter),
  })
  if (!response.ok) throw new Error('Failed to create encounter')
  return response.json()
}

export async function updateEncounter(id: string, encounter: Partial<Encounter>): Promise<Encounter> {
  const response = await fetch(`${API_BASE}/encounters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encounter),
  })
  if (!response.ok) throw new Error('Failed to update encounter')
  return response.json()
}

export async function deleteEncounter(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/encounters/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete encounter')
}

export async function completeEncounter(id: string): Promise<Encounter> {
  const response = await fetch(`${API_BASE}/encounters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' }),
  })
  if (!response.ok) throw new Error('Failed to complete encounter')
  return response.json()
}
