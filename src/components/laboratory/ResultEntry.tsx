'use client';

import React, { useState } from 'react';
import { LabResult, ResultStatus } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Save, Check } from 'lucide-react';
import LaboratoryService from '@/services/laboratory.service';

interface ResultEntryProps {
  orderId: string;
  testName: string;
  loincCode: string;
  onSuccess?: (result: LabResult) => void;
}

export default function ResultEntry({ orderId, testName, loincCode, onSuccess }: ResultEntryProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    value: '',
    unit: '',
    comments: '',
    methodology: '',
    performedBy: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const numericValue = parseFloat(formData.value);
      
      const result = await LaboratoryService.createResult({
        orderId,
        orderNumber: `ORD-${orderId}`,
        patientId: 'PT001',
        patientName: 'Patient Name',
        patientMRN: 'MRN001',
        testId: loincCode,
        testName,
        loincCode,
        value: isNaN(numericValue) ? formData.value : numericValue,
        valueType: isNaN(numericValue) ? 'TEXT' : 'NUMERIC',
        unit: formData.unit,
        flag: 'NORMAL',
        status: 'PRELIMINARY',
        isCritical: false,
        performedBy: formData.performedBy,
        performedAt: new Date(),
        methodology: formData.methodology,
        comments: formData.comments,
      });

      onSuccess?.(result);
      
      // Reset form
      setFormData({
        value: '',
        unit: '',
        comments: '',
        methodology: '',
        performedBy: '',
      });
    } catch (error) {
      console.error('Failed to create result:', error);
      alert('Failed to create result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Result Entry: {testName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="value">Result Value *</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Enter result value"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="e.g., mg/dL, mmol/L"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="performedBy">Performed By *</Label>
            <Input
              id="performedBy"
              value={formData.performedBy}
              onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
              placeholder="Technician ID or name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="methodology">Methodology</Label>
            <Input
              id="methodology"
              value={formData.methodology}
              onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
              placeholder="e.g., Automated analyzer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <textarea
              id="comments"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Enter any comments or observations"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Result'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
