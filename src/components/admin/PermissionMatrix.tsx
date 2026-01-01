'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PermissionMatrix() {
  const [matrix, setMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();

      if (data.success) {
        setMatrix(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch permissions');
      }
    } catch (error) {
      toast.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: any, resource: string, action: string): boolean => {
    return role.permissions?.some(
      (p: any) =>
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === '*' || p.action === 'admin')
    ) || false;
  };

  if (loading) {
    return <div className="text-center py-8">Loading permission matrix...</div>;
  }

  if (!matrix) {
    return <div className="text-center py-8">No permissions found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Users</TableHead>
                {matrix.resources?.slice(0, 5).map((resource: string) => (
                  <TableHead key={resource} className="text-center">
                    {resource}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.roles?.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.userCount}</Badge>
                  </TableCell>
                  {matrix.resources?.slice(0, 5).map((resource: string) => (
                    <TableCell key={resource} className="text-center">
                      {hasPermission(role, resource, 'read') ? (
                        <Check className="h-4 w-4 text-green-600 inline" />
                      ) : (
                        <X className="h-4 w-4 text-gray-300 inline" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
