/**
 * Pedigree Chart Component - Family pedigree visualization
 */

"use client";

import React from "react";
import type { FamilyPedigree } from "@/types/genomics";

interface PedigreeChartProps {
  pedigree: FamilyPedigree;
}

export function PedigreeChart({ pedigree }: PedigreeChartProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{pedigree.title}</h2>
      <div className="space-y-6">
        {/* Simplified pedigree visualization */}
        {Array.from({ length: pedigree.generations }).map((_, genIdx) => {
          const membersInGen = pedigree.members.filter(m => m.generation === genIdx);
          return (
            <div key={genIdx} className="flex items-center justify-center space-x-4">
              <span className="text-sm text-gray-500 mr-4">Gen {genIdx + 1}</span>
              {membersInGen.map(member => (
                <div
                  key={member.id}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    member.isAffected ? "bg-red-100 border-red-500" : "bg-gray-100 border-gray-400"
                  } ${member.isProband ? "ring-4 ring-blue-300" : ""}`}
                  title={`${member.relationship}${member.isDeceased ? " (Deceased)" : ""}`}
                >
                  {member.gender === "MALE" ? "M" : member.gender === "FEMALE" ? "F" : "?"}
                  {member.isDeceased && <div className="absolute top-0 left-0 w-full h-full border-t-2 border-gray-600 transform rotate-45"></div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-100 border-red-500 border-2 mr-2"></div>Affected</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-gray-100 border-gray-400 border-2 mr-2"></div>Unaffected</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full ring-2 ring-blue-300 bg-gray-100 border-gray-400 border-2 mr-2"></div>Proband</div>
        </div>
      </div>
    </div>
  );
}

export default PedigreeChart;
