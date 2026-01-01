"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ClinicalNote } from "@/types/clinical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface NoteEditorProps {
  note?: ClinicalNote;
  onSubmit: (data: Partial<ClinicalNote>) => void;
  onCancel: () => void;
  onSign?: (signature: string) => void;
}

export function NoteEditor({
  note,
  onSubmit,
  onCancel,
  onSign,
}: NoteEditorProps) {
  const [formData, setFormData] = useState<Partial<ClinicalNote>>({
    patientId: note?.patientId || "",
    patientName: note?.patientName || "",
    providerId: note?.providerId || "",
    providerName: note?.providerName || "",
    encounterId: note?.encounterId || "",
    type: note?.type || "soap",
    title: note?.title || "",
    content: note?.content || "",
    subjective: note?.subjective || "",
    objective: note?.objective || "",
    assessment: note?.assessment || "",
    plan: note?.plan || "",
  });

  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSign = () => {
    if (signature && onSign) {
      onSign(signature);
      setShowSignature(false);
    }
  };

  const handleChange = (field: keyof ClinicalNote, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {note ? "Edit Clinical Note" : "New Clinical Note"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Note Type</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value as any)}
                required
              >
                <option value="soap">SOAP Note</option>
                <option value="progress">Progress Note</option>
                <option value="admission">Admission Note</option>
                <option value="discharge">Discharge Summary</option>
                <option value="procedure">Procedure Note</option>
                <option value="consultation">Consultation Note</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>
          </div>

          {formData.type === "soap" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="subjective">Subjective</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.subjective}
                  onChange={(value) => handleChange("subjective", value)}
                  modules={modules}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.objective}
                  onChange={(value) => handleChange("objective", value)}
                  modules={modules}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessment">Assessment</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.assessment}
                  onChange={(value) => handleChange("assessment", value)}
                  modules={modules}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.plan}
                  onChange={(value) => handleChange("plan", value)}
                  modules={modules}
                  className="bg-white"
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(value) => handleChange("content", value)}
                modules={modules}
                className="bg-white min-h-[400px]"
              />
            </div>
          )}

          {showSignature && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="signature">Electronic Signature</Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name to sign"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {note && !note.signed && onSign && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowSignature(!showSignature)}
              >
                {showSignature ? "Cancel Sign" : "Sign Note"}
              </Button>
            )}
            {showSignature && (
              <Button type="button" onClick={handleSign}>
                Apply Signature
              </Button>
            )}
            <Button type="submit">{note ? "Update" : "Create"} Note</Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
