/**
 * Surgeon Preference Cards
 * Manages surgeon preferences for procedures, equipment, and setup requirements
 */

import type {
  PreferenceCard,
  PreferenceEquipment,
  PreferenceSupply,
  PreferenceInstrument,
  SurgicalCase,
} from "@/types/or-management";

// ============================================================================
// Types
// ============================================================================

export interface PreferenceCardTemplate {
  procedureCategory: string;
  commonEquipment: PreferenceEquipment[];
  commonSupplies: PreferenceSupply[];
  commonInstruments: PreferenceInstrument[];
}

export interface PreferenceMatch {
  cardId: string;
  matchScore: number;
  missingItems: string[];
  substitutions: Array<{
    requested: string;
    available: string;
  }>;
}

export interface SetupChecklist {
  roomSetup: ChecklistItem[];
  equipment: ChecklistItem[];
  supplies: ChecklistItem[];
  instruments: ChecklistItem[];
  positioning: ChecklistItem[];
  completionRate: number;
}

export interface ChecklistItem {
  id: string;
  description: string;
  category: string;
  required: boolean;
  completed: boolean;
  completedBy: string | null;
  completedAt: Date | null;
  notes: string | null;
}

// ============================================================================
// Preference Card Manager Class
// ============================================================================

export class PreferenceCardManager {
  // --------------------------------------------------------------------------
  // Card Retrieval & Matching
  // --------------------------------------------------------------------------

  findPreferenceCard(
    surgeonId: string,
    procedureId: string,
    cards: PreferenceCard[]
  ): PreferenceCard | null {
    // Try to find exact match
    const exactMatch = cards.find(
      (card) =>
        card.surgeonId === surgeonId &&
        card.procedureId === procedureId &&
        card.isActive
    );

    if (exactMatch) return exactMatch;

    // Try to find by CPT code
    const cptMatch = cards.find(
      (card) =>
        card.surgeonId === surgeonId &&
        card.cptCode &&
        card.isActive
    );

    if (cptMatch) return cptMatch;

    // Try to find similar procedure for same surgeon
    const similarProcedure = cards
      .filter((card) => card.surgeonId === surgeonId && card.isActive)
      .sort((a, b) => b.useCount - a.useCount)[0];

    return similarProcedure || null;
  }

  matchPreferenceCard(
    surgicalCase: SurgicalCase,
    availableCards: PreferenceCard[]
  ): PreferenceMatch[] {
    const matches: PreferenceMatch[] = [];

    const relevantCards = availableCards.filter(
      (card) =>
        card.surgeonId === surgicalCase.surgeonId &&
        (card.procedureId === surgicalCase.procedureId ||
          card.cptCode === surgicalCase.cptCodes[0]) &&
        card.isActive
    );

    for (const card of relevantCards) {
      const matchScore = this.calculateCardMatchScore(card, surgicalCase);
      const missingItems = this.identifyMissingItems(card);
      const substitutions = this.findSubstitutions(card);

      matches.push({
        cardId: card.id,
        matchScore,
        missingItems,
        substitutions,
      });
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateCardMatchScore(
    card: PreferenceCard,
    surgicalCase: SurgicalCase
  ): number {
    let score = 0;

    // Exact procedure match
    if (card.procedureId === surgicalCase.procedureId) {
      score += 50;
    }

    // CPT code match
    if (
      card.cptCode &&
      surgicalCase.cptCodes.includes(card.cptCode)
    ) {
      score += 30;
    }

    // Surgeon match
    if (card.surgeonId === surgicalCase.surgeonId) {
      score += 20;
    }

    // Recent usage (more recent = higher score)
    if (card.lastUsed) {
      const daysSinceUsed =
        (Date.now() - new Date(card.lastUsed).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceUsed < 30) score += 10;
      else if (daysSinceUsed < 90) score += 5;
    }

    // Frequent usage
    if (card.useCount > 50) score += 10;
    else if (card.useCount > 20) score += 5;

    return score;
  }

  private identifyMissingItems(card: PreferenceCard): string[] {
    const missing: string[] = [];

    // Check required equipment
    const requiredEquipment = card.equipment.filter((e) => e.required);
    for (const eq of requiredEquipment) {
      // In real implementation, would check against inventory
      // For now, return example
      if (Math.random() > 0.9) {
        missing.push(`Equipment: ${eq.name}`);
      }
    }

    // Check required supplies
    const requiredSupplies = card.supplies.filter((s) => s.required);
    for (const supply of requiredSupplies) {
      if (Math.random() > 0.95) {
        missing.push(`Supply: ${supply.name}`);
      }
    }

    return missing;
  }

  private findSubstitutions(card: PreferenceCard): Array<{
    requested: string;
    available: string;
  }> {
    const substitutions: Array<{
      requested: string;
      available: string;
    }> = [];

    // Check for equipment substitutions
    for (const equipment of card.equipment) {
      if (equipment.alternatives.length > 0) {
        // In real implementation, would check availability
        // For now, use first alternative
        substitutions.push({
          requested: equipment.name,
          available: equipment.alternatives[0],
        });
      }
    }

    return substitutions;
  }

  // --------------------------------------------------------------------------
  // Setup Checklist Generation
  // --------------------------------------------------------------------------

  generateSetupChecklist(card: PreferenceCard): SetupChecklist {
    const roomSetup: ChecklistItem[] = [];
    const equipment: ChecklistItem[] = [];
    const supplies: ChecklistItem[] = [];
    const instruments: ChecklistItem[] = [];
    const positioning: ChecklistItem[] = [];

    // Room setup items
    if (card.roomSetup.tableType) {
      roomSetup.push({
        id: `room_table`,
        description: `Set up ${card.roomSetup.tableType} table`,
        category: "Room Setup",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: null,
      });
    }

    if (card.roomSetup.lighting) {
      roomSetup.push({
        id: `room_lighting`,
        description: `Configure ${card.roomSetup.lighting} lighting`,
        category: "Room Setup",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: null,
      });
    }

    card.roomSetup.monitors.forEach((monitor, idx) => {
      roomSetup.push({
        id: `room_monitor_${idx}`,
        description: `Set up ${monitor}`,
        category: "Room Setup",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: null,
      });
    });

    // Equipment items
    card.equipment.forEach((eq, idx) => {
      equipment.push({
        id: `equip_${idx}`,
        description: `Prepare ${eq.name}`,
        category: "Equipment",
        required: eq.required,
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: eq.notes,
      });
    });

    // Supply items
    card.supplies.forEach((supply, idx) => {
      supplies.push({
        id: `supply_${idx}`,
        description: `Stock ${supply.quantity} ${supply.unit} of ${supply.name}`,
        category: "Supplies",
        required: supply.required,
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: null,
      });
    });

    // Instrument sets
    card.instruments.forEach((inst, idx) => {
      instruments.push({
        id: `inst_${idx}`,
        description: `Prepare ${inst.setName} (${inst.sterilizationType})`,
        category: "Instruments",
        required: inst.required,
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: null,
      });
    });

    // Positioning items
    positioning.push({
      id: `pos_position`,
      description: `Position patient in ${card.positioning.position}`,
      category: "Positioning",
      required: true,
      completed: false,
      completedBy: null,
      completedAt: null,
      notes: card.positioning.notes,
    });

    card.positioning.padding.forEach((pad, idx) => {
      positioning.push({
        id: `pos_pad_${idx}`,
        description: `Apply ${pad}`,
        category: "Positioning",
        required: true,
        completed: false,
        completedBy: null,
        completedAt: null,
        notes: null,
      });
    });

    const totalItems =
      roomSetup.length +
      equipment.length +
      supplies.length +
      instruments.length +
      positioning.length;

    return {
      roomSetup,
      equipment,
      supplies,
      instruments,
      positioning,
      completionRate: 0,
    };
  }

  updateChecklistItem(
    checklist: SetupChecklist,
    itemId: string,
    completed: boolean,
    completedBy?: string,
    notes?: string
  ): SetupChecklist {
    const updateItem = (item: ChecklistItem) => {
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
    };

    const updated = {
      roomSetup: checklist.roomSetup.map(updateItem),
      equipment: checklist.equipment.map(updateItem),
      supplies: checklist.supplies.map(updateItem),
      instruments: checklist.instruments.map(updateItem),
      positioning: checklist.positioning.map(updateItem),
      completionRate: 0,
    };

    // Recalculate completion rate
    const allItems = [
      ...updated.roomSetup,
      ...updated.equipment,
      ...updated.supplies,
      ...updated.instruments,
      ...updated.positioning,
    ];

    const completedCount = allItems.filter((i) => i.completed).length;
    updated.completionRate = (completedCount / allItems.length) * 100;

    return updated;
  }

  // --------------------------------------------------------------------------
  // Card Management
  // --------------------------------------------------------------------------

  createPreferenceCard(
    surgeonId: string,
    procedureId: string,
    data: Partial<PreferenceCard>
  ): PreferenceCard {
    const now = new Date();

    return {
      id: `card_${Date.now()}`,
      surgeonId,
      surgeonName: data.surgeonName || "",
      procedureId,
      procedureName: data.procedureName || "",
      cptCode: data.cptCode || null,
      specialty: data.specialty || "",
      isActive: true,
      version: 1,
      equipment: data.equipment || [],
      supplies: data.supplies || [],
      instruments: data.instruments || [],
      positioning: data.positioning || {
        position: "SUPINE",
        padding: [],
        armBoards: false,
        stirrups: false,
        specialEquipment: [],
        notes: null,
      },
      roomSetup: data.roomSetup || {
        tableType: "Standard OR Table",
        lighting: "Standard",
        monitors: [],
        imaging: [],
        specialSetup: [],
        notes: null,
      },
      anesthesiaPreferences: data.anesthesiaPreferences || {
        preferredType: "GENERAL",
        alternateTypes: [],
        lineRequirements: [],
        monitoring: [],
        medications: [],
        notes: null,
      },
      specialInstructions: data.specialInstructions || null,
      lastUsed: null,
      useCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      updatedBy: "system",
      deletedAt: null,
    };
  }

  clonePreferenceCard(
    card: PreferenceCard,
    newProcedureId?: string
  ): PreferenceCard {
    const cloned = {
      ...card,
      id: `card_${Date.now()}`,
      procedureId: newProcedureId || card.procedureId,
      version: 1,
      useCount: 0,
      lastUsed: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return cloned;
  }

  updatePreferenceCard(
    card: PreferenceCard,
    updates: Partial<PreferenceCard>
  ): PreferenceCard {
    return {
      ...card,
      ...updates,
      version: card.version + 1,
      updatedAt: new Date(),
    };
  }

  recordCardUsage(cardId: string, card: PreferenceCard): PreferenceCard {
    return {
      ...card,
      useCount: card.useCount + 1,
      lastUsed: new Date(),
      updatedAt: new Date(),
    };
  }

  // --------------------------------------------------------------------------
  // Template Management
  // --------------------------------------------------------------------------

  getTemplateForProcedure(
    procedureCategory: string
  ): PreferenceCardTemplate | null {
    // Common templates for different procedure categories
    const templates: Record<string, PreferenceCardTemplate> = {
      ORTHOPEDIC: {
        procedureCategory: "ORTHOPEDIC",
        commonEquipment: [
          {
            id: "eq1",
            name: "C-Arm Fluoroscopy",
            required: true,
            alternatives: ["Portable X-Ray"],
            notes: null,
          },
          {
            id: "eq2",
            name: "Power Tools",
            required: true,
            alternatives: [],
            notes: null,
          },
        ],
        commonSupplies: [
          {
            id: "sup1",
            name: "Orthopedic Drapes",
            quantity: 1,
            unit: "set",
            required: true,
            alternatives: [],
          },
        ],
        commonInstruments: [
          {
            id: "inst1",
            setName: "Major Orthopedic Set",
            required: true,
            alternatives: [],
            sterilizationType: "Steam",
          },
        ],
      },
      CARDIAC: {
        procedureCategory: "CARDIAC",
        commonEquipment: [
          {
            id: "eq1",
            name: "Cardiopulmonary Bypass Machine",
            required: true,
            alternatives: [],
            notes: null,
          },
          {
            id: "eq2",
            name: "TEE Machine",
            required: true,
            alternatives: [],
            notes: "Transesophageal Echocardiogram",
          },
        ],
        commonSupplies: [
          {
            id: "sup1",
            name: "Cardiac Drapes",
            quantity: 1,
            unit: "set",
            required: true,
            alternatives: [],
          },
        ],
        commonInstruments: [
          {
            id: "inst1",
            setName: "Open Heart Set",
            required: true,
            alternatives: [],
            sterilizationType: "Steam",
          },
        ],
      },
    };

    return templates[procedureCategory] || null;
  }

  applyTemplate(
    card: PreferenceCard,
    template: PreferenceCardTemplate
  ): PreferenceCard {
    return {
      ...card,
      equipment: [...template.commonEquipment, ...card.equipment],
      supplies: [...template.commonSupplies, ...card.supplies],
      instruments: [...template.commonInstruments, ...card.instruments],
      updatedAt: new Date(),
    };
  }

  // --------------------------------------------------------------------------
  // Analytics
  // --------------------------------------------------------------------------

  analyzeCardUsage(
    cards: PreferenceCard[],
    surgeonId?: string
  ): {
    totalCards: number;
    activeCards: number;
    averageUseCount: number;
    mostUsedCards: Array<{ card: PreferenceCard; useCount: number }>;
    unusedCards: PreferenceCard[];
  } {
    const filtered = surgeonId
      ? cards.filter((c) => c.surgeonId === surgeonId)
      : cards;

    const activeCards = filtered.filter((c) => c.isActive);
    const totalUseCount = filtered.reduce((sum, c) => sum + c.useCount, 0);
    const averageUseCount = filtered.length > 0 ? totalUseCount / filtered.length : 0;

    const mostUsed = [...filtered]
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5)
      .map((card) => ({ card, useCount: card.useCount }));

    const unusedCards = filtered.filter((c) => c.useCount === 0 || !c.lastUsed);

    return {
      totalCards: filtered.length,
      activeCards: activeCards.length,
      averageUseCount,
      mostUsedCards: mostUsed,
      unusedCards,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: PreferenceCardManager | null = null;

export function getPreferenceCardManager(): PreferenceCardManager {
  if (!managerInstance) {
    managerInstance = new PreferenceCardManager();
  }
  return managerInstance;
}
