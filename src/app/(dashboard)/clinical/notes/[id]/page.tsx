"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClinicalNote as ClinicalNoteType } from "@/types/clinical";
import { getClinicalNote, signClinicalNote } from "@/services/clinical.service";
import { ClinicalNote } from "@/components/clinical/ClinicalNote";
import { SOAPNote } from "@/components/clinical/SOAPNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileSignature } from "lucide-react";

export default function ClinicalNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<ClinicalNoteType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState("");

  useEffect(() => {
    if (params.id) {
      loadNote(params.id as string);
    }
  }, [params.id]);

  const loadNote = async (id: string) => {
    try {
      const data = await getClinicalNote(id);
      setNote(data);
    } catch (error) {
      console.error("Failed to load note:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!note || !signature) return;
    try {
      const updated = await signClinicalNote(note.id, signature);
      setNote(updated);
      setShowSignature(false);
      setSignature("");
    } catch (error) {
      console.error("Failed to sign note:", error);
      alert("Failed to sign note. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Clinical Note
              </h1>
            </div>
          </div>
          {!note.signed && (
            <Button onClick={() => setShowSignature(!showSignature)}>
              <FileSignature className="h-4 w-4 mr-2" />
              Sign Note
            </Button>
          )}
        </div>

        {showSignature && (
          <Card>
            <CardHeader>
              <CardTitle>Electronic Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature">
                  Type your full name to sign this note
                </Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSign} disabled={!signature}>
                  Apply Signature
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSignature(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {note.type === "soap" ? (
          <SOAPNote note={note} />
        ) : (
          <ClinicalNote note={note} />
        )}
      </div>
    </div>
  );
}
