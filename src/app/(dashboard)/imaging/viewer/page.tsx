"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { imagingService, ImagingStudy } from "@/services/imaging.service";
import DicomViewer from "@/components/imaging/DicomViewer";
import ImageThumbnails from "@/components/imaging/ImageThumbnails";
import MeasurementTools from "@/components/imaging/MeasurementTools";
import ImageAnnotations from "@/components/imaging/ImageAnnotations";

export const dynamic = "force-dynamic";

export default function ViewerPage() {
  const searchParams = useSearchParams();
  const studyId = searchParams.get("studyId");

  const [study, setStudy] = useState<ImagingStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);

  useEffect(() => {
    if (studyId) {
      loadStudy();
    }
  }, [studyId]);

  const loadStudy = async () => {
    if (!studyId) return;
    try {
      const data = await imagingService.getStudy(studyId);
      setStudy(data);
      if (
        data.seriesList.length > 0 &&
        data.seriesList[0].instances.length > 0
      ) {
        setSelectedSeries(data.seriesList[0]);
        setSelectedInstance(data.seriesList[0].instances[0]);
      }
    } catch (error) {
      console.error("Failed to load study:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstance = (instance: any, series: any) => {
    setSelectedInstance(instance);
    setSelectedSeries(series);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading viewer...</div>
        </div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-xl mb-4">No study selected</div>
          <p className="text-gray-400">Please select a study to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Thumbnails */}
      <div className="w-64 bg-white border-r border-gray-200">
        <ImageThumbnails
          series={study.seriesList}
          selectedInstanceId={selectedInstance?.id}
          onSelectInstance={handleSelectInstance}
        />
      </div>

      {/* Main Viewer */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          {selectedInstance && selectedSeries ? (
            <DicomViewer
              studyInstanceUID={study.studyInstanceUID}
              seriesInstanceUID={selectedSeries.seriesInstanceUID}
              sopInstanceUID={selectedInstance.sopInstanceUID}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900 text-white">
              No image selected
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Tools */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Study Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Study Information</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">Patient:</span>{" "}
                {study.patientName}
              </div>
              <div>
                <span className="text-gray-600">MRN:</span> {study.patientMRN}
              </div>
              <div>
                <span className="text-gray-600">Study:</span>{" "}
                {study.studyDescription}
              </div>
              <div>
                <span className="text-gray-600">Date:</span>{" "}
                {new Date(study.studyDate).toLocaleDateString()}
              </div>
              <div>
                <span className="text-gray-600">Modality:</span>{" "}
                {study.modality}
              </div>
            </div>
          </div>

          {/* Tools Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowMeasurements(!showMeasurements)}
              className={`flex-1 px-3 py-2 rounded ${
                showMeasurements
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Measurements
            </button>
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`flex-1 px-3 py-2 rounded ${
                showAnnotations
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Annotations
            </button>
          </div>

          {/* Measurement Tools */}
          {showMeasurements && selectedInstance && selectedSeries && (
            <MeasurementTools
              studyId={study.id}
              seriesId={selectedSeries.id}
              instanceId={selectedInstance.id}
              pixelSpacing={selectedInstance.pixelSpacing}
            />
          )}

          {/* Annotation Tools */}
          {showAnnotations && selectedInstance && selectedSeries && (
            <ImageAnnotations
              studyId={study.id}
              seriesId={selectedSeries.id}
              instanceId={selectedInstance.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
