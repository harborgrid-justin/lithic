'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { LabPanel } from '@/types/laboratory';
import LaboratoryService from '@/services/laboratory.service';
import LabPanelBuilder from '@/components/laboratory/LabPanelBuilder';

export default function PanelsPage() {
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPanels();
  }, []);

  const loadPanels = async () => {
    try {
      setLoading(true);
      const data = await LaboratoryService.getPanels();
      setPanels(data);
    } catch (error) {
      console.error('Failed to load panels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laboratory Test Panels</h1>
          <p className="text-muted-foreground mt-2">
            Manage test panels and configurations
          </p>
        </div>
        <Button onClick={() => setShowBuilder(!showBuilder)}>
          <Plus className="h-4 w-4 mr-2" />
          {showBuilder ? 'Hide' : 'Create'} Panel
        </Button>
      </div>

      {showBuilder && (
        <LabPanelBuilder
          onSuccess={(panel) => {
            loadPanels();
            setShowBuilder(false);
          }}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      {loading ? (
        <div className="flex justify-center p-8">Loading panels...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {panels.map((panel) => (
            <Card key={panel.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{panel.name}</span>
                  <Badge variant="outline">{panel.code}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {panel.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {panel.tests.length} tests
                  </span>
                  <Badge variant="secondary">{panel.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
