'use client'

import { Problem } from '@/types/clinical'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle } from 'lucide-react'

interface ProblemListProps {
  problems: Problem[]
  onAdd?: () => void
  onEdit?: (problem: Problem) => void
}

export function ProblemList({ problems, onAdd, onEdit }: ProblemListProps) {
  const getStatusColor = (status: Problem['status']) => {
    const colors = {
      active: 'danger',
      resolved: 'success',
      chronic: 'warning',
      inactive: 'secondary',
    }
    return colors[status] as 'danger' | 'success' | 'warning' | 'secondary'
  }

  const getSeverityColor = (severity: Problem['severity']) => {
    const colors = {
      mild: 'info',
      moderate: 'warning',
      severe: 'danger',
    }
    return colors[severity] as 'info' | 'warning' | 'danger'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Problem List
          </CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              Add Problem
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ICD-10</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Onset Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {problem.icd10Code}
                  </code>
                </TableCell>
                <TableCell className="font-medium">{problem.description}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(problem.status)}>
                    {problem.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityColor(problem.severity)}>
                    {problem.severity}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(problem.onsetDate)}</TableCell>
                <TableCell>
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(problem)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {problems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No problems recorded
          </div>
        )}
      </CardContent>
    </Card>
  )
}
