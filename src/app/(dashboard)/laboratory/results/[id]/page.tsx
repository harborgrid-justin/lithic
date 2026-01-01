"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ResultEntry from "@/components/laboratory/ResultEntry";
import TrendChart from "@/components/laboratory/TrendChart";

export default function ResultDetailPage() {
  const params = useParams();
  const resultId = params.id as string;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/laboratory/results">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Result Details</h1>
          <p className="text-muted-foreground mt-1">Result ID: {resultId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResultEntry
          orderId="1"
          testName="White Blood Cell Count"
          loincCode="6690-2"
        />
        <TrendChart
          patientId="PT001"
          loincCode="6690-2"
          testName="White Blood Cell Count"
          referenceRange={{ low: 4.5, high: 11.0 }}
        />
      </div>
    </div>
  );
}
