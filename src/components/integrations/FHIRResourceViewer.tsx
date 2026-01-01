"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Download,
  ExternalLink,
  FileJson,
  User,
  Activity,
  FileText,
  Calendar,
} from "lucide-react";

interface FHIRResourceViewerProps {
  resource: any;
  onClose?: () => void;
}

export function FHIRResourceViewer({
  resource,
  onClose,
}: FHIRResourceViewerProps) {
  const [activeTab, setActiveTab] = useState("formatted");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(resource, null, 2));
    alert("Copied to clipboard");
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(resource, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resource.resourceType}-${resource.id || "resource"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getResourceIcon = (type: string) => {
    const icons: Record<string, any> = {
      Patient: User,
      Observation: Activity,
      Encounter: Calendar,
      MedicationRequest: FileText,
      Condition: FileText,
      Procedure: FileText,
    };
    const Icon = icons[type] || FileJson;
    return <Icon className="h-5 w-5" />;
  };

  const renderPatient = (patient: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="text-base">
            {patient.name?.[0]?.given?.join(" ")} {patient.name?.[0]?.family}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Identifier (MRN)
          </label>
          <p className="text-base font-mono">
            {patient.identifier?.[0]?.value}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Gender</label>
          <p className="text-base capitalize">{patient.gender}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Birth Date
          </label>
          <p className="text-base">{patient.birthDate}</p>
        </div>
        {patient.address?.[0] && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-base">
              {patient.address[0].line?.join(", ")}
              {patient.address[0].city && `, ${patient.address[0].city}`}
              {patient.address[0].state && `, ${patient.address[0].state}`}
              {patient.address[0].postalCode &&
                ` ${patient.address[0].postalCode}`}
            </p>
          </div>
        )}
        {patient.telecom && patient.telecom.length > 0 && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">Contact</label>
            <div className="space-y-1">
              {patient.telecom.map((contact: any, idx: number) => (
                <p key={idx} className="text-base">
                  {contact.system}: {contact.value}{" "}
                  {contact.use && `(${contact.use})`}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderObservation = (obs: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Code</label>
          <p className="text-base">
            {obs.code?.text || obs.code?.coding?.[0]?.display}
          </p>
          <p className="text-xs text-gray-400 font-mono">
            {obs.code?.coding?.[0]?.system} | {obs.code?.coding?.[0]?.code}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Status</label>
          <Badge variant={obs.status === "final" ? "success" : "secondary"}>
            {obs.status}
          </Badge>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Value</label>
          <p className="text-base font-semibold">
            {obs.valueQuantity?.value} {obs.valueQuantity?.unit}
            {obs.valueString}
            {obs.valueBoolean !== undefined && String(obs.valueBoolean)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Effective Date
          </label>
          <p className="text-base">{obs.effectiveDateTime}</p>
        </div>
        {obs.interpretation && (
          <div>
            <label className="text-sm font-medium text-gray-500">
              Interpretation
            </label>
            <Badge
              variant={
                obs.interpretation[0]?.coding?.[0]?.code === "H"
                  ? "danger"
                  : obs.interpretation[0]?.coding?.[0]?.code === "L"
                    ? "warning"
                    : "secondary"
              }
            >
              {obs.interpretation[0]?.coding?.[0]?.display}
            </Badge>
          </div>
        )}
        {obs.referenceRange && (
          <div>
            <label className="text-sm font-medium text-gray-500">
              Reference Range
            </label>
            <p className="text-base">
              {obs.referenceRange[0]?.low?.value} -{" "}
              {obs.referenceRange[0]?.high?.value}{" "}
              {obs.referenceRange[0]?.low?.unit}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEncounter = (enc: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Status</label>
          <Badge>{enc.status}</Badge>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Class</label>
          <p className="text-base">{enc.class?.display || enc.class?.code}</p>
        </div>
        {enc.type && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">Type</label>
            <p className="text-base">
              {enc.type[0]?.coding?.[0]?.display || enc.type[0]?.text}
            </p>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-500">
            Period Start
          </label>
          <p className="text-base">{enc.period?.start}</p>
        </div>
        {enc.period?.end && (
          <div>
            <label className="text-sm font-medium text-gray-500">
              Period End
            </label>
            <p className="text-base">{enc.period.end}</p>
          </div>
        )}
        {enc.participant && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">
              Participants
            </label>
            <div className="space-y-1">
              {enc.participant.map((p: any, idx: number) => (
                <p key={idx} className="text-base">
                  {p.individual?.display || p.individual?.reference}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMedicationRequest = (med: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">
            Medication
          </label>
          <p className="text-base">
            {med.medicationCodeableConcept?.text ||
              med.medicationCodeableConcept?.coding?.[0]?.display}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Status</label>
          <Badge>{med.status}</Badge>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Intent</label>
          <Badge variant="secondary">{med.intent}</Badge>
        </div>
        {med.authoredOn && (
          <div>
            <label className="text-sm font-medium text-gray-500">
              Authored
            </label>
            <p className="text-base">{med.authoredOn}</p>
          </div>
        )}
        {med.dosageInstruction && med.dosageInstruction.length > 0 && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">
              Dosage Instructions
            </label>
            <p className="text-base">{med.dosageInstruction[0]?.text}</p>
          </div>
        )}
        {med.dispenseRequest && (
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">
              Dispense Request
            </label>
            <div className="grid grid-cols-2 gap-2">
              {med.dispenseRequest.numberOfRepeatsAllowed !== undefined && (
                <p className="text-sm">
                  Refills: {med.dispenseRequest.numberOfRepeatsAllowed}
                </p>
              )}
              {med.dispenseRequest.quantity && (
                <p className="text-sm">
                  Quantity: {med.dispenseRequest.quantity.value}{" "}
                  {med.dispenseRequest.quantity.unit}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGeneric = (res: any) => (
    <div className="space-y-4">
      {Object.entries(res).map(([key, value]) => {
        if (key === "resourceType" || key === "id" || key === "meta")
          return null;
        if (typeof value === "object" && value !== null) {
          return (
            <div key={key}>
              <label className="text-sm font-medium text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          );
        }
        return (
          <div key={key}>
            <label className="text-sm font-medium text-gray-500 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </label>
            <p className="text-base">{String(value)}</p>
          </div>
        );
      })}
    </div>
  );

  const renderFormatted = () => {
    switch (resource.resourceType) {
      case "Patient":
        return renderPatient(resource);
      case "Observation":
        return renderObservation(resource);
      case "Encounter":
        return renderEncounter(resource);
      case "MedicationRequest":
        return renderMedicationRequest(resource);
      default:
        return renderGeneric(resource);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getResourceIcon(resource.resourceType)}
            <div>
              <CardTitle className="text-xl">
                {resource.resourceType}
                {resource.id && (
                  <span className="text-gray-400 ml-2">#{resource.id}</span>
                )}
              </CardTitle>
              {resource.meta?.lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated:{" "}
                  {new Date(resource.meta.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadJSON}>
              <Download className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="formatted" className="flex-1">
              Formatted
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              JSON
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex-1">
              Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formatted" className="mt-4">
            {renderFormatted()}
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(resource, null, 2)}
            </pre>
          </TabsContent>

          <TabsContent value="metadata" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Resource Type
                </label>
                <p className="text-base font-mono">{resource.resourceType}</p>
              </div>
              {resource.id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Resource ID
                  </label>
                  <p className="text-base font-mono">{resource.id}</p>
                </div>
              )}
              {resource.meta && (
                <>
                  {resource.meta.versionId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Version ID
                      </label>
                      <p className="text-base font-mono">
                        {resource.meta.versionId}
                      </p>
                    </div>
                  )}
                  {resource.meta.lastUpdated && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Last Updated
                      </label>
                      <p className="text-base">{resource.meta.lastUpdated}</p>
                    </div>
                  )}
                  {resource.meta.profile && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Profiles
                      </label>
                      <div className="space-y-1">
                        {resource.meta.profile.map(
                          (profile: string, idx: number) => (
                            <p
                              key={idx}
                              className="text-sm font-mono flex items-center gap-2"
                            >
                              {profile}
                              <ExternalLink className="h-3 w-3" />
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
