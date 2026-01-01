/**
 * Refill Manager Component
 * Display and process refill requests
 */

"use client";

import { useState } from "react";
import { type RefillRequest } from "@/services/prescription.service";

interface RefillManagerProps {
  refillRequests: RefillRequest[];
  onProcess: (
    id: string,
    action: "approve" | "deny",
    notes?: string,
    denialReason?: string,
  ) => void;
  onRefresh: () => void;
}

export function RefillManager({
  refillRequests,
  onProcess,
  onRefresh,
}: RefillManagerProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [denialReason, setDenialReason] = useState("");

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onProcess(id, "approve", notes || undefined);
      setNotes("");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (id: string) => {
    const reason = prompt("Enter denial reason:");
    if (!reason) return;

    setProcessingId(id);
    try {
      await onProcess(id, "deny", undefined, reason);
    } finally {
      setProcessingId(null);
    }
  };

  if (refillRequests.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No refill requests found
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {refillRequests.map((request) => (
        <div key={request.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Rx #{request.prescription?.rxNumber || "N/A"}
                </h3>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    request.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : request.status === "denied"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {request.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Patient:</span>
                  <span className="ml-2 text-gray-600">
                    {request.prescription?.patientName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Medication:</span>
                  <span className="ml-2 text-gray-600">
                    {request.prescription?.medicationName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Requested By:
                  </span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {request.requestedBy}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Request Date:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {request.prescription && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">
                        Quantity:
                      </span>
                      <span className="ml-1">
                        {request.prescription.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Days Supply:
                      </span>
                      <span className="ml-1">
                        {request.prescription.daysSupply}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Refills Remaining:
                      </span>
                      <span className="ml-1">
                        {request.prescription.refillsRemaining}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Last Filled:
                      </span>
                      <span className="ml-1">
                        {request.prescription.lastFilledDate
                          ? new Date(
                              request.prescription.lastFilledDate,
                            ).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {request.notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="text-xs font-medium text-blue-800 mb-1">
                    Notes:
                  </p>
                  <p className="text-xs text-blue-700">{request.notes}</p>
                </div>
              )}

              {request.denialReason && (
                <div className="mt-3 p-3 bg-red-50 rounded">
                  <p className="text-xs font-medium text-red-800 mb-1">
                    Denial Reason:
                  </p>
                  <p className="text-xs text-red-700">{request.denialReason}</p>
                </div>
              )}

              {request.tooSoonDate && (
                <div className="mt-3 p-3 bg-yellow-50 rounded">
                  <p className="text-xs font-medium text-yellow-800">
                    Too soon to refill. Next eligible date:{" "}
                    {new Date(request.tooSoonDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {request.status === "pending" && (
              <div className="ml-4 flex flex-col gap-2">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId === request.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDeny(request.id)}
                  disabled={processingId === request.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  Deny
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
