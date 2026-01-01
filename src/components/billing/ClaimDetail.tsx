"use client";

import { Claim } from "@/types/billing";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getClaimStatusColor } from "@/lib/billing-utils";
import {
  FileText,
  Calendar,
  User,
  Building2,
  DollarSign,
  AlertCircle,
} from "lucide-react";

interface ClaimDetailProps {
  claim: Claim;
  onEdit?: () => void;
  onSubmit?: () => void;
}

export default function ClaimDetail({
  claim,
  onEdit,
  onSubmit,
}: ClaimDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {claim.claimNumber}
            </h2>
            <p className="text-gray-500 mt-1">
              Created {formatDateTime(claim.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getClaimStatusColor(claim.status)}`}
            >
              {claim.status.replace("_", " ").toUpperCase()}
            </span>
            {claim.status === "draft" && onSubmit && (
              <button
                onClick={onSubmit}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Submit Claim
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Patient & Insurance Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Patient Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Patient ID</dt>
              <dd className="text-sm font-medium text-gray-900">
                {claim.patientId}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Patient Name</dt>
              <dd className="text-sm font-medium text-gray-900">
                {claim.patientName}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Date of Service</dt>
              <dd className="text-sm font-medium text-gray-900">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(claim.dateOfService)}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Insurance & Provider
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Insurance Company</dt>
              <dd className="text-sm font-medium text-gray-900">
                {claim.insuranceName}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Insurance ID</dt>
              <dd className="text-sm font-medium text-gray-900">
                {claim.insuranceId}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Provider</dt>
              <dd className="text-sm font-medium text-gray-900">
                {claim.providerName}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary-900">
          <DollarSign className="w-5 h-5" />
          Financial Summary
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-primary-700">Total Charged</p>
            <p className="text-2xl font-bold text-primary-900">
              {formatCurrency(claim.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Allowed Amount</p>
            <p className="text-2xl font-bold text-primary-900">
              {claim.allowedAmount ? formatCurrency(claim.allowedAmount) : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Paid Amount</p>
            <p className="text-2xl font-bold text-green-700">
              {claim.paidAmount
                ? formatCurrency(claim.paidAmount)
                : formatCurrency(0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Balance</p>
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(claim.totalAmount - (claim.paidAmount || 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Diagnosis Codes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Diagnosis Codes</h3>
        <div className="space-y-2">
          {claim.diagnosis && claim.diagnosis.length > 0 ? (
            claim.diagnosis.map((dx) => (
              <div
                key={dx.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <code className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                  {dx.code}
                </code>
                <span className="text-sm text-gray-900">{dx.description}</span>
                {dx.isPrimary && (
                  <span className="ml-auto px-2 py-1 bg-primary-100 text-primary-800 text-xs font-semibold rounded">
                    PRIMARY
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No diagnosis codes</p>
          )}
        </div>
      </div>

      {/* Procedure Codes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Procedure Codes</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {claim.codes && claim.codes.length > 0 ? (
              claim.codes.map((code) => (
                <tr key={code.id}>
                  <td className="px-4 py-3 text-sm font-mono">{code.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {code.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {code.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(code.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(code.totalPrice)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No procedure codes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Denial Information */}
      {claim.status === "denied" && claim.denialReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5" />
            Denial Information
          </h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-red-700">Denial Reason</dt>
              <dd className="text-sm font-medium text-red-900">
                {claim.denialReason.replace("_", " ").toUpperCase()}
              </dd>
            </div>
            {claim.denialDetails && (
              <div>
                <dt className="text-sm text-red-700">Details</dt>
                <dd className="text-sm font-medium text-red-900">
                  {claim.denialDetails}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Notes */}
      {claim.notes && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {claim.notes}
          </p>
        </div>
      )}

      {/* Submission Info */}
      {claim.submissionDate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">Submission Information</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Submission Date</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatDateTime(claim.submissionDate)}
              </dd>
            </div>
            {claim.responseDate && (
              <div>
                <dt className="text-sm text-gray-500">Response Date</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatDateTime(claim.responseDate)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
