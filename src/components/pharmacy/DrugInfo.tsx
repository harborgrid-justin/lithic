/**
 * Drug Info Component
 * Display detailed drug information
 */

"use client";

import { useEffect, useState } from "react";
import { pharmacyService } from "@/services/pharmacy.service";

interface DrugInfoProps {
  drugId: string;
}

export function DrugInfo({ drugId }: DrugInfoProps) {
  const [drugInfo, setDrugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    loadDrugInfo();
  }, [drugId]);

  const loadDrugInfo = async () => {
    try {
      setLoading(true);
      const data = await pharmacyService.getDrugInfo(drugId);
      setDrugInfo(data);
    } catch (error) {
      console.error("Failed to load drug info:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading drug information...</div>
    );
  }

  if (!drugInfo) {
    return (
      <div className="text-sm text-gray-500">
        Drug information not available
      </div>
    );
  }

  const Section = ({
    title,
    content,
    section,
  }: {
    title: string;
    content?: string;
    section: string;
  }) => {
    if (!content) return null;

    const isExpanded = expandedSections.includes(section);

    return (
      <div className="border-b border-gray-200 pb-3 mb-3">
        <button
          onClick={() => toggleSection(section)}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
          <span className="text-gray-500">{isExpanded ? "−" : "+"}</span>
        </button>
        {isExpanded && (
          <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3 text-sm pb-3 border-b border-gray-200">
        <div>
          <span className="font-medium text-gray-700">Generic Name:</span>
          <div className="text-gray-900">{drugInfo.genericName}</div>
        </div>
        <div>
          <span className="font-medium text-gray-700">Brand Name:</span>
          <div className="text-gray-900">{drugInfo.brandName || "N/A"}</div>
        </div>
        <div>
          <span className="font-medium text-gray-700">Strength:</span>
          <div className="text-gray-900">{drugInfo.strength}</div>
        </div>
        <div>
          <span className="font-medium text-gray-700">Dosage Form:</span>
          <div className="text-gray-900">{drugInfo.dosageForm}</div>
        </div>
        <div>
          <span className="font-medium text-gray-700">Manufacturer:</span>
          <div className="text-gray-900">{drugInfo.manufacturer}</div>
        </div>
        <div>
          <span className="font-medium text-gray-700">NDC:</span>
          <div className="text-gray-900 font-mono">{drugInfo.ndc}</div>
        </div>
        {drugInfo.deaSchedule && (
          <div>
            <span className="font-medium text-gray-700">DEA Schedule:</span>
            <div className="text-orange-600 font-semibold">
              C-{drugInfo.deaSchedule}
            </div>
          </div>
        )}
        <div>
          <span className="font-medium text-gray-700">Therapeutic Class:</span>
          <div className="text-gray-900">{drugInfo.therapeutic_class}</div>
        </div>
      </div>

      {/* Expandable Sections */}
      <Section
        title="Indications"
        content={drugInfo.indications}
        section="indications"
      />

      <Section
        title="Dosage and Administration"
        content={drugInfo.dosageAndAdministration}
        section="dosage"
      />

      <Section
        title="Contraindications"
        content={drugInfo.contraindications}
        section="contraindications"
      />

      <Section
        title="Warnings and Precautions"
        content={drugInfo.warnings}
        section="warnings"
      />

      <Section
        title="Adverse Reactions"
        content={drugInfo.adverseReactions}
        section="adverseReactions"
      />

      {!drugInfo.indications &&
        !drugInfo.dosageAndAdministration &&
        !drugInfo.contraindications &&
        !drugInfo.warnings &&
        !drugInfo.adverseReactions && (
          <div className="text-sm text-gray-500 italic">
            Detailed drug information not available. Please consult prescribing
            information.
          </div>
        )}
    </div>
  );
}
