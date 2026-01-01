/**
 * Patient Billing Portal Page
 * Agent 1: Patient Portal & Experience Expert
 * Statements, payments, payment plans, insurance coverage, Good Faith Estimates
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CreditCard,
  DollarSign,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BillingStatement, Payment, PaymentPlan } from "@/types/patient-portal";

const mockStatement: BillingStatement = {
  id: "stmt-1",
  patientId: "patient-1",
  statementNumber: "ST-2026-001",
  statementDate: new Date("2026-01-01"),
  dueDate: new Date("2026-01-31"),
  previousBalance: 250.0,
  currentCharges: 450.0,
  payments: -200.0,
  adjustments: -50.0,
  totalDue: 450.0,
  status: "CURRENT",
  lineItems: [
    {
      id: "1",
      serviceDate: new Date("2025-12-20"),
      provider: "Dr. Michael Chen",
      description: "Office Visit - Level 3",
      cptCode: "99213",
      quantity: 1,
      charge: 150.0,
      insurance: 120.0,
      patientResponsibility: 30.0,
      status: "PAID",
    },
    {
      id: "2",
      serviceDate: new Date("2025-12-20"),
      provider: "Quest Diagnostics",
      description: "Lipid Panel",
      cptCode: "80061",
      quantity: 1,
      charge: 75.0,
      insurance: 60.0,
      patientResponsibility: 15.0,
      status: "PENDING",
    },
    {
      id: "3",
      serviceDate: new Date("2025-12-20"),
      provider: "Quest Diagnostics",
      description: "Hemoglobin A1c",
      cptCode: "83036",
      quantity: 1,
      charge: 50.0,
      insurance: 40.0,
      patientResponsibility: 10.0,
      status: "PENDING",
    },
  ],
  organizationId: "org-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  deletedAt: null,
  createdBy: "system",
  updatedBy: "system",
};

const mockInsurance = {
  insuranceName: "Blue Cross Blue Shield",
  policyNumber: "ABC123456789",
  groupNumber: "GRP-12345",
  deductible: 1500,
  deductibleMet: 850,
  outOfPocketMax: 5000,
  outOfPocketMet: 1200,
};

const mockPaymentPlan: PaymentPlan = {
  id: "plan-1",
  patientId: "patient-1",
  totalAmount: 1200.0,
  monthlyPayment: 100.0,
  numberOfPayments: 12,
  remainingPayments: 8,
  nextPaymentDate: new Date("2026-02-01"),
  status: "ACTIVE",
  autopay: true,
};

export default function BillingPage() {
  const [selectedStatement, setSelectedStatement] = useState(mockStatement);

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Payments</h1>
          <p className="text-muted-foreground">
            Manage your healthcare finances
          </p>
        </div>
        <Button>
          <CreditCard className="mr-2 h-4 w-4" />
          Make a Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockStatement.totalDue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Due {formatDate(mockStatement.dueDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance Coverage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockInsurance.deductibleMet)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(mockInsurance.deductible)} deductible met
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Plan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockPaymentPlan.monthlyPayment)}/mo
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockPaymentPlan.remainingPayments} payments remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="statements">
        <TabsList>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="payment-plan">Payment Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="statements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Statement {mockStatement.statementNumber}</CardTitle>
                  <CardDescription>
                    Statement Date: {formatDate(mockStatement.statementDate, "long")}
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Balance Summary */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previous Balance</span>
                  <span>{formatCurrency(mockStatement.previousBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Charges</span>
                  <span>{formatCurrency(mockStatement.currentCharges)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payments</span>
                  <span className="text-green-600">
                    {formatCurrency(mockStatement.payments)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adjustments</span>
                  <span className="text-green-600">
                    {formatCurrency(mockStatement.adjustments)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount Due</span>
                  <span>{formatCurrency(mockStatement.totalDue)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Payment Due Date</span>
                  <span>{formatDate(mockStatement.dueDate, "long")}</span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="font-medium mb-4">Itemized Charges</h3>
                <div className="space-y-3">
                  {mockStatement.lineItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.description}</p>
                              <Badge variant="outline" className="text-xs">
                                {item.cptCode}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.provider} • {formatDate(item.serviceDate)}
                            </p>
                            <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                              <div>
                                <p className="text-muted-foreground">Charge</p>
                                <p className="font-medium">
                                  {formatCurrency(item.charge)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Insurance</p>
                                <p className="font-medium">
                                  {formatCurrency(item.insurance)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Your Cost</p>
                                <p className="font-medium text-primary">
                                  {formatCurrency(item.patientResponsibility)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={item.status === "PAID" ? "default" : "outline"}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
                <Button variant="outline" className="flex-1">
                  Set Up Payment Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No payment history</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your payment history will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Coverage</CardTitle>
              <CardDescription>{mockInsurance.insuranceName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Policy Number</p>
                  <p className="font-medium">{mockInsurance.policyNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Group Number</p>
                  <p className="font-medium">{mockInsurance.groupNumber}</p>
                </div>
              </div>

              <Separator />

              {/* Deductible Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Annual Deductible</span>
                  <span>
                    {formatCurrency(mockInsurance.deductibleMet)} of{" "}
                    {formatCurrency(mockInsurance.deductible)}
                  </span>
                </div>
                <Progress
                  value={(mockInsurance.deductibleMet / mockInsurance.deductible) * 100}
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    mockInsurance.deductible - mockInsurance.deductibleMet,
                  )}{" "}
                  remaining
                </p>
              </div>

              {/* Out of Pocket Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Out-of-Pocket Maximum</span>
                  <span>
                    {formatCurrency(mockInsurance.outOfPocketMet)} of{" "}
                    {formatCurrency(mockInsurance.outOfPocketMax)}
                  </span>
                </div>
                <Progress
                  value={
                    (mockInsurance.outOfPocketMet / mockInsurance.outOfPocketMax) * 100
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    mockInsurance.outOfPocketMax - mockInsurance.outOfPocketMet,
                  )}{" "}
                  remaining
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Payment Plan</CardTitle>
              <CardDescription>
                Manageable monthly payments for your healthcare costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>AutoPay Enabled</AlertTitle>
                <AlertDescription>
                  Your payment of {formatCurrency(mockPaymentPlan.monthlyPayment)} will be
                  automatically charged on {formatDate(mockPaymentPlan.nextPaymentDate)}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Original Amount</span>
                  <span className="font-medium">
                    {formatCurrency(mockPaymentPlan.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Payment</span>
                  <span className="font-medium">
                    {formatCurrency(mockPaymentPlan.monthlyPayment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Payments Remaining
                  </span>
                  <span className="font-medium">
                    {mockPaymentPlan.remainingPayments} of{" "}
                    {mockPaymentPlan.numberOfPayments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next Payment</span>
                  <span className="font-medium">
                    {formatDate(mockPaymentPlan.nextPaymentDate, "long")}
                  </span>
                </div>

                <Progress
                  value={
                    ((mockPaymentPlan.numberOfPayments -
                      mockPaymentPlan.remainingPayments) /
                      mockPaymentPlan.numberOfPayments) *
                    100
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Manage AutoPay
                </Button>
                <Button variant="outline" className="flex-1">
                  Make Extra Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
