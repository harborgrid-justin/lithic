'use client';

import { useState, useEffect } from 'react';
import { imagingService, ImagingStudy } from '@/services/imaging.service';

interface StudyListProps {
  patientId?: string;
  onSelectStudy?: (study: ImagingStudy) => void;
}

export default function StudyList({ patientId, onSelectStudy }: StudyListProps) {
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    modality: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadStudies();
  }, [patientId, filters]);

  const loadStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await imagingService.getStudies({
        patientId,
        ...filters,
      });
      setStudies(data);
    } catch (err) {
      setError('Failed to load studies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ACQUIRED: 'bg-blue-100 text-blue-800',
      QUALITY_CHECK: 'bg-yellow-100 text-yellow-800',
      READY_FOR_REVIEW: 'bg-purple-100 text-purple-800',
      IN_REVIEW: 'bg-orange-100 text-orange-800',
      REPORTED: 'bg-green-100 text-green-800',
      FINALIZED: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modality
            </label>
            <select
              value={filters.modality}
              onChange={e => setFilters({ ...filters, modality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modalities</option>
              <option value="CT">CT</option>
              <option value="MR">MRI</option>
              <option value="XR">X-Ray</option>
              <option value="US">Ultrasound</option>
              <option value="NM">Nuclear Medicine</option>
              <option value="PT">PET</option>
              <option value="MG">Mammography</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACQUIRED">Acquired</option>
              <option value="QUALITY_CHECK">Quality Check</option>
              <option value="READY_FOR_REVIEW">Ready for Review</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="REPORTED">Reported</option>
              <option value="FINALIZED">Finalized</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Studies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studies.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No studies found
          </div>
        ) : (
          studies.map(study => (
            <div
              key={study.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectStudy?.(study)}
            >
              {/* Thumbnail */}
              <div className="h-48 bg-gray-900 rounded-t-lg flex items-center justify-center overflow-hidden">
                {study.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={study.thumbnailUrl}
                    alt="Study thumbnail"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm">No thumbnail</p>
                  </div>
                )}
              </div>

              {/* Study Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {study.studyDescription}
                  </h3>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(study.status)}`}
                  >
                    {study.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Patient:</span>
                    <span>{study.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">MRN:</span>
                    <span>{study.patientMRN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Accession:</span>
                    <span>{study.accessionNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Modality:</span>
                    <span className="font-semibold">{study.modality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>
                      {new Date(`${study.studyDate} ${study.studyTime}`).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Series:</span>
                    <span>{study.numberOfSeries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Images:</span>
                    <span>{study.numberOfInstances}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Size:</span>
                    <span>{formatFileSize(study.fileSize)}</span>
                  </div>
                  {study.radiologist && (
                    <div className="flex justify-between">
                      <span className="font-medium">Radiologist:</span>
                      <span>{study.radiologist}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2">
                  <a
                    href={`/imaging/viewer?studyId=${study.id}`}
                    className="flex-1 bg-blue-600 text-white text-center px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                    onClick={e => e.stopPropagation()}
                  >
                    View Images
                  </a>
                  {study.reportId && (
                    <a
                      href={`/imaging/reports/${study.reportId}`}
                      className="flex-1 bg-green-600 text-white text-center px-3 py-2 rounded hover:bg-green-700 text-sm font-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      View Report
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-sm text-gray-600">
          Total Studies: <span className="font-semibold">{studies.length}</span>
        </div>
      </div>
    </div>
  );
}
