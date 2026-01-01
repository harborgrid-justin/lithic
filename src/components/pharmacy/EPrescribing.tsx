/**
 * E-Prescribing Component
 * Handle NCPDP e-prescribing messages
 */

"use client";

import { useEffect, useState } from "react";
import {
  prescriptionService,
  type EPrescribeMessage,
} from "@/services/prescription.service";

interface EPrescribingProps {
  onMessageProcessed?: () => void;
}

export function EPrescribing({ onMessageProcessed }: EPrescribingProps) {
  const [messages, setMessages] = useState<EPrescribeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    messageType: "",
    status: "received",
  });
  const [selectedMessage, setSelectedMessage] =
    useState<EPrescribeMessage | null>(null);

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getEPrescribeMessages({
        messageType: filter.messageType || undefined,
        status: filter.status || undefined,
      });
      setMessages(data);
    } catch (error) {
      console.error("Failed to load e-prescribe messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessNewRx = async (messageId: string) => {
    try {
      await prescriptionService.processNewRxMessage(messageId);
      alert("NEWRX message processed successfully");
      loadMessages();
      onMessageProcessed?.();
    } catch (error) {
      console.error("Failed to process NEWRX:", error);
      alert("Failed to process message");
    }
  };

  const handleSendResponse = async (
    messageId: string,
    responseType: "approved" | "denied" | "replaced",
  ) => {
    try {
      await prescriptionService.sendRefillResponse(messageId, responseType);
      alert("Response sent successfully");
      loadMessages();
    } catch (error) {
      console.error("Failed to send response:", error);
      alert("Failed to send response");
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "NEWRX":
        return "bg-blue-100 text-blue-800";
      case "REFRES":
        return "bg-green-100 text-green-800";
      case "RXCHG":
        return "bg-yellow-100 text-yellow-800";
      case "CANRX":
        return "bg-red-100 text-red-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      case "STATUS":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-yellow-100 text-yellow-800";
      case "processed":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "acknowledged":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Type
            </label>
            <select
              value={filter.messageType}
              onChange={(e) =>
                setFilter({ ...filter, messageType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="NEWRX">NEWRX - New Prescription</option>
              <option value="REFRES">REFRES - Refill Request</option>
              <option value="RXCHG">RXCHG - Change Request</option>
              <option value="CANRX">CANRX - Cancel Request</option>
              <option value="ERROR">ERROR</option>
              <option value="STATUS">STATUS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="received">Received</option>
              <option value="processed">Processed</option>
              <option value="error">Error</option>
              <option value="sent">Sent</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadMessages}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading e-prescribe messages...
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div key={message.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getMessageTypeColor(message.messageType)}`}
                      >
                        {message.messageType}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatusColor(message.status)}`}
                      >
                        {message.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.direction === "inbound"
                          ? "← Inbound"
                          : "→ Outbound"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-mono">
                        {message.ncpdpMessageId}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Prescriber ID:
                        </span>
                        <div className="text-gray-600">
                          {message.prescriberId}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Patient ID:
                        </span>
                        <div className="text-gray-600">{message.patientId}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          {message.receivedAt ? "Received" : "Sent"}:
                        </span>
                        <div className="text-gray-600">
                          {new Date(
                            message.receivedAt || message.sentAt || "",
                          ).toLocaleString()}
                        </div>
                      </div>
                      {message.prescriptionId && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Prescription:
                          </span>
                          <div className="text-blue-600">
                            {message.prescriptionId}
                          </div>
                        </div>
                      )}
                    </div>

                    {message.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 rounded">
                        <p className="text-xs font-medium text-red-800 mb-1">
                          Error:
                        </p>
                        <p className="text-xs text-red-700">
                          {message.errorMessage}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setSelectedMessage(
                          selectedMessage?.id === message.id ? null : message,
                        )
                      }
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {selectedMessage?.id === message.id ? "Hide" : "View"}{" "}
                      Message Details
                    </button>

                    {selectedMessage?.id === message.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(message.messageData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    {message.messageType === "NEWRX" &&
                      message.status === "received" && (
                        <button
                          onClick={() => handleProcessNewRx(message.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Process
                        </button>
                      )}
                    {message.messageType === "REFRES" &&
                      message.status === "received" && (
                        <>
                          <button
                            onClick={() =>
                              handleSendResponse(message.id, "approved")
                            }
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleSendResponse(message.id, "denied")
                            }
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Deny
                          </button>
                        </>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No e-prescribe messages found
          </div>
        )}
      </div>
    </div>
  );
}
