/**
 * Device Enrollment Wizard Component
 * Step-by-step device enrollment process
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EnrollmentWizard({ patientId }: { patientId: string }) {
  const [step, setStep] = useState(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enroll New Device</CardTitle>
        <CardDescription>Step {step} of 3</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Device Type</Label>
              <Input placeholder="Select device type..." />
            </div>
            <Button onClick={() => setStep(2)}>Next</Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Serial Number</Label>
              <Input placeholder="Enter serial number..." />
            </div>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <p>Review and confirm device enrollment</p>
            <Button>Complete Enrollment</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
