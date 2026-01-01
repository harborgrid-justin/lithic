"use client";

import { useState } from "react";
import { Measurement } from "@/services/imaging.service";
import { dicomService } from "@/services/dicom.service";

interface MeasurementToolsProps {
  studyId: string;
  seriesId: string;
  instanceId: string;
  pixelSpacing?: number[];
  onMeasurementComplete?: (measurement: Measurement) => void;
}

export default function MeasurementTools({
  studyId,
  seriesId,
  instanceId,
  pixelSpacing,
  onMeasurementComplete,
}: MeasurementToolsProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const tools = [
    {
      id: "LENGTH",
      name: "Length",
      icon: "📏",
      description: "Measure distance",
    },
    { id: "AREA", name: "Area", icon: "▭", description: "Measure area" },
    { id: "ANGLE", name: "Angle", icon: "∠", description: "Measure angle" },
    { id: "HU", name: "HU", icon: "HU", description: "Hounsfield Units (CT)" },
    {
      id: "SUV",
      name: "SUV",
      icon: "SUV",
      description: "Standardized Uptake Value (PET)",
    },
  ];

  const formatMeasurement = (measurement: Measurement) => {
    const units: { [key: string]: string } = {
      LENGTH: pixelSpacing ? "mm" : "px",
      AREA: pixelSpacing ? "mm²" : "px²",
      ANGLE: "°",
      HU: "HU",
      SUV: "g/mL",
    };

    return `${measurement.value.toFixed(2)} ${units[measurement.type] || measurement.unit}`;
  };

  const handleDeleteMeasurement = (id: string) => {
    setMeasurements(measurements.filter((m) => m.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("Clear all measurements?")) {
      setMeasurements([]);
    }
  };

  const handleExport = () => {
    const data = measurements.map((m) => ({
      type: m.type,
      value: m.value,
      unit: m.unit,
      label: m.label,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurements-${studyId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Measurement Tools</h3>

      {/* Tool Selection */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() =>
              setActiveTool(activeTool === tool.id ? null : tool.id)
            }
            className={`p-3 rounded-lg border-2 transition-all ${
              activeTool === tool.id
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
            title={tool.description}
          >
            <div className="text-2xl mb-1">{tool.icon}</div>
            <div className="text-xs font-medium">{tool.name}</div>
          </button>
        ))}
      </div>

      {/* Active Tool Info */}
      {activeTool && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">
              {tools.find((t) => t.id === activeTool)?.name}:
            </span>{" "}
            {tools.find((t) => t.id === activeTool)?.description}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Click on the image to start measuring
          </p>
        </div>
      )}

      {/* Measurements List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">
            Measurements ({measurements.length})
          </h4>
          {measurements.length > 0 && (
            <div className="space-x-2">
              <button
                onClick={handleExport}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Export
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {measurements.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            No measurements yet
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {measurements.map((measurement, index) => (
              <div
                key={measurement.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-600">
                      {measurement.type}
                    </span>
                    {measurement.label && (
                      <span className="text-xs text-gray-500">
                        ({measurement.label})
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold mt-1">
                    {formatMeasurement(measurement)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMeasurement(measurement.id)}
                  className="text-red-600 hover:text-red-800 text-xs ml-2"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pixel Spacing Info */}
      {pixelSpacing && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            Pixel Spacing: {pixelSpacing[0]} × {pixelSpacing[1]} mm
          </div>
        </div>
      )}
    </div>
  );
}
