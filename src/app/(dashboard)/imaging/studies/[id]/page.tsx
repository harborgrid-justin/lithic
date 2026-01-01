"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { imagingService, ImagingStudy } from "@/services/imaging.service";
import DicomViewer from "@/components/imaging/DicomViewer";
import ImageThumbnails from "@/components/imaging/ImageThumbnails";

export default function StudyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [study, setStudy] = useState<ImagingStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [selectedSeries, setSelectedSeries] = useState<any>(null);

  useEffect(() => {
    loadStudy();
  }, [params.id]);

  const loadStudy = async () => {
    try {
      const data = await imagingService.getStudy(params.id);
      setStudy(data);
      // Auto-select first instance if available
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Study not found
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {study.studyDescription}
            </h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>
                {study.patientName} ({study.patientMRN})
              </span>
              <span>•</span>
              <span>{new Date(study.studyDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>{study.modality}</span>
              <span>•</span>
              <span>
                {study.numberOfSeries} series, {study.numberOfInstances} images
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/imaging/viewer?studyId=${study.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Open in Viewer
            </Link>
            {study.reportId ? (
              <Link
                href={`/imaging/reports?studyId=${study.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                View Report
              </Link>
            ) : (
              <Link
                href={`/imaging/reports?studyId=${study.id}&new=true`}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Create Report
              </Link>
            )}
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <ImageThumbnails
            series={study.seriesList}
            selectedInstanceId={selectedInstance?.id}
            onSelectInstance={handleSelectInstance}
          />
        </div>

        {/* Viewer */}
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
    </div>
  );
}
