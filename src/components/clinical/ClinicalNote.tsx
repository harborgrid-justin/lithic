"use client";

import { ClinicalNote as ClinicalNoteType } from "@/types/clinical";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, User, Calendar } from "lucide-react";

interface ClinicalNoteProps {
  note: ClinicalNoteType;
}

export function ClinicalNote({ note }: ClinicalNoteProps) {
  const getTypeLabel = (type: ClinicalNoteType["type"]) => {
    const labels = {
      soap: "SOAP Note",
      progress: "Progress Note",
      admission: "Admission Note",
      discharge: "Discharge Summary",
      procedure: "Procedure Note",
      consultation: "Consultation Note",
    };
    return labels[type];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {note.title}
              {note.signed && (
                <Badge variant="success">
                  <FileCheck className="h-3 w-3 mr-1" />
                  Signed
                </Badge>
              )}
            </CardTitle>
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{note.providerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(note.createdAt)}</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary">{getTypeLabel(note.type)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {note.type === "soap" && (
          <>
            {note.subjective && (
              <div>
                <h4 className="font-semibold mb-1">Subjective</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {note.subjective}
                </p>
              </div>
            )}
            {note.objective && (
              <div>
                <h4 className="font-semibold mb-1">Objective</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {note.objective}
                </p>
              </div>
            )}
            {note.assessment && (
              <div>
                <h4 className="font-semibold mb-1">Assessment</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {note.assessment}
                </p>
              </div>
            )}
            {note.plan && (
              <div>
                <h4 className="font-semibold mb-1">Plan</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{note.plan}</p>
              </div>
            )}
          </>
        )}
        {note.type !== "soap" && note.content && (
          <div>
            <div
              className="text-gray-700 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </div>
        )}

        {note.signed && note.signature && (
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <p className="font-semibold">Electronically signed by:</p>
              <p className="mt-1">{note.signature}</p>
              <p className="text-xs text-gray-500 mt-1">
                Signed on {formatDateTime(note.signedAt || "")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
