import { NextRequest, NextResponse } from "next/server";
import { ClinicalNote } from "@/types/clinical";

// Mock data
let notes: ClinicalNote[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const note = notes.find((n) => n.id === params.id);

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(note);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const index = notes.findIndex((n) => n.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const body = await request.json();

  notes[index] = {
    ...notes[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(notes[index]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const index = notes.findIndex((n) => n.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const body = await request.json();

  // Handle signing
  if (body.signed) {
    notes[index] = {
      ...notes[index],
      signed: true,
      signedBy: body.signedBy || notes[index].providerName,
      signedAt: body.signedAt || new Date().toISOString(),
      signature: body.signature,
      updatedAt: new Date().toISOString(),
    };
  } else {
    notes[index] = {
      ...notes[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
  }

  return NextResponse.json(notes[index]);
}
