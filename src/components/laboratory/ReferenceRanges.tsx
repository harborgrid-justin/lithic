'use client';

import React, { useEffect, useState } from 'react';
import { ReferenceRange } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Search } from 'lucide-react';
import { REFERENCE_RANGES } from '@/lib/reference-ranges';

export default function ReferenceRanges() {
  const [ranges, setRanges] = useState<ReferenceRange[]>(REFERENCE_RANGES);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchTerm) {
      const filtered = REFERENCE_RANGES.filter(
        (range) =>
          range.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          range.loincCode.includes(searchTerm)
      );
      setRanges(filtered);
    } else {
      setRanges(REFERENCE_RANGES);
    }
  }, [searchTerm]);

  const formatRange = (range: ReferenceRange) => {
    const parts = [];
    if (range.low !== undefined && range.high !== undefined) {
      parts.push(`${range.low}-${range.high}`);
    } else if (range.low !== undefined) {
      parts.push(`>${range.low}`);
    } else if (range.high !== undefined) {
      parts.push(`<${range.high}`);
    }
    return parts.length > 0 ? `${parts[0]} ${range.unit}` : 'See text';
  };

  const formatCritical = (range: ReferenceRange) => {
    const parts = [];
    if (range.criticalLow !== undefined) {
      parts.push(`Low: <${range.criticalLow}`);
    }
    if (range.criticalHigh !== undefined) {
      parts.push(`High: >${range.criticalHigh}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Reference Ranges
        </CardTitle>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by test name or LOINC code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Name</TableHead>
              <TableHead>LOINC Code</TableHead>
              <TableHead>Reference Range</TableHead>
              <TableHead>Critical Values</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age Range</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No reference ranges found
                </TableCell>
              </TableRow>
            ) : (
              ranges.map((range) => (
                <TableRow key={range.id}>
                  <TableCell className="font-medium">{range.testName}</TableCell>
                  <TableCell className="font-mono text-xs">{range.loincCode}</TableCell>
                  <TableCell>{formatRange(range)}</TableCell>
                  <TableCell className="text-sm">
                    <span className="text-destructive">{formatCritical(range)}</span>
                  </TableCell>
                  <TableCell>
                    {range.gender ? (
                      <Badge variant="outline">
                        {range.gender === 'M' ? 'Male' : 'Female'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">All</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {range.ageMin || range.ageMax ? (
                      <span>
                        {range.ageMin || '0'}-{range.ageMax || '∞'} years
                      </span>
                    ) : (
                      <span className="text-muted-foreground">All ages</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">
                    {range.text || range.condition || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
