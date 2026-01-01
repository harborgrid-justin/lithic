/**
 * Collaborative Document Component
 */

"use client";

import React, { useState, useEffect } from "react";
import { CollaborativeEditor } from "@/lib/collaboration/docs/collaborative-editor";
import { Button } from "@/components/ui/button";
import { Save, Download, History } from "lucide-react";

interface CollaborativeDocProps {
  documentId: string;
  userId: string;
  userName: string;
}

export function CollaborativeDoc({
  documentId,
  userId,
  userName,
}: CollaborativeDocProps) {
  const [editor, setEditor] = useState<CollaborativeEditor | null>(null);
  const [content, setContent] = useState("");
  const [cursors, setCursors] = useState<any[]>([]);

  useEffect(() => {
    const editorInstance = new CollaborativeEditor(documentId, userId, userName);

    editorInstance.on("synced", ({ content }: any) => {
      setContent(content);
    });

    editorInstance.on("change:remote", ({ content }: any) => {
      setContent(content);
    });

    editorInstance.on("cursor:updated", (cursor: any) => {
      setCursors((prev) => {
        const filtered = prev.filter((c) => c.userId !== cursor.userId);
        return [...filtered, cursor];
      });
    });

    setEditor(editorInstance);

    return () => {
      editorInstance.disconnect();
    };
  }, [documentId, userId, userName]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (editor) {
      // Simple diff - in production use proper diff algorithm
      if (newContent.length > content.length) {
        editor.insertText(content.length, newContent.slice(content.length));
      } else if (newContent.length < content.length) {
        editor.deleteText(newContent.length, content.length - newContent.length);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-4">
        <Button size="sm">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button size="sm" variant="outline">
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      </div>

      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="h-full w-full resize-none rounded border p-4 font-mono text-sm focus:outline-none focus:ring-2"
          placeholder="Start typing..."
        />
      </div>

      {/* Typing indicators */}
      {cursors.length > 0 && (
        <div className="border-t p-2 text-sm text-gray-500">
          {cursors.map((c) => c.userName).join(", ")} is typing...
        </div>
      )}
    </div>
  );
}
