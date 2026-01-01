"use client";

/**
 * Lithic Enterprise v0.3 - Contract Management
 * Payer contract and fee schedule management
 */

import { useState } from "react";
import type { PayerContract, ContractStatus, ContractType } from "@/types/billing-enterprise";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Edit,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function ContractManagement() {
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  // Mock data - in production, fetch from API
  const contracts: Partial<PayerContract>[] = [
    {
      id: "1",
      payerName: "Blue Cross Blue Shield",
      contractNumber: "BCBS-2024-001",
      contractType: "FEE_FOR_SERVICE" as ContractType,
      effectiveDate: new Date("2024-01-01"),
      expirationDate: new Date("2025-12-31"),
      status: "ACTIVE" as ContractStatus,
      paymentTerms: { netDays: 30, discountPercentage: null, discountDays: null, interestRate: null, latePaymentFee: null },
    },
    {
      id: "2",
      payerName: "Aetna",
      contractNumber: "AET-2024-005",
      contractType: "FEE_FOR_SERVICE" as ContractType,
      effectiveDate: new Date("2024-03-01"),
      expirationDate: new Date("2025-02-28"),
      status: "ACTIVE" as ContractStatus,
      paymentTerms: { netDays: 45, discountPercentage: null, discountDays: null, interestRate: null, latePaymentFee: null },
    },
    {
      id: "3",
      payerName: "United Healthcare",
      contractNumber: "UHC-2023-012",
      contractType: "FEE_FOR_SERVICE" as ContractType,
      effectiveDate: new Date("2023-06-01"),
      expirationDate: new Date("2026-05-31"),
      status: "EXPIRING_SOON" as ContractStatus,
      paymentTerms: { netDays: 30, discountPercentage: null, discountDays: null, interestRate: null, latePaymentFee: null },
    },
  ];

  const feeScheduleSample = [
    { code: "99213", description: "Office visit - Level 3", allowedAmount: 93.00, contractedRate: 85.00, percentOfMedicare: null },
    { code: "99214", description: "Office visit - Level 4", allowedAmount: 131.00, contractedRate: 120.00, percentOfMedicare: null },
    { code: "99215", description: "Office visit - Level 5", allowedAmount: 183.00, contractedRate: 168.00, percentOfMedicare: null },
    { code: "99203", description: "New patient - Level 3", allowedAmount: 112.00, contractedRate: 102.00, percentOfMedicare: null },
    { code: "99204", description: "New patient - Level 4", allowedAmount: 167.00, contractedRate: 153.00, percentOfMedicare: null },
    { code: "20610", description: "Joint injection", allowedAmount: 85.00, contractedRate: 78.00, percentOfMedicare: null },
    { code: "71046", description: "Chest X-ray - 2 views", allowedAmount: 45.00, contractedRate: null, percentOfMedicare: 110 },
  ];

  const performanceMetrics = [
    { metric: "Average Days to Payment", current: 32, target: 30, trend: "up" },
    { metric: "Denial Rate", current: 4.2, target: 5.0, trend: "down" },
    { metric: "Clean Claim Rate", current: 96.5, target: 95.0, trend: "up" },
    { metric: "Collection Rate", current: 92.3, target: 90.0, trend: "up" },
  ];

  const statusColors: { [key in ContractStatus]: string } = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRING_SOON: "bg-orange-100 text-orange-800",
    EXPIRED: "bg-red-100 text-red-800",
    TERMINATED: "bg-red-100 text-red-800",
    RENEGOTIATING: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Management</h1>
          <p className="text-gray-600 mt-2">
            Manage payer contracts and fee schedules
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Contracts List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Cards */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payer Contracts</CardTitle>
              <CardDescription>{contracts.length} active contracts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedContract === contract.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedContract(contract.id!)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{contract.payerName}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {contract.contractNumber}
                      </div>
                    </div>
                    <Badge className={statusColors[contract.status!]}>
                      {contract.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Expires {new Date(contract.expirationDate!).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-orange-900">
                    Contract Expiring Soon
                  </div>
                  <div className="text-orange-700">
                    United Healthcare contract expires in 45 days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Details */}
        <div className="lg:col-span-2">
          {selectedContract ? (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="fee-schedule">Fee Schedule</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="comparison">Compare</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Contract Details</CardTitle>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Contract Number</Label>
                        <div className="font-medium">
                          {contracts[parseInt(selectedContract) - 1]?.contractNumber}
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-500">Contract Type</Label>
                        <div className="font-medium">
                          {contracts[parseInt(selectedContract) - 1]?.contractType}
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-500">Effective Date</Label>
                        <div className="font-medium">
                          {new Date(
                            contracts[parseInt(selectedContract) - 1]?.effectiveDate!
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-500">Expiration Date</Label>
                        <div className="font-medium">
                          {new Date(
                            contracts[parseInt(selectedContract) - 1]?.expirationDate!
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-500">Payment Terms</Label>
                        <div className="font-medium">
                          Net {contracts[parseInt(selectedContract) - 1]?.paymentTerms?.netDays} days
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-500">Status</Label>
                        <div>
                          <Badge
                            className={
                              statusColors[
                                contracts[parseInt(selectedContract) - 1]?.status!
                              ]
                            }
                          >
                            {contracts[parseInt(selectedContract) - 1]?.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fee-schedule">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Fee Schedule</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Import
                        </Button>
                        <Button variant="outline" size="sm">
                          Export
                        </Button>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Code
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Allowed</TableHead>
                          <TableHead className="text-right">Contracted</TableHead>
                          <TableHead className="text-right">% of Medicare</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feeScheduleSample.map((fee) => (
                          <TableRow key={fee.code}>
                            <TableCell className="font-medium">{fee.code}</TableCell>
                            <TableCell>{fee.description}</TableCell>
                            <TableCell className="text-right">
                              ${fee.allowedAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fee.contractedRate ? `$${fee.contractedRate.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {fee.percentOfMedicare ? `${fee.percentOfMedicare}%` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Performance Metrics</CardTitle>
                    <CardDescription>
                      Performance vs. targets for current period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceMetrics.map((metric) => (
                        <div key={metric.metric} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{metric.metric}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold">
                                {metric.current}
                                {metric.metric.includes("Rate") ? "%" : ""}
                              </span>
                              {metric.trend === "up" ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                metric.current >= metric.target
                                  ? "bg-green-500"
                                  : "bg-orange-500"
                              }`}
                              style={{
                                width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">
                            Target: {metric.target}
                            {metric.metric.includes("Rate") ? "%" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Comparison</CardTitle>
                    <CardDescription>
                      Compare rates across payers for negotiation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Select contracts to compare</p>
                      <Button variant="outline" className="mt-4">
                        Select Contracts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a contract to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function BarChart3(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
