'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS = [
  { id: 'today', label: 'Today', days: 0 },
  { id: 'week', label: 'Last 7 Days', days: 7 },
  { id: 'month', label: 'Last 30 Days', days: 30 },
  { id: 'quarter', label: 'Last 90 Days', days: 90 },
  { id: 'year', label: 'Last Year', days: 365 },
  { id: 'custom', label: 'Custom Range', days: null },
] as const;

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');

  const handlePresetChange = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    if (presetId === 'custom') {
      setShowCustom(true);
      onChange({ ...value, preset: 'custom' });
      return;
    }

    setShowCustom(false);

    const end = new Date();
    const start = new Date();

    if (preset.days === 0) {
      // Today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset.days) {
      start.setDate(start.getDate() - preset.days);
    }

    onChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      preset: presetId as DateRange['preset'],
    });
  };

  const handleCustomDateChange = (field: 'start' | 'end', dateValue: string) => {
    onChange({
      ...value,
      [field]: dateValue,
      preset: 'custom',
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">Date Range</label>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetChange(preset.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value.preset === preset.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {showCustom && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={value.start}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={value.end}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                min={value.start}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Selected Range Display */}
      <div className="text-xs text-gray-500">
        {new Date(value.start).toLocaleDateString()} - {new Date(value.end).toLocaleDateString()}
      </div>
    </div>
  );
}
