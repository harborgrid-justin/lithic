"use client";

import { useState } from "react";
import { Series, Instance } from "@/services/imaging.service";

interface ImageThumbnailsProps {
  series: Series[];
  selectedInstanceId?: string;
  onSelectInstance?: (instance: Instance, series: Series) => void;
}

export default function ImageThumbnails({
  series,
  selectedInstanceId,
  onSelectInstance,
}: ImageThumbnailsProps) {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    series.length > 0 ? series[0].id : null,
  );

  const currentSeries =
    series.find((s) => s.id === selectedSeriesId) || series[0];

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Series Selector */}
      <div className="p-2 border-b border-gray-700">
        <select
          value={selectedSeriesId || ""}
          onChange={(e) => setSelectedSeriesId(e.target.value)}
          className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
        >
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              Series {s.seriesNumber}: {s.seriesDescription} (
              {s.numberOfInstances} images)
            </option>
          ))}
        </select>
      </div>

      {/* Thumbnails Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-2 gap-2">
          {currentSeries?.instances.map((instance) => (
            <div
              key={instance.id}
              className={`cursor-pointer border-2 rounded overflow-hidden transition-all ${
                selectedInstanceId === instance.id
                  ? "border-blue-500 shadow-lg"
                  : "border-gray-600 hover:border-gray-400"
              }`}
              onClick={() => onSelectInstance?.(instance, currentSeries)}
            >
              <div className="aspect-square bg-gray-900 flex items-center justify-center">
                {instance.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={instance.thumbnailUrl}
                    alt={`Instance ${instance.instanceNumber}`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-500 text-xs text-center">
                    <div className="text-2xl mb-1">📷</div>
                    <div>Image {instance.instanceNumber}</div>
                  </div>
                )}
              </div>
              <div className="bg-gray-700 text-white text-xs p-1 text-center">
                {instance.instanceNumber}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Series Info */}
      {currentSeries && (
        <div className="p-2 border-t border-gray-700 text-white text-xs">
          <div>Series: {currentSeries.seriesNumber}</div>
          <div>{currentSeries.seriesDescription}</div>
          <div>{currentSeries.numberOfInstances} images</div>
        </div>
      )}
    </div>
  );
}
