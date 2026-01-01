"use client";

import { ClinicalNote } from "@/types/clinical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

interface SOAPNoteProps {
  note: ClinicalNote;
}

export function SOAPNote({ note }: SOAPNoteProps) {
  if (note.type !== "soap") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{note.title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {note.providerName} • {formatDateTime(note.createdAt)}
            </p>
          </div>
          {note.signed && (
            <Badge variant="success">
              <FileCheck className="h-3 w-3 mr-1" />
              Signed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              S
            </div>
            <h3 className="text-lg font-semibold">Subjective</h3>
          </div>
          <div className="ml-10">
            {note.subjective ? (
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: note.subjective }}
              />
            ) : (
              <p className="text-gray-400 italic">
                No subjective data recorded
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
              O
            </div>
            <h3 className="text-lg font-semibold">Objective</h3>
          </div>
          <div className="ml-10">
            {note.objective ? (
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: note.objective }}
              />
            ) : (
              <p className="text-gray-400 italic">No objective data recorded</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              A
            </div>
            <h3 className="text-lg font-semibold">Assessment</h3>
          </div>
          <div className="ml-10">
            {note.assessment ? (
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: note.assessment }}
              />
            ) : (
              <p className="text-gray-400 italic">No assessment recorded</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
              P
            </div>
            <h3 className="text-lg font-semibold">Plan</h3>
          </div>
          <div className="ml-10">
            {note.plan ? (
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: note.plan }}
              />
            ) : (
              <p className="text-gray-400 italic">No plan recorded</p>
            )}
          </div>
        </div>

        {note.signed && note.signature && (
          <>
            <Separator />
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700">
                Electronically Signed:
              </p>
              <p className="text-sm text-gray-600 mt-1">{note.signature}</p>
              <p className="text-xs text-gray-500 mt-1">
                Signed on {formatDateTime(note.signedAt || "")}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
