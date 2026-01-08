"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ZCodeSuggestion } from "@/types/sdoh";

interface ZCodeSuggesterProps {
  suggestions: ZCodeSuggestion[];
  onApply: (code: string) => void;
}

export function ZCodeSuggester({ suggestions, onApply }: ZCodeSuggesterProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Suggested ICD-10 Z-Codes</h3>
      {suggestions.map((suggestion) => (
        <Card key={suggestion.zCode.code} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <code className="font-mono font-semibold">
                  {suggestion.zCode.code}
                </code>
                <Badge>
                  {suggestion.confidence}% confidence
                </Badge>
              </div>
              <p className="text-sm mt-1">{suggestion.zCode.display}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {suggestion.reasoning}
              </p>
            </div>
            <Button variant="outline" onClick={() => onApply(suggestion.zCode.code)}>
              Apply
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
