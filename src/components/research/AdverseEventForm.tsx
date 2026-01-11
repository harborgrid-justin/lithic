/**
 * Adverse Event Form Component
 */

"use client";

import { useState } from "react";
import { useResearchData } from "@/hooks/useResearchData";
import { AESeverity, AESeriousness, Causality } from "@/types/research";

export function AdverseEventForm({ subjectId, trialId, siteId }: any) {
  const { reportAdverseEvent, loading } = useResearchData();
  const [formData, setFormData] = useState({
    term: "",
    verbatimTerm: "",
    severity: AESeverity.MILD,
    seriousness: AESeriousness.NON_SERIOUS,
    causality: Causality.POSSIBLE,
    onsetDate: "",
    narrativeSummary: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await reportAdverseEvent({ ...formData, subjectId, trialId, siteId });
      alert("Adverse event reported successfully");
    } catch (error) {
      console.error("Failed to report AE:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-xl font-semibold">Report Adverse Event</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Event Term <span className="text-red-500">*</span></label>
        <input type="text" required className="w-full px-3 py-2 border rounded-lg" value={formData.term} onChange={(e) => setFormData({...formData, term: e.target.value})} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity <span className="text-red-500">*</span></label>
        <select required className="w-full px-3 py-2 border rounded-lg" value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value as AESeverity})}>
          <option value={AESeverity.MILD}>Mild</option>
          <option value={AESeverity.MODERATE}>Moderate</option>
          <option value={AESeverity.SEVERE}>Severe</option>
          <option value={AESeverity.LIFE_THREATENING}>Life Threatening</option>
          <option value={AESeverity.FATAL}>Fatal</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Seriousness <span className="text-red-500">*</span></label>
        <select required className="w-full px-3 py-2 border rounded-lg" value={formData.seriousness} onChange={(e) => setFormData({...formData, seriousness: e.target.value as AESeriousness})}>
          <option value={AESeriousness.NON_SERIOUS}>Non-Serious</option>
          <option value={AESeriousness.SERIOUS}>Serious</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Causality <span className="text-red-500">*</span></label>
        <select required className="w-full px-3 py-2 border rounded-lg" value={formData.causality} onChange={(e) => setFormData({...formData, causality: e.target.value as Causality})}>
          <option value={Causality.UNRELATED}>Unrelated</option>
          <option value={Causality.UNLIKELY}>Unlikely</option>
          <option value={Causality.POSSIBLE}>Possible</option>
          <option value={Causality.PROBABLE}>Probable</option>
          <option value={Causality.DEFINITE}>Definite</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Onset Date <span className="text-red-500">*</span></label>
        <input type="date" required className="w-full px-3 py-2 border rounded-lg" value={formData.onsetDate} onChange={(e) => setFormData({...formData, onsetDate: e.target.value})} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Narrative Summary <span className="text-red-500">*</span></label>
        <textarea required rows={4} className="w-full px-3 py-2 border rounded-lg" value={formData.narrativeSummary} onChange={(e) => setFormData({...formData, narrativeSummary: e.target.value})} />
      </div>

      <button type="submit" disabled={loading} className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
        {loading ? "Reporting..." : "Report Adverse Event"}
      </button>
    </form>
  );
}
