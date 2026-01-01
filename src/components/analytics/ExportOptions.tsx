'use client';

import { useState } from 'react';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { ExportOptions as ExportOptionsType } from '@/services/reporting.service';

interface ExportOptionsProps {
  onExport: (options: ExportOptionsType) => void;
  loading?: boolean;
  className?: string;
}

export function ExportOptions({ onExport, loading = false, className = '' }: ExportOptionsProps) {
  const [format, setFormat] = useState<ExportOptionsType['format']>('pdf');
  const [orientation, setOrientation] = useState<ExportOptionsType['orientation']>('portrait');
  const [pageSize, setPageSize] = useState<ExportOptionsType['pageSize']>('letter');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = () => {
    const options: ExportOptionsType = {
      format,
      orientation: format === 'pdf' ? orientation : undefined,
      pageSize: format === 'pdf' ? pageSize : undefined,
      includeCharts,
      includeSummary,
      includeRawData,
    };

    onExport(options);
  };

  const formatOptions = [
    { id: 'pdf', label: 'PDF', icon: <FileText className="w-5 h-5" />, description: 'Portable Document Format' },
    { id: 'excel', label: 'Excel', icon: <FileSpreadsheet className="w-5 h-5" />, description: 'Microsoft Excel Workbook' },
    { id: 'csv', label: 'CSV', icon: <Table className="w-5 h-5" />, description: 'Comma-Separated Values' },
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
      </div>

      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 gap-2">
            {formatOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFormat(option.id as ExportOptionsType['format'])}
                className={`flex items-start gap-3 p-3 border-2 rounded-lg transition-all text-left ${
                  format === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`flex-shrink-0 ${format === option.id ? 'text-blue-600' : 'text-gray-400'}`}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
                <div className="flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      format === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {format === option.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PDF-specific options */}
        {format === 'pdf' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                    orientation === 'portrait'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                    orientation === 'landscape'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as ExportOptionsType['pageSize'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="letter">Letter (8.5&quot; × 11&quot;)</option>
                <option value="legal">Legal (8.5&quot; × 14&quot;)</option>
                <option value="a4">A4 (210mm × 297mm)</option>
                <option value="tabloid">Tabloid (11&quot; × 17&quot;)</option>
              </select>
            </div>
          </>
        )}

        {/* Include Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Include in Export
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Charts and visualizations</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Summary statistics</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRawData}
                onChange={(e) => setIncludeRawData(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Raw data table</span>
            </label>
          </div>
        </div>

        {/* Advanced Options (collapsed by default) */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
          {showAdvanced && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
              <p className="text-xs text-gray-600">
                Advanced export options will be available in the full version
              </p>
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export {format.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
