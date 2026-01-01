/**
 * Whiteboard Page
 * Individual collaborative whiteboard
 */

"use client";

import React from "react";
import { WhiteboardCanvas } from "@/components/collaboration/whiteboard-canvas";

export default function WhiteboardPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen">
      <WhiteboardCanvas
        whiteboardId={params.id}
        userId="current-user-id" // Should come from auth
      />
    </div>
  );
}
