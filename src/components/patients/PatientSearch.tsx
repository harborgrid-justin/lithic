"use client"

import { useState } from 'react';
import { Patient, PatientSearchParams } from '@/types/patient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X } from 'lucide-react';

interface PatientSearchProps {
  onSearch: (params: PatientSearchParams) => void;
  onReset?: () => void;
}

export function PatientSearch({ onSearch, onReset }: PatientSearchProps) {
  const [params, setParams] = useState<PatientSearchParams>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    mrn: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty values
    const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value) {
        acc[key as keyof PatientSearchParams] = value;
      }
      return acc;
    }, {} as PatientSearchParams);
    
    onSearch(filteredParams);
  };

  const handleReset = () => {
    setParams({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      mrn: '',
    });
    onReset?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Advanced Search</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <Input
                value={params.firstName}
                onChange={(e) => setParams({ ...params, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <Input
                value={params.lastName}
                onChange={(e) => setParams({ ...params, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <Input
                type="date"
                value={params.dateOfBirth}
                onChange={(e) => setParams({ ...params, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MRN
              </label>
              <Input
                value={params.mrn}
                onChange={(e) => setParams({ ...params, mrn: e.target.value })}
                placeholder="Enter MRN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                value={params.phone}
                onChange={(e) => setParams({ ...params, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={params.email}
                onChange={(e) => setParams({ ...params, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
