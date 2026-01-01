"use client";

import { useState } from "react";
import { ImageAnnotation } from "@/services/imaging.service";

interface ImageAnnotationsProps {
  studyId: string;
  seriesId: string;
  instanceId: string;
  onAnnotationComplete?: (annotation: ImageAnnotation) => void;
}

export default function ImageAnnotations({
  studyId,
  seriesId,
  instanceId,
  onAnnotationComplete,
}: ImageAnnotationsProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);
  const [selectedColor, setSelectedColor] = useState("#FF0000");

  const tools = [
    { id: "ARROW", name: "Arrow", icon: "➜" },
    { id: "RECTANGLE", name: "Rectangle", icon: "▭" },
    { id: "CIRCLE", name: "Circle", icon: "○" },
    { id: "POLYGON", name: "Polygon", icon: "⬠" },
    { id: "TEXT", name: "Text", icon: "T" },
  ];

  const colors = [
    { name: "Red", value: "#FF0000" },
    { name: "Yellow", value: "#FFFF00" },
    { name: "Green", value: "#00FF00" },
    { name: "Blue", value: "#0000FF" },
    { name: "White", value: "#FFFFFF" },
    { name: "Orange", value: "#FFA500" },
  ];

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("Clear all annotations?")) {
      setAnnotations([]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Annotations</h3>

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
          >
            <div className="text-2xl mb-1">{tool.icon}</div>
            <div className="text-xs font-medium">{tool.name}</div>
          </button>
        ))}
      </div>

      {/* Color Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <div className="flex space-x-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              className={`w-8 h-8 rounded-full border-2 ${
                selectedColor === color.value
                  ? "border-gray-800 scale-110"
                  : "border-gray-300"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Active Tool Info */}
      {activeTool && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">
              {tools.find((t) => t.id === activeTool)?.name}
            </span>{" "}
            tool active. Click on the image to annotate.
          </p>
        </div>
      )}

      {/* Annotations List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">
            Annotations ({annotations.length})
          </h4>
          {annotations.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          )}
        </div>

        {annotations.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            No annotations yet
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {annotations.map((annotation, index) => (
              <div
                key={annotation.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <div>
                    <div className="text-xs font-medium text-gray-600">
                      {annotation.type}
                    </div>
                    {annotation.text && (
                      <div className="text-sm mt-1">{annotation.text}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      by {annotation.author}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAnnotation(annotation.id)}
                  className="text-red-600 hover:text-red-800 text-xs ml-2"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
