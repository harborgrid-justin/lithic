'use client';

import { useState, useEffect } from 'react';
import { Modality } from '@/services/imaging.service';

export default function ModalityStatus() {
  const [modalities, setModalities] = useState<Modality[]>([
    {
      id: 'MOD-001',
      name: 'CT Scanner 1',
      type: 'CT',
      manufacturer: 'GE Healthcare',
      model: 'Revolution CT',
      serialNumber: 'SN-CT-001',
      aeTitle: 'CT_SCANNER_1',
      ipAddress: '192.168.1.101',
      port: 11112,
      location: 'Radiology - Room 1',
      status: 'ONLINE',
      lastHeartbeat: new Date().toISOString(),
      studyCount: 45,
      installedDate: '2022-01-15',
      lastServiceDate: '2025-11-01',
      nextServiceDate: '2026-05-01',
    },
    {
      id: 'MOD-002',
      name: 'MRI Scanner 1',
      type: 'MR',
      manufacturer: 'Siemens Healthineers',
      model: 'MAGNETOM Skyra 3T',
      serialNumber: 'SN-MR-001',
      aeTitle: 'MRI_SCANNER_1',
      ipAddress: '192.168.1.102',
      port: 11112,
      location: 'Radiology - MRI Suite 1',
      status: 'ONLINE',
      lastHeartbeat: new Date().toISOString(),
      studyCount: 28,
      installedDate: '2021-06-20',
      lastServiceDate: '2025-10-15',
      nextServiceDate: '2026-04-15',
    },
    {
      id: 'MOD-003',
      name: 'X-Ray Room 1',
      type: 'DX',
      manufacturer: 'Philips',
      model: 'DigitalDiagnost',
      serialNumber: 'SN-XR-001',
      aeTitle: 'XRAY_ROOM_1',
      ipAddress: '192.168.1.103',
      port: 11112,
      location: 'Radiology - X-Ray Room 1',
      status: 'ONLINE',
      lastHeartbeat: new Date().toISOString(),
      studyCount: 112,
      installedDate: '2020-03-10',
      lastServiceDate: '2025-09-20',
      nextServiceDate: '2026-03-20',
    },
    {
      id: 'MOD-004',
      name: 'Ultrasound 1',
      type: 'US',
      manufacturer: 'GE Healthcare',
      model: 'LOGIQ E10',
      serialNumber: 'SN-US-001',
      aeTitle: 'US_ROOM_1',
      ipAddress: '192.168.1.104',
      port: 11112,
      location: 'Radiology - Ultrasound Room 1',
      status: 'MAINTENANCE',
      lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
      studyCount: 67,
      installedDate: '2022-08-05',
      lastServiceDate: '2025-12-28',
      notes: 'Scheduled maintenance - transducer calibration',
    },
    {
      id: 'MOD-005',
      name: 'CT Scanner 2',
      type: 'CT',
      manufacturer: 'Siemens Healthineers',
      model: 'SOMATOM Definition',
      serialNumber: 'SN-CT-002',
      aeTitle: 'CT_SCANNER_2',
      ipAddress: '192.168.1.105',
      port: 11112,
      location: 'Radiology - Room 2',
      status: 'OFFLINE',
      lastHeartbeat: new Date(Date.now() - 7200000).toISOString(),
      studyCount: 0,
      installedDate: '2019-11-12',
      lastServiceDate: '2025-08-10',
      nextServiceDate: '2026-02-10',
      notes: 'Network connectivity issue - IT notified',
    },
  ]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ONLINE: 'bg-green-500',
      OFFLINE: 'bg-red-500',
      MAINTENANCE: 'bg-yellow-500',
      ERROR: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      ONLINE: 'bg-green-100 text-green-800',
      OFFLINE: 'bg-red-100 text-red-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Modalities</div>
          <div className="text-2xl font-bold">{modalities.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Online</div>
          <div className="text-2xl font-bold text-green-600">
            {modalities.filter(m => m.status === 'ONLINE').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Maintenance</div>
          <div className="text-2xl font-bold text-yellow-600">
            {modalities.filter(m => m.status === 'MAINTENANCE').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Offline</div>
          <div className="text-2xl font-bold text-red-600">
            {modalities.filter(m => m.status === 'OFFLINE').length}
          </div>
        </div>
      </div>

      {/* Modalities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modalities.map(modality => (
          <div key={modality.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Status Bar */}
            <div className={`h-2 ${getStatusColor(modality.status)}`} />

            {/* Content */}
            <div className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{modality.name}</h3>
                  <p className="text-sm text-gray-600">{modality.location}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(modality.status)}`}
                >
                  {modality.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{modality.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Manufacturer:</span>
                  <span className="font-medium">{modality.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-medium">{modality.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AE Title:</span>
                  <span className="font-mono text-xs">{modality.aeTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IP Address:</span>
                  <span className="font-mono text-xs">{modality.ipAddress}:{modality.port}</span>
                </div>
                {modality.lastHeartbeat && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Heartbeat:</span>
                    <span className="text-xs">{getTimeAgo(modality.lastHeartbeat)}</span>
                  </div>
                )}
                {modality.studyCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Studies Today:</span>
                    <span className="font-semibold">{modality.studyCount}</span>
                  </div>
                )}
                {modality.nextServiceDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Service:</span>
                    <span className="text-xs">{modality.nextServiceDate}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {modality.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">{modality.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                  Test Connection
                </button>
                <button className="flex-1 px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
