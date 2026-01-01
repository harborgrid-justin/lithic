"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import {
  Copy,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
} from "lucide-react";
import { HL7Parser, type HL7Message, type HL7Segment } from "@/lib/hl7/parser";

interface HL7MessageViewerProps {
  message?: string;
  onParse?: (parsed: HL7Message) => void;
}

export function HL7MessageViewer({
  message: initialMessage,
  onParse,
}: HL7MessageViewerProps) {
  const [message, setMessage] = useState(initialMessage || "");
  const [parsedMessage, setParsedMessage] = useState<HL7Message | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("formatted");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (initialMessage) {
      parseMessage(initialMessage);
    }
  }, [initialMessage]);

  const parseMessage = (msg: string) => {
    try {
      const parser = new HL7Parser();
      const parsed = parser.parse(msg);
      const validation = parser.validate(parsed);

      setParsedMessage(parsed);
      setError(validation.valid ? null : validation.errors.join(", "));

      if (onParse) {
        onParse(parsed);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse HL7 message",
      );
      setParsedMessage(null);
    }
  };

  const handleParse = () => {
    parseMessage(message);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    alert("Copied to clipboard");
  };

  const downloadMessage = () => {
    const blob = new Blob([message], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hl7-message-${Date.now()}.hl7`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMessageTypeDisplay = (type: string): string => {
    const types: Record<string, string> = {
      "ADT^A01": "Admit Patient",
      "ADT^A03": "Discharge Patient",
      "ADT^A04": "Register Patient",
      "ADT^A08": "Update Patient",
      "ORM^O01": "Order Message",
      "ORU^R01": "Observation Result",
      "SIU^S12": "Schedule Appointment",
      "DFT^P03": "Post Detail Financial",
    };
    return types[type] || type;
  };

  const getSegmentColor = (name: string): string => {
    const colors: Record<string, string> = {
      MSH: "bg-blue-100 text-blue-800",
      PID: "bg-green-100 text-green-800",
      PV1: "bg-purple-100 text-purple-800",
      OBX: "bg-yellow-100 text-yellow-800",
      OBR: "bg-orange-100 text-orange-800",
      ORC: "bg-pink-100 text-pink-800",
      DG1: "bg-red-100 text-red-800",
    };
    return colors[name] || "bg-gray-100 text-gray-800";
  };

  const renderSegmentField = (segment: HL7Segment, fieldIndex: number) => {
    const field = segment.fields[fieldIndex - 1];
    if (!field || field.length === 0)
      return <span className="text-gray-400">-</span>;

    if (field.length === 1 && field[0].length === 1) {
      return <span>{field[0][0] || "-"}</span>;
    }

    return (
      <div className="space-y-1">
        {field.map((repetition, repIdx) => (
          <div key={repIdx}>
            {repetition.map((component, compIdx) => (
              <div key={compIdx} className="text-sm">
                {compIdx > 0 && <span className="text-gray-400 mr-1">^</span>}
                {component}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderMSH = (segment: HL7Segment) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">
            Sending Application
          </label>
          <p className="text-base">{renderSegmentField(segment, 3)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Sending Facility
          </label>
          <p className="text-base">{renderSegmentField(segment, 4)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Receiving Application
          </label>
          <p className="text-base">{renderSegmentField(segment, 5)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Receiving Facility
          </label>
          <p className="text-base">{renderSegmentField(segment, 6)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Message Type
          </label>
          <p className="text-base">{renderSegmentField(segment, 9)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Control ID
          </label>
          <p className="text-base font-mono">
            {renderSegmentField(segment, 10)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Version</label>
          <p className="text-base">{renderSegmentField(segment, 12)}</p>
        </div>
      </div>
    </div>
  );

  const renderPID = (segment: HL7Segment) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">
            Patient ID (MRN)
          </label>
          <p className="text-base font-mono">
            {renderSegmentField(segment, 3)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Patient Name
          </label>
          <p className="text-base">{renderSegmentField(segment, 5)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Date of Birth
          </label>
          <p className="text-base">{renderSegmentField(segment, 7)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Gender</label>
          <p className="text-base">{renderSegmentField(segment, 8)}</p>
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-500">Address</label>
          <p className="text-base">{renderSegmentField(segment, 11)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Phone</label>
          <p className="text-base">{renderSegmentField(segment, 13)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">SSN</label>
          <p className="text-base font-mono">
            {renderSegmentField(segment, 19)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderOBX = (segment: HL7Segment) => (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">
            Value Type
          </label>
          <p className="text-base">{renderSegmentField(segment, 2)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Observation ID
          </label>
          <p className="text-base">{renderSegmentField(segment, 3)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Value</label>
          <p className="text-base font-semibold">
            {renderSegmentField(segment, 5)}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Units</label>
          <p className="text-base">{renderSegmentField(segment, 6)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Reference Range
          </label>
          <p className="text-base">{renderSegmentField(segment, 7)}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">
            Abnormal Flags
          </label>
          <Badge
            variant={
              segment.fields[7]?.[0]?.[0] === "H" ||
              segment.fields[7]?.[0]?.[0] === "L"
                ? "danger"
                : "secondary"
            }
          >
            {renderSegmentField(segment, 8)}
          </Badge>
        </div>
      </div>
    </div>
  );

  const renderSegment = (segment: HL7Segment) => {
    switch (segment.name) {
      case "MSH":
        return renderMSH(segment);
      case "PID":
        return renderPID(segment);
      case "OBX":
        return renderOBX(segment);
      default:
        return (
          <div className="grid grid-cols-3 gap-2">
            {segment.fields.map((field, idx) => (
              <div key={idx}>
                <label className="text-xs font-medium text-gray-500">
                  Field {idx + 1}
                </label>
                <p className="text-sm">
                  {renderSegmentField(segment, idx + 1)}
                </p>
              </div>
            ))}
          </div>
        );
    }
  };

  const filteredSegments = parsedMessage?.segments.filter(
    (seg) =>
      !searchTerm ||
      seg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seg.raw.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle className="text-xl">HL7 Message Viewer</CardTitle>
              {parsedMessage && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getSegmentColor("MSH")}>
                    {getMessageTypeDisplay(parsedMessage.messageType)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Version {parsedMessage.version}
                  </span>
                  <span className="text-sm text-gray-500">
                    ID: {parsedMessage.messageControlId}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadMessage}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="danger">
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-2">
              <p className="font-semibold">Parse Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="formatted" className="flex-1">
              Formatted
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex-1">
              Raw Message
            </TabsTrigger>
            <TabsTrigger value="segments" className="flex-1">
              Segments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formatted" className="mt-4 space-y-4">
            {parsedMessage ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search segments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Badge variant="secondary">
                    {filteredSegments?.length || 0} segments
                  </Badge>
                </div>

                <div className="space-y-3">
                  {filteredSegments?.map((segment, idx) => (
                    <Card key={idx}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getSegmentColor(segment.name)}>
                            {segment.name}
                          </Badge>
                          <span className="text-xs text-gray-500 font-mono">
                            {segment.fields.length} fields
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        {renderSegment(segment)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Enter an HL7 message below and click Parse to view formatted
                data
              </div>
            )}
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste HL7 message here..."
              className="font-mono text-xs min-h-[400px]"
            />
            <Button onClick={handleParse} className="mt-3">
              Parse Message
            </Button>
          </TabsContent>

          <TabsContent value="segments" className="mt-4">
            {parsedMessage ? (
              <div className="space-y-2">
                {parsedMessage.segments.map((segment, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSegmentColor(segment.name)}>
                        {segment.name}
                      </Badge>
                    </div>
                    <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                      {segment.raw}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No message parsed
              </div>
            )}
          </TabsContent>
        </Tabs>

        {parsedMessage && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">
                Message parsed successfully - {parsedMessage.segments.length}{" "}
                segments found
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
