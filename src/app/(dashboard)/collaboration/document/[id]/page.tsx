/**
 * Collaborative Document Page
 * Individual collaborative document editor
 */

"use client";

import React from "react";
import { CollaborativeDoc } from "@/components/collaboration/collaborative-doc";

export default function DocumentPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen">
      <CollaborativeDoc
        documentId={params.id}
        userId="current-user-id" // Should come from auth
        userName="Current User" // Should come from auth
      />
    </div>
  );
}
