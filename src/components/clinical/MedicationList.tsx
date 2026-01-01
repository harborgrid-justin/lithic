'use client'

import { Medication } from '@/types/clinical'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pill } from 'lucide-react'

interface MedicationListProps {
  medications: Medication[]
  onAdd?: () => void
  onEdit?: (medication: Medication) => void
}

export function MedicationList({ medications, onAdd, onEdit }: MedicationListProps) {
  const getStatusColor = (status: Medication['status']) => {
    const colors = {
      active: 'success',
      discontinued: 'danger',
      completed: 'secondary',
    }
    return colors[status] as 'success' | 'danger' | 'secondary'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medications
          </CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              Add Medication
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Prescriber</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medications.map((medication) => (
              <TableRow key={medication.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{medication.name}</p>
                    {medication.genericName && (
                      <p className="text-xs text-gray-500">{medication.genericName}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{medication.dosage}</TableCell>
                <TableCell className="capitalize">{medication.route}</TableCell>
                <TableCell>{medication.frequency}</TableCell>
                <TableCell>{medication.prescriberName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(medication.status)}>
                    {medication.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(medication)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {medications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No medications recorded
          </div>
        )}
      </CardContent>
    </Card>
  )
}
