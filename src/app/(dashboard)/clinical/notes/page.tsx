'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClinicalNote } from '@/types/clinical'
import { getClinicalNotes } from '@/services/clinical.service'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, FileCheck } from 'lucide-react'
import Link from 'next/link'

export default function ClinicalNotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<ClinicalNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const data = await getClinicalNotes()
      setNotes(data)
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: ClinicalNote['type']) => {
    const labels = {
      soap: 'SOAP',
      progress: 'Progress',
      admission: 'Admission',
      discharge: 'Discharge',
      procedure: 'Procedure',
      consultation: 'Consultation',
    }
    return labels[type]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Notes</h1>
            <p className="text-gray-600 mt-1">SOAP notes, progress notes, and clinical documentation</p>
          </div>
          <Button onClick={() => router.push('/clinical/notes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Clinical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{formatDateTime(note.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getTypeLabel(note.type)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{note.title}</TableCell>
                    <TableCell>{note.patientName}</TableCell>
                    <TableCell>{note.providerName}</TableCell>
                    <TableCell>
                      {note.signed ? (
                        <Badge variant="success">
                          <FileCheck className="h-3 w-3 mr-1" />
                          Signed
                        </Badge>
                      ) : (
                        <Badge variant="warning">Unsigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/clinical/notes/${note.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {notes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No clinical notes found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
