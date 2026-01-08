/**
 * Protocol Viewer Component
 */

"use client";

import { ProtocolVersion } from "@/types/research";

export function ProtocolViewer({ protocol }: { protocol: ProtocolVersion }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold">Protocol Version {protocol.versionNumber}</h2>
          <p className="text-gray-600">Effective: {new Date(protocol.effectiveDate).toLocaleDateString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${protocol.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {protocol.status}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Changes Summary</h3>
          <p className="text-gray-700">{protocol.changesSummary}</p>
        </div>

        <div>
          <h3 className="font-medium mb-2">Amendments</h3>
          {protocol.amendments.length === 0 ? (
            <p className="text-gray-500">No amendments</p>
          ) : (
            <ul className="space-y-2">
              {protocol.amendments.map((amendment) => (
                <li key={amendment.id} className="border-l-2 border-blue-500 pl-3">
                  <p className="font-medium">{amendment.amendmentNumber}</p>
                  <p className="text-sm text-gray-600">{amendment.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-2">Approvals</h3>
          {protocol.approvals.map((approval) => (
            <div key={approval.id} className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-700">{approval.approverType}</span>
              <span className="text-sm text-gray-600">{new Date(approval.approvalDate).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Download Protocol Document
        </button>
      </div>
    </div>
  );
}
