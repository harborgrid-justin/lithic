import {
  ClinicalNote,
  VitalSigns,
  Problem,
  Allergy,
  Medication,
  Order,
  NoteTemplate,
  ICD10Code,
  CPTCode,
} from '@/types/clinical'

const API_BASE = '/api/clinical'

// Clinical Notes
export async function getClinicalNotes(patientId?: string): Promise<ClinicalNote[]> {
  const url = patientId ? `${API_BASE}/notes?patientId=${patientId}` : `${API_BASE}/notes`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch clinical notes')
  return response.json()
}

export async function getClinicalNote(id: string): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE}/notes/${id}`)
  if (!response.ok) throw new Error('Failed to fetch clinical note')
  return response.json()
}

export async function createClinicalNote(note: Partial<ClinicalNote>): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  })
  if (!response.ok) throw new Error('Failed to create clinical note')
  return response.json()
}

export async function updateClinicalNote(id: string, note: Partial<ClinicalNote>): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  })
  if (!response.ok) throw new Error('Failed to update clinical note')
  return response.json()
}

export async function signClinicalNote(id: string, signature: string): Promise<ClinicalNote> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signed: true, signature, signedAt: new Date().toISOString() }),
  })
  if (!response.ok) throw new Error('Failed to sign clinical note')
  return response.json()
}

// Vitals
export async function getVitals(patientId: string): Promise<VitalSigns[]> {
  const response = await fetch(`${API_BASE}/vitals?patientId=${patientId}`)
  if (!response.ok) throw new Error('Failed to fetch vitals')
  return response.json()
}

export async function createVitals(vitals: Partial<VitalSigns>): Promise<VitalSigns> {
  const response = await fetch(`${API_BASE}/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vitals),
  })
  if (!response.ok) throw new Error('Failed to create vitals')
  return response.json()
}

// Problems
export async function getProblems(patientId: string): Promise<Problem[]> {
  const response = await fetch(`${API_BASE}/problems?patientId=${patientId}`)
  if (!response.ok) throw new Error('Failed to fetch problems')
  return response.json()
}

export async function createProblem(problem: Partial<Problem>): Promise<Problem> {
  const response = await fetch(`${API_BASE}/problems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(problem),
  })
  if (!response.ok) throw new Error('Failed to create problem')
  return response.json()
}

export async function updateProblem(id: string, problem: Partial<Problem>): Promise<Problem> {
  const response = await fetch(`${API_BASE}/problems/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(problem),
  })
  if (!response.ok) throw new Error('Failed to update problem')
  return response.json()
}

// Allergies
export async function getAllergies(patientId: string): Promise<Allergy[]> {
  const response = await fetch(`${API_BASE}/allergies?patientId=${patientId}`)
  if (!response.ok) throw new Error('Failed to fetch allergies')
  return response.json()
}

export async function createAllergy(allergy: Partial<Allergy>): Promise<Allergy> {
  const response = await fetch(`${API_BASE}/allergies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(allergy),
  })
  if (!response.ok) throw new Error('Failed to create allergy')
  return response.json()
}

export async function updateAllergy(id: string, allergy: Partial<Allergy>): Promise<Allergy> {
  const response = await fetch(`${API_BASE}/allergies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(allergy),
  })
  if (!response.ok) throw new Error('Failed to update allergy')
  return response.json()
}

// Medications
export async function getMedications(patientId: string): Promise<Medication[]> {
  const response = await fetch(`${API_BASE}/medications?patientId=${patientId}`)
  if (!response.ok) throw new Error('Failed to fetch medications')
  return response.json()
}

export async function createMedication(medication: Partial<Medication>): Promise<Medication> {
  const response = await fetch(`${API_BASE}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medication),
  })
  if (!response.ok) throw new Error('Failed to create medication')
  return response.json()
}

export async function updateMedication(id: string, medication: Partial<Medication>): Promise<Medication> {
  const response = await fetch(`${API_BASE}/medications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medication),
  })
  if (!response.ok) throw new Error('Failed to update medication')
  return response.json()
}

// Orders
export async function getOrders(patientId?: string): Promise<Order[]> {
  const url = patientId ? `${API_BASE}/orders?patientId=${patientId}` : `${API_BASE}/orders`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch orders')
  return response.json()
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  if (!response.ok) throw new Error('Failed to create order')
  return response.json()
}

export async function updateOrder(id: string, order: Partial<Order>): Promise<Order> {
  const response = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  if (!response.ok) throw new Error('Failed to update order')
  return response.json()
}

// ICD-10 Codes
export async function searchICD10Codes(query: string): Promise<ICD10Code[]> {
  const response = await fetch(`${API_BASE}/icd10?q=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('Failed to search ICD-10 codes')
  return response.json()
}

// CPT Codes
export async function searchCPTCodes(query: string): Promise<CPTCode[]> {
  const response = await fetch(`${API_BASE}/cpt?q=${encodeURIComponent(query)}`)
  if (!response.ok) throw new Error('Failed to search CPT codes')
  return response.json()
}

// Note Templates
export async function getNoteTemplates(): Promise<NoteTemplate[]> {
  const response = await fetch(`${API_BASE}/templates`)
  if (!response.ok) throw new Error('Failed to fetch note templates')
  return response.json()
}

export async function getNoteTemplate(id: string): Promise<NoteTemplate> {
  const response = await fetch(`${API_BASE}/templates/${id}`)
  if (!response.ok) throw new Error('Failed to fetch note template')
  return response.json()
}
