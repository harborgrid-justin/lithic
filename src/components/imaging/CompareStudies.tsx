"use client";

import { useState, useEffect } from "react";
import { imagingService, ImagingStudy } from "@/services/imaging.service";
import DicomViewer from "./DicomViewer";

interface CompareStudiesProps {
  studyIds: string[];
}

export default function CompareStudies({ studyIds }: CompareStudiesProps) {
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<"1x2" | "2x1" | "2x2">("1x2");
  const [syncScroll, setSyncScroll] = useState(true);
  const [syncWindowLevel, setSyncWindowLevel] = useState(true);

  useEffect(() => {
    loadStudies();
  }, [studyIds]);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const loadedStudies = await imagingService.compareStudies(studyIds);
      setStudies(loadedStudies);
    } catch (error) {
      console.error("Failed to load studies:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading studies for comparison...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Compare Studies</h2>
        <div className="flex items-center space-x-4">
          {/* Layout Selector */}
          <div className="flex space-x-2">
            <button
              onClick={() => setLayout("1x2")}
              className={`px-3 py-1 rounded ${
                layout === "1x2" ? "bg-blue-600" : "bg-gray-700"
              }`}
              title="Side by Side"
            >
              1×2
            </button>
            <button
              onClick={() => setLayout("2x1")}
              className={`px-3 py-1 rounded ${
                layout === "2x1" ? "bg-blue-600" : "bg-gray-700"
              }`}
              title="Top and Bottom"
            >
              2×1
            </button>
            <button
              onClick={() => setLayout("2x2")}
              className={`px-3 py-1 rounded ${
                layout === "2x2" ? "bg-blue-600" : "bg-gray-700"
              }`}
              title="Quad View"
            >
              2×2
            </button>
          </div>

          {/* Sync Options */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Sync Scroll</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={syncWindowLevel}
                onChange={(e) => setSyncWindowLevel(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Sync W/L</span>
            </label>
          </div>
        </div>
      </div>

      {/* Study Info Bar */}
      <div className="bg-gray-800 text-white p-2 border-t border-gray-700">
        <div
          className={`grid ${layout === "2x2" ? "grid-cols-4" : "grid-cols-2"} gap-4 text-xs`}
        >
          {studies.map((study, index) => (
            <div key={study.id} className="space-y-1">
              <div className="font-semibold">Study {index + 1}</div>
              <div>
                {study.patientName} - {study.studyDescription}
              </div>
              <div>{new Date(study.studyDate).toLocaleDateString()}</div>
              <div>
                {study.modality} - {study.numberOfSeries} series
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viewport Grid */}
      <div
        className={`flex-1 grid gap-1 p-1 ${
          layout === "1x2"
            ? "grid-cols-2 grid-rows-1"
            : layout === "2x1"
              ? "grid-cols-1 grid-rows-2"
              : "grid-cols-2 grid-rows-2"
        }`}
      >
        {studies.slice(0, layout === "2x2" ? 4 : 2).map((study, index) => (
          <div key={study.id} className="bg-gray-900 rounded overflow-hidden">
            {study.seriesList.length > 0 &&
              study.seriesList[0].instances.length > 0 && (
                <DicomViewer
                  studyInstanceUID={study.studyInstanceUID}
                  seriesInstanceUID={study.seriesList[0].seriesInstanceUID}
                  sopInstanceUID={
                    study.seriesList[0].instances[0].sopInstanceUID
                  }
                />
              )}
          </div>
        ))}

        {/* Empty viewports for 2x2 layout if less than 4 studies */}
        {layout === "2x2" &&
          Array.from({ length: Math.max(0, 4 - studies.length) }).map(
            (_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-gray-900 rounded flex items-center justify-center text-gray-500"
              >
                Empty Viewport
              </div>
            ),
          )}
      </div>

      {/* Comparison Notes */}
      <div className="bg-gray-800 text-white p-4 border-t border-gray-700">
        <textarea
          placeholder="Add comparison notes here..."
          className="w-full bg-gray-700 text-white p-2 rounded resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}
