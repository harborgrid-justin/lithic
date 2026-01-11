/**
 * Widget Palette Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, Table2, TrendingUp, List, PieChart, LineChart } from 'lucide-react';

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const widgetTemplates: WidgetTemplate[] = [
  { id: 'bar-chart', name: 'Bar Chart', description: 'Compare values across categories', icon: <BarChart3 className="h-6 w-6" />, category: 'Charts' },
  { id: 'line-chart', name: 'Line Chart', description: 'Show trends over time', icon: <LineChart className="h-6 w-6" />, category: 'Charts' },
  { id: 'pie-chart', name: 'Pie Chart', description: 'Show proportions', icon: <PieChart className="h-6 w-6" />, category: 'Charts' },
  { id: 'data-table', name: 'Data Table', description: 'Display tabular data', icon: <Table2 className="h-6 w-6" />, category: 'Data' },
  { id: 'metric', name: 'Metric Card', description: 'Display key metrics', icon: <TrendingUp className="h-6 w-6" />, category: 'Metrics' },
  { id: 'list', name: 'List View', description: 'Show items in a list', icon: <List className="h-6 w-6" />, category: 'Data' },
];

interface WidgetPaletteProps {
  onWidgetSelect?: (widgetId: string) => void;
  className?: string;
}

export function WidgetPalette({ onWidgetSelect, className = '' }: WidgetPaletteProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="font-semibold mb-4">Widget Palette</h3>

      <div className="space-y-4">
        {['Charts', 'Data', 'Metrics'].map((category) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
            <div className="grid grid-cols-2 gap-2">
              {widgetTemplates
                .filter((w) => w.category === category)
                .map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => onWidgetSelect?.(widget.id)}
                    className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    {widget.icon}
                    <div className="w-full">
                      <p className="text-sm font-medium">{widget.name}</p>
                      <p className="text-xs text-muted-foreground">{widget.description}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
