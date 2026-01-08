/**
 * Dashboard Builder Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, Eye } from 'lucide-react';

interface Widget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function DashboardBuilder({ className = '' }: { className?: string }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const addWidget = (type: string) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type} Widget`,
      x: 0,
      y: widgets.length * 200,
      width: 400,
      height: 200,
    };
    setWidgets([...widgets, newWidget]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Builder</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Dashboard
          </Button>
        </div>
      </div>

      {!previewMode && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Add Widgets</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => addWidget('chart')}>
              <Plus className="h-4 w-4 mr-1" /> Chart
            </Button>
            <Button size="sm" variant="outline" onClick={() => addWidget('table')}>
              <Plus className="h-4 w-4 mr-1" /> Table
            </Button>
            <Button size="sm" variant="outline" onClick={() => addWidget('metric')}>
              <Plus className="h-4 w-4 mr-1" /> Metric
            </Button>
            <Button size="sm" variant="outline" onClick={() => addWidget('list')}>
              <Plus className="h-4 w-4 mr-1" /> List
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {widgets.map((widget) => (
          <Card key={widget.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{widget.title}</h4>
              {!previewMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWidgets(widgets.filter((w) => w.id !== widget.id))}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="h-40 bg-gray-50 rounded flex items-center justify-center text-muted-foreground">
              {widget.type} widget content
            </div>
          </Card>
        ))}

        {widgets.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            No widgets added yet. Add widgets using the buttons above.
          </Card>
        )}
      </div>
    </div>
  );
}
