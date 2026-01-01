/**
 * Pre-Op Checklist Automation
 * Manages required items verification and documentation checks
 */

import type { SurgicalCase, PreferenceCard } from "@/types/or-management";

export interface PrepChecklist {
  caseId: string;
  sections: ChecklistSection[];
  overallCompletion: number;
  requiredItemsComplete: boolean;
  readyForOR: boolean;
  generatedAt: Date;
  lastUpdated: Date;
}

export interface ChecklistSection {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
  completion: number;
  required: boolean;
}

export interface ChecklistItem {
  id: string;
  description: string;
  category: string;
  required: boolean;
  completed: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  notes: string | null;
  alertIfIncomplete: boolean;
}

export class PrepChecklistManager {
  generateChecklist(
    surgicalCase: SurgicalCase,
    preferenceCard?: PreferenceCard
  ): PrepChecklist {
    const sections: ChecklistSection[] = [
      this.generatePatientSection(surgicalCase),
      this.generateConsentSection(surgicalCase),
      this.generateLabsSection(surgicalCase),
      this.generateEquipmentSection(surgicalCase, preferenceCard),
      this.generateSuppliesSection(surgicalCase, preferenceCard),
      this.generateStaffingSection(surgicalCase),
      this.generateDocumentationSection(surgicalCase),
    ];

    const overallCompletion = this.calculateOverallCompletion(sections);
    const requiredItemsComplete = this.checkRequiredItems(sections);

    return {
      caseId: surgicalCase.id,
      sections,
      overallCompletion,
      requiredItemsComplete,
      readyForOR: requiredItemsComplete && overallCompletion === 100,
      generatedAt: new Date(),
      lastUpdated: new Date(),
    };
  }

  private generatePatientSection(surgicalCase: SurgicalCase): ChecklistSection {
    const items: ChecklistItem[] = [
      {
        id: "patient_id",
        description: "Verify patient identity with two identifiers",
        category: "Patient Safety",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
      {
        id: "allergy_check",
        description: "Review and confirm allergies",
        category: "Patient Safety",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
      {
        id: "npo_status",
        description: "Confirm NPO status (nothing by mouth)",
        category: "Patient Safety",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
      {
        id: "site_marking",
        description: surgicalCase.laterality
          ? `Confirm surgical site marked (${surgicalCase.laterality})`
          : "Confirm surgical site marked if applicable",
        category: "Patient Safety",
        required: !!surgicalCase.laterality,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: !!surgicalCase.laterality,
      },
    ];

    return {
      id: "patient",
      name: "Patient Preparation",
      description: "Patient identification and safety checks",
      items,
      completion: 0,
      required: true,
    };
  }

  private generateConsentSection(surgicalCase: SurgicalCase): ChecklistSection {
    const items: ChecklistItem[] = [
      {
        id: "consent_signed",
        description: "Surgical consent form signed",
        category: "Legal",
        required: true,
        completed: surgicalCase.consent.signed,
        completedBy: surgicalCase.consent.signedBy,
        completedAt: surgicalCase.consent.signedAt,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
      {
        id: "consent_witnessed",
        description: "Consent witnessed",
        category: "Legal",
        required: true,
        completed: !!surgicalCase.consent.witnessedBy,
        completedBy: surgicalCase.consent.witnessedBy,
        completedAt: surgicalCase.consent.signedAt,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
      {
        id: "anesthesia_consent",
        description: "Anesthesia consent obtained",
        category: "Legal",
        required: surgicalCase.anesthesiaType !== "LOCAL",
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
    ];

    if (surgicalCase.consent.specialConsents.length > 0) {
      surgicalCase.consent.specialConsents.forEach((special, idx) => {
        items.push({
          id: `special_consent_${idx}`,
          description: `Special consent: ${special}`,
          category: "Legal",
          required: true,
          completed: false,
          completedBy: null,
          completedAt: null,
          verified: false,
          verifiedBy: null,
          verifiedAt: null,
          notes: null,
          alertIfIncomplete: true,
        });
      });
    }

    return {
      id: "consent",
      name: "Consent & Documentation",
      description: "Required consent forms",
      items,
      completion: this.calculateSectionCompletion(items),
      required: true,
    };
  }

  private generateLabsSection(surgicalCase: SurgicalCase): ChecklistSection {
    const items: ChecklistItem[] = [
      {
        id: "lab_cbc",
        description: "CBC (Complete Blood Count) within 30 days",
        category: "Labs",
        required: surgicalCase.priority !== "ADD_ON",
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: false,
      },
      {
        id: "lab_cmp",
        description: "CMP (Comprehensive Metabolic Panel) within 30 days",
        category: "Labs",
        required: surgicalCase.estimatedDuration > 120,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: false,
      },
      {
        id: "lab_coags",
        description: "Coagulation studies (PT/PTT/INR)",
        category: "Labs",
        required: false,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: false,
      },
      {
        id: "type_screen",
        description: "Type and screen/crossmatch if needed",
        category: "Labs",
        required: surgicalCase.estimatedDuration > 180,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
    ];

    return {
      id: "labs",
      name: "Laboratory Results",
      description: "Required lab work",
      items,
      completion: 0,
      required: false,
    };
  }

  private generateEquipmentSection(
    surgicalCase: SurgicalCase,
    preferenceCard?: PreferenceCard
  ): ChecklistSection {
    const items: ChecklistItem[] = surgicalCase.equipmentNeeded.map((eq) => ({
      id: `equip_${eq.id}`,
      description: `${eq.equipmentName} (Qty: ${eq.quantity})`,
      category: "Equipment",
      required: eq.required,
      completed: eq.confirmed,
      completedBy: eq.confirmedBy,
      completedAt: eq.confirmedAt,
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
      notes: eq.notes,
      alertIfIncomplete: eq.required,
    }));

    if (preferenceCard) {
      preferenceCard.equipment.forEach((eq, idx) => {
        if (!surgicalCase.equipmentNeeded.find((e) => e.equipmentName === eq.name)) {
          items.push({
            id: `pref_equip_${idx}`,
            description: `${eq.name} (Preference Card)`,
            category: "Equipment",
            required: eq.required,
            completed: false,
            completedBy: null,
            completedAt: null,
            verified: false,
            verifiedBy: null,
            verifiedAt: null,
            notes: eq.notes,
            alertIfIncomplete: eq.required,
          });
        }
      });
    }

    return {
      id: "equipment",
      name: "Equipment",
      description: "Required surgical equipment",
      items,
      completion: this.calculateSectionCompletion(items),
      required: true,
    };
  }

  private generateSuppliesSection(
    surgicalCase: SurgicalCase,
    preferenceCard?: PreferenceCard
  ): ChecklistSection {
    const items: ChecklistItem[] = surgicalCase.suppliesNeeded.map((supply) => ({
      id: `supply_${supply.id}`,
      description: `${supply.supplyName} (${supply.quantity} ${supply.unit})`,
      category: "Supplies",
      required: supply.required,
      completed: supply.picked,
      completedBy: supply.pickedBy,
      completedAt: supply.pickedAt,
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
      notes: null,
      alertIfIncomplete: supply.required,
    }));

    if (preferenceCard) {
      preferenceCard.supplies.forEach((supply, idx) => {
        items.push({
          id: `pref_supply_${idx}`,
          description: `${supply.name} (${supply.quantity} ${supply.unit})`,
          category: "Supplies",
          required: supply.required,
          completed: false,
          completedBy: null,
          completedAt: null,
          verified: false,
          verifiedBy: null,
          verifiedAt: null,
          notes: null,
          alertIfIncomplete: supply.required,
        });
      });
    }

    return {
      id: "supplies",
      name: "Surgical Supplies",
      description: "Required surgical supplies",
      items,
      completion: this.calculateSectionCompletion(items),
      required: true,
    };
  }

  private generateStaffingSection(surgicalCase: SurgicalCase): ChecklistSection {
    const items: ChecklistItem[] = surgicalCase.teamMembers.map((member) => ({
      id: `staff_${member.id}`,
      description: `${member.role}: ${member.name}${member.isPrimary ? " (Primary)" : ""}`,
      category: "Staffing",
      required: member.isPrimary,
      completed: true,
      completedBy: "System",
      completedAt: new Date(),
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
      notes: null,
      alertIfIncomplete: member.isPrimary,
    }));

    return {
      id: "staffing",
      name: "Surgical Team",
      description: "Assigned team members",
      items,
      completion: this.calculateSectionCompletion(items),
      required: true,
    };
  }

  private generateDocumentationSection(surgicalCase: SurgicalCase): ChecklistSection {
    const items: ChecklistItem[] = [
      {
        id: "h_and_p",
        description: "History & Physical within 30 days",
        category: "Documentation",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
      {
        id: "pre_op_note",
        description: "Pre-operative note completed",
        category: "Documentation",
        required: true,
        completed: surgicalCase.preOpCompleted,
        completedBy: null,
        completedAt: surgicalCase.preOpCompletedAt,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
      {
        id: "anesthesia_eval",
        description: "Anesthesia evaluation completed",
        category: "Documentation",
        required: surgicalCase.anesthesiaType !== "LOCAL",
        completed: false,
        completedBy: null,
        completedAt: null,
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        notes: null,
        alertIfIncomplete: true,
      },
    ];

    return {
      id: "documentation",
      name: "Documentation",
      description: "Required clinical documentation",
      items,
      completion: this.calculateSectionCompletion(items),
      required: true,
    };
  }

  private calculateSectionCompletion(items: ChecklistItem[]): number {
    if (items.length === 0) return 100;
    const completed = items.filter((i) => i.completed).length;
    return Math.round((completed / items.length) * 100);
  }

  private calculateOverallCompletion(sections: ChecklistSection[]): number {
    const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
    if (totalItems === 0) return 100;

    const completedItems = sections.reduce(
      (sum, s) => sum + s.items.filter((i) => i.completed).length,
      0
    );

    return Math.round((completedItems / totalItems) * 100);
  }

  private checkRequiredItems(sections: ChecklistSection[]): boolean {
    for (const section of sections) {
      const requiredIncomplete = section.items.some(
        (item) => item.required && !item.completed
      );
      if (requiredIncomplete) return false;
    }
    return true;
  }

  updateItem(
    checklist: PrepChecklist,
    itemId: string,
    completed: boolean,
    completedBy?: string,
    notes?: string
  ): PrepChecklist {
    const updatedSections = checklist.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            completed,
            completedBy: completedBy || null,
            completedAt: completed ? new Date() : null,
            notes: notes || item.notes,
          };
        }
        return item;
      }),
      completion: this.calculateSectionCompletion(
        section.items.map((item) => {
          if (item.id === itemId) {
            return { ...item, completed };
          }
          return item;
        })
      ),
    }));

    return {
      ...checklist,
      sections: updatedSections,
      overallCompletion: this.calculateOverallCompletion(updatedSections),
      requiredItemsComplete: this.checkRequiredItems(updatedSections),
      readyForOR:
        this.checkRequiredItems(updatedSections) &&
        this.calculateOverallCompletion(updatedSections) === 100,
      lastUpdated: new Date(),
    };
  }

  getIncompleteRequiredItems(checklist: PrepChecklist): ChecklistItem[] {
    const incomplete: ChecklistItem[] = [];

    for (const section of checklist.sections) {
      for (const item of section.items) {
        if (item.required && !item.completed) {
          incomplete.push(item);
        }
      }
    }

    return incomplete;
  }
}

let managerInstance: PrepChecklistManager | null = null;

export function getPrepChecklistManager(): PrepChecklistManager {
  if (!managerInstance) {
    managerInstance = new PrepChecklistManager();
  }
  return managerInstance;
}
