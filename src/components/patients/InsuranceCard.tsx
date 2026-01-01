"use client";

import { Insurance } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface InsuranceCardProps {
  insurance: Insurance;
  onVerify?: (insuranceId: string) => void;
  onEdit?: (insurance: Insurance) => void;
}

export function InsuranceCard({
  insurance,
  onVerify,
  onEdit,
}: InsuranceCardProps) {
  const typeColors = {
    primary: "default" as const,
    secondary: "secondary" as const,
    tertiary: "outline" as const,
  };

  const statusColors = {
    active: "success" as const,
    inactive: "secondary" as const,
    pending: "warning" as const,
    expired: "danger" as const,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <CardTitle className="text-lg">{insurance.provider}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={typeColors[insurance.type]}>{insurance.type}</Badge>
            <Badge variant={statusColors[insurance.status]}>
              {insurance.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Policy Number</label>
            <div className="font-medium font-mono">
              {insurance.policyNumber}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Group Number</label>
            <div className="font-medium font-mono">
              {insurance.groupNumber || "N/A"}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Subscriber ID</label>
            <div className="font-medium">{insurance.subscriberId}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Subscriber Name</label>
            <div className="font-medium">{insurance.subscriberName}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Relationship</label>
            <div className="font-medium capitalize">
              {insurance.subscriberRelationship}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Effective Date</label>
            <div className="font-medium">
              {formatDate(insurance.effectiveDate)}
            </div>
          </div>
        </div>

        {insurance.copay !== undefined && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-500">Copay</label>
                <div className="font-medium font-mono">${insurance.copay}</div>
              </div>
              {insurance.deductible !== undefined && (
                <div>
                  <label className="text-sm text-gray-500">Deductible</label>
                  <div className="font-medium font-mono">
                    ${insurance.deductible}
                  </div>
                </div>
              )}
              {insurance.outOfPocketMax !== undefined && (
                <div>
                  <label className="text-sm text-gray-500">
                    Out of Pocket Max
                  </label>
                  <div className="font-medium font-mono">
                    ${insurance.outOfPocketMax}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {insurance.verified ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    Verified{" "}
                    {insurance.lastVerified &&
                      "on " + formatDate(insurance.lastVerified)}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Not verified</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onVerify?.(insurance.id)}
              >
                Verify Eligibility
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(insurance)}
              >
                Edit
              </Button>
            </div>
          </div>
        </div>

        {insurance.eligibilityResponse && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Eligibility Information
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Coverage Active:</span>
                <span className="font-medium">
                  {insurance.eligibilityResponse.coverageActive ? "Yes" : "No"}
                </span>
              </div>
              {insurance.eligibilityResponse.deductibleMet !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Deductible Met:</span>
                  <span className="font-medium">
                    ${insurance.eligibilityResponse.deductibleMet} / $
                    {insurance.eligibilityResponse.deductible}
                  </span>
                </div>
              )}
              {insurance.eligibilityResponse.outOfPocketMet !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Out of Pocket Met:</span>
                  <span className="font-medium">
                    ${insurance.eligibilityResponse.outOfPocketMet} / $
                    {insurance.eligibilityResponse.outOfPocketMax}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
