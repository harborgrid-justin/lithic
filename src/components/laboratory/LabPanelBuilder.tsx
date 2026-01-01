'use client';

import React, { useState } from 'react';
import { LabPanel } from '@/types/laboratory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, X } from 'lucide-react';
import { COMMON_LOINC_CODES } from '@/lib/loinc-codes';
import LaboratoryService from '@/services/laboratory.service';

interface LabPanelBuilderProps {
  panel?: LabPanel;
  onSuccess?: (panel: LabPanel) => void;
  onCancel?: () => void;
}

export default function LabPanelBuilder({ panel, onSuccess, onCancel }: LabPanelBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: panel?.code || '',
    name: panel?.name || '',
    description: panel?.description || '',
    category: panel?.category || '',
    tests: panel?.tests || [],
  });

  const availableTests = Object.entries(COMMON_LOINC_CODES).map(([key, test]) => ({
    code: test.code,
    name: test.display,
    key,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newPanel = await LaboratoryService.createPanel({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tests: formData.tests,
        isActive: true,
      });

      onSuccess?.(newPanel);
    } catch (error) {
      console.error('Failed to create panel:', error);
      alert('Failed to create panel');
    } finally {
      setLoading(false);
    }
  };

  const addTest = (testCode: string) => {
    if (!formData.tests.includes(testCode)) {
      setFormData({ ...formData, tests: [...formData.tests, testCode] });
    }
  };

  const removeTest = (testCode: string) => {
    setFormData({ ...formData, tests: formData.tests.filter(t => t !== testCode) });
  };

  const selectedTests = availableTests.filter(t => formData.tests.includes(t.code));
  const unselectedTests = availableTests.filter(t => !formData.tests.includes(t.code));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {panel ? 'Edit Panel' : 'Create New Panel'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Panel Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., CBC, BMP"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Hematology, Chemistry"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Panel Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Complete Blood Count"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter panel description"
            />
          </div>

          <div className="space-y-3">
            <Label>Selected Tests ({formData.tests.length})</Label>
            <div className="border rounded-md p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
              {selectedTests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tests selected. Add tests from the list below.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedTests.map((test) => (
                    <Badge key={test.code} variant="default" className="gap-2">
                      {test.name}
                      <button
                        type="button"
                        onClick={() => removeTest(test.code)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Available Tests</Label>
            <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto">
              <div className="space-y-2">
                {unselectedTests.map((test) => (
                  <div
                    key={test.code}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => addTest(test.code)}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{test.name}</div>
                      <div className="text-xs text-muted-foreground">LOINC: {test.code}</div>
                    </div>
                    <Button type="button" size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading || formData.tests.length === 0}>
              {loading ? 'Saving...' : panel ? 'Update Panel' : 'Create Panel'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
