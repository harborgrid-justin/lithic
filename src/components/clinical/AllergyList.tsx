'use client'

import { Allergy } from '@/types/clinical'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle } from 'lucide-react'

interface AllergyListProps {
  allergies: Allergy[]
  onAdd?: () => void
  onEdit?: (allergy: Allergy) => void
}

export function AllergyList({ allergies, onAdd, onEdit }: AllergyListProps) {
  const getTypeColor = (type: Allergy['type']) => {
    const colors = {
      medication: 'danger',
      food: 'warning',
      environmental: 'info',
      other: 'secondary',
    }
    return colors[type] as 'danger' | 'warning' | 'info' | 'secondary'
  }

  const getSeverityColor = (severity: Allergy['severity']) => {
    const colors = {
      mild: 'info',
      moderate: 'warning',
      severe: 'danger',
      'life-threatening': 'danger',
    }
    return colors[severity] as 'info' | 'warning' | 'danger'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Allergies
          </CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              Add Allergy
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {allergies.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Allergen</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reaction</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Onset Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allergies.map((allergy) => (
                <TableRow key={allergy.id}>
                  <TableCell className="font-medium">{allergy.allergen}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(allergy.type)}>
                      {allergy.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{allergy.reaction}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityColor(allergy.severity)}>
                      {allergy.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {allergy.onsetDate ? formatDate(allergy.onsetDate) : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(allergy)}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-green-600">No Known Allergies</p>
            <p className="text-sm text-gray-500 mt-1">Patient has no recorded allergies</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
