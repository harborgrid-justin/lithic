/**
 * Drug-Drug Interaction Rules and Database
 * Evidence-based interaction checking for medication safety
 */

import {
  DrugDrugInteraction,
  DrugIdentifier,
  DocumentationLevel,
  EvidenceLevel,
  CDSContext,
  ContextMedication,
} from "@/types/cds";
import { InteractionSeverity } from "@/types/pharmacy";

/**
 * Drug interaction database
 * In production, this would be loaded from a comprehensive database like:
 * - FDA Drug Interaction Database
 * - Lexicomp
 * - Micromedex
 * - First DataBank
 */
const DRUG_INTERACTION_DATABASE: DrugDrugInteraction[] = [
  // Warfarin interactions
  {
    id: "int-warfarin-nsaids",
    organizationId: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
    drug1: {
      id: "warfarin",
      name: "Warfarin",
      genericName: "warfarin",
      rxcui: "11289",
      ndc: null,
      therapeuticClass: "Anticoagulant",
    },
    drug2: {
      id: "nsaids",
      name: "NSAIDs",
      genericName: "ibuprofen",
      rxcui: "5640",
      ndc: null,
      therapeuticClass: "NSAID",
    },
    severity: InteractionSeverity.MAJOR,
    description:
      "Concurrent use of warfarin with NSAIDs increases risk of bleeding",
    clinicalEffects:
      "Increased risk of gastrointestinal bleeding, bruising, and hemorrhage",
    mechanism:
      "NSAIDs inhibit platelet function and can cause GI mucosal damage. Both mechanisms increase bleeding risk when combined with anticoagulation.",
    management:
      "Monitor INR more frequently. Consider alternative analgesics such as acetaminophen. If concurrent use necessary, monitor closely for signs of bleeding.",
    alternatives: [
      "Acetaminophen",
      "Tramadol",
      "Low-dose aspirin with gastroprotection",
    ],
    references: ["PMID: 12345678", "FDA Drug Safety Communication"],
    evidenceLevel: EvidenceLevel.A,
    monitoringParameters: ["INR", "Signs of bleeding", "Hemoglobin/Hematocrit"],
    onsetTime: "Within days",
    documentation: DocumentationLevel.EXCELLENT,
  },
  {
    id: "int-warfarin-amiodarone",
    organizationId: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
    drug1: {
      id: "warfarin",
      name: "Warfarin",
      genericName: "warfarin",
      rxcui: "11289",
      ndc: null,
      therapeuticClass: "Anticoagulant",
    },
    drug2: {
      id: "amiodarone",
      name: "Amiodarone",
      genericName: "amiodarone",
      rxcui: "703",
      ndc: null,
      therapeuticClass: "Antiarrhythmic",
    },
    severity: InteractionSeverity.MAJOR,
    description: "Amiodarone inhibits warfarin metabolism, increasing INR",
    clinicalEffects: "Increased anticoagulation effect with risk of bleeding",
    mechanism:
      "Amiodarone inhibits CYP2C9, the enzyme responsible for warfarin metabolism",
    management:
      "Reduce warfarin dose by 30-50% when starting amiodarone. Monitor INR closely.",
    alternatives: null,
    references: ["PMID: 23456789"],
    evidenceLevel: EvidenceLevel.A,
    monitoringParameters: ["INR", "Signs of bleeding"],
    onsetTime: "1-2 weeks",
    documentation: DocumentationLevel.EXCELLENT,
  },

  // Statin interactions
  {
    id: "int-simvastatin-clarithromycin",
    organizationId: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
    drug1: {
      id: "simvastatin",
      name: "Simvastatin",
      genericName: "simvastatin",
      rxcui: "36567",
      ndc: null,
      therapeuticClass: "Statin",
    },
    drug2: {
      id: "clarithromycin",
      name: "Clarithromycin",
      genericName: "clarithromycin",
      rxcui: "21212",
      ndc: null,
      therapeuticClass: "Macrolide Antibiotic",
    },
    severity: InteractionSeverity.CONTRAINDICATED,
    description: "Clarithromycin significantly increases simvastatin levels",
    clinicalEffects: "Severe risk of rhabdomyolysis and acute kidney injury",
    mechanism:
      "Clarithromycin is a strong CYP3A4 inhibitor that dramatically increases simvastatin concentrations",
    management:
      "CONTRAINDICATED. Suspend simvastatin during clarithromycin therapy or use alternative antibiotic.",
    alternatives: [
      "Azithromycin (no interaction)",
      "Doxycycline",
      "Switch to pravastatin or rosuvastatin",
    ],
    references: ["FDA Black Box Warning", "PMID: 34567890"],
    evidenceLevel: EvidenceLevel.A,
    monitoringParameters: ["CK", "Creatinine", "Muscle pain/weakness"],
    onsetTime: "Within days",
    documentation: DocumentationLevel.EXCELLENT,
  },

  // ACE Inhibitor + Potassium
  {
    id: "int-acei-potassium",
    organizationId: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
    drug1: {
      id: "lisinopril",
      name: "Lisinopril",
      genericName: "lisinopril",
      rxcui: "29046",
      ndc: null,
      therapeuticClass: "ACE Inhibitor",
    },
    drug2: {
      id: "potassium",
      name: "Potassium Chloride",
      genericName: "potassium chloride",
      rxcui: "8588",
      ndc: null,
      therapeuticClass: "Electrolyte Supplement",
    },
    severity: InteractionSeverity.MODERATE,
    description: "ACE inhibitors increase potassium retention",
    clinicalEffects:
      "Risk of hyperkalemia, potentially leading to cardiac arrhythmias",
    mechanism:
      "ACE inhibitors reduce aldosterone secretion, decreasing potassium excretion",
    management:
      "Monitor serum potassium closely. Consider reducing or discontinuing potassium supplementation.",
    alternatives: null,
    references: ["PMID: 45678901"],
    evidenceLevel: EvidenceLevel.A,
    monitoringParameters: [
      "Serum potassium",
      "ECG if hyperkalemia suspected",
      "Renal function",
    ],
    onsetTime: "Days to weeks",
    documentation: DocumentationLevel.EXCELLENT,
  },

  // Metformin + Contrast
  {
    id: "int-metformin-contrast",
    organizationId: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
    drug1: {
      id: "metformin",
      name: "Metformin",
      genericName: "metformin",
      rxcui: "6809",
      ndc: null,
      therapeuticClass: "Biguanide",
    },
    drug2: {
      id: "iodinated-contrast",
      name: "Iodinated Contrast",
      genericName: "iohexol",
      rxcui: "24119",
      ndc: null,
      therapeuticClass: "Contrast Media",
    },
    severity: InteractionSeverity.MAJOR,
    description:
      "Risk of metformin-associated lactic acidosis with contrast-induced nephropathy",
    clinicalEffects:
      "Lactic acidosis due to metformin accumulation in setting of acute kidney injury",
    mechanism:
      "Contrast media can cause acute kidney injury, leading to metformin accumulation",
    management:
      "Hold metformin on day of procedure and for 48 hours after. Restart only if renal function stable.",
    alternatives: null,
    references: ["ACR Contrast Media Guidelines", "PMID: 56789012"],
    evidenceLevel: EvidenceLevel.A,
    monitoringParameters: [
      "Serum creatinine",
      "eGFR",
      "Lactate if symptoms develop",
    ],
    onsetTime: "48-72 hours post-contrast",
    documentation: DocumentationLevel.EXCELLENT,
  },

  // SSRIs + MAOIs
  {
    id: "int-ssri-maoi",
    organizationId: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
    drug1: {
      id: "fluoxetine",
      name: "Fluoxetine",
      genericName: "fluoxetine",
      rxcui: "4493",
      ndc: null,
      therapeuticClass: "SSRI",
    },
    drug2: {
      id: "phenelzine",
      name: "Phenelzine",
      genericName: "phenelzine",
      rxcui: "8120",
      ndc: null,
      therapeuticClass: "MAOI",
    },
    severity: InteractionSeverity.CONTRAINDICATED,
    description: "Risk of serotonin syndrome",
    clinicalEffects:
      "Potentially fatal serotonin syndrome with hyperthermia, rigidity, autonomic instability",
    mechanism:
      "Excessive serotonergic activity from combined SSRI and MAOI effects",
    management:
      "CONTRAINDICATED. Allow 5 weeks washout after stopping fluoxetine before starting MAOI. Allow 2 weeks washout after MAOI before starting SSRI.",
    alternatives: null,
    references: ["FDA Black Box Warning", "PMID: 67890123"],
    evidenceLevel: EvidenceLevel.A,
    monitoringParameters: [
      "Mental status",
      "Temperature",
      "Vital signs",
      "Neuromuscular exam",
    ],
    onsetTime: "Hours to days",
    documentation: DocumentationLevel.EXCELLENT,
  },

  // Digoxin + Amiodarone
  {
    id: "int-digoxin-amiodarone",
    organizationId: "system",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    deletedAt: null,
    createdBy: "system",
    updatedBy: "system",
    drug1: {
      id: "digoxin",
      name: "Digoxin",
      genericName: "digoxin",
      rxcui: "3407",
      ndc: null,
      therapeuticClass: "Cardiac Glycoside",
    },
    drug2: {
      id: "amiodarone",
      name: "Amiodarone",
      genericName: "amiodarone",
      rxcui: "703",
      ndc: null,
      therapeuticClass: "Antiarrhythmic",
    },
    severity: InteractionSeverity.MAJOR,
    description: "Amiodarone increases digoxin levels",
    clinicalEffects:
      "Digoxin toxicity: nausea, visual disturbances, arrhythmias",
    mechanism: "Amiodarone inhibits P-glycoprotein, reducing digoxin clearance",
    management:
      "Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels closely.",
    alternatives: null,
    references: ["PMID: 78901234"],
    evidenceLevel: EvidenceLevel.A,
    monitoringParameters: [
      "Digoxin level",
      "ECG",
      "Potassium",
      "Renal function",
    ],
    onsetTime: "1-2 weeks",
    documentation: DocumentationLevel.EXCELLENT,
  },
];

/**
 * Drug interaction checker
 */
export class DrugInteractionChecker {
  private interactions: Map<string, DrugDrugInteraction[]> = new Map();

  constructor() {
    this.loadInteractions();
  }

  /**
   * Load drug interactions into memory
   */
  private loadInteractions(): void {
    DRUG_INTERACTION_DATABASE.forEach((interaction) => {
      // Index by drug1
      const drug1Key = this.getDrugKey(interaction.drug1);
      if (!this.interactions.has(drug1Key)) {
        this.interactions.set(drug1Key, []);
      }
      this.interactions.get(drug1Key)!.push(interaction);

      // Index by drug2 (bidirectional)
      const drug2Key = this.getDrugKey(interaction.drug2);
      if (!this.interactions.has(drug2Key)) {
        this.interactions.set(drug2Key, []);
      }
      this.interactions.get(drug2Key)!.push(interaction);
    });
  }

  /**
   * Check for interactions between medications
   */
  checkInteractions(
    newMedications: ContextMedication[],
    existingMedications: ContextMedication[],
  ): DrugDrugInteraction[] {
    const interactions: DrugDrugInteraction[] = [];
    const seen = new Set<string>();

    // Check new meds against existing meds
    for (const newMed of newMedications) {
      for (const existingMed of existingMedications) {
        const interaction = this.findInteraction(newMed, existingMed);
        if (interaction) {
          const key = this.getInteractionKey(interaction);
          if (!seen.has(key)) {
            interactions.push(interaction);
            seen.add(key);
          }
        }
      }
    }

    // Check new meds against each other
    for (let i = 0; i < newMedications.length; i++) {
      for (let j = i + 1; j < newMedications.length; j++) {
        const interaction = this.findInteraction(
          newMedications[i],
          newMedications[j],
        );
        if (interaction) {
          const key = this.getInteractionKey(interaction);
          if (!seen.has(key)) {
            interactions.push(interaction);
            seen.add(key);
          }
        }
      }
    }

    // Sort by severity
    return this.sortBySeverity(interactions);
  }

  /**
   * Find interaction between two medications
   */
  private findInteraction(
    med1: ContextMedication,
    med2: ContextMedication,
  ): DrugDrugInteraction | null {
    // Check by generic name
    const key1 = med1.genericName.toLowerCase();
    const key2 = med2.genericName.toLowerCase();

    const interactions1 = this.interactions.get(key1) || [];
    for (const interaction of interactions1) {
      if (
        this.matchesDrug(interaction.drug2, med2) ||
        this.matchesDrug(interaction.drug1, med2)
      ) {
        return interaction;
      }
    }

    // Check by therapeutic class if available
    if (med1.therapeuticClass && med2.therapeuticClass) {
      const classInteractions = this.findClassInteractions(
        med1.therapeuticClass,
        med2.therapeuticClass,
      );
      if (classInteractions.length > 0) {
        return classInteractions[0];
      }
    }

    return null;
  }

  /**
   * Find interactions based on therapeutic class
   */
  private findClassInteractions(
    class1: string,
    class2: string,
  ): DrugDrugInteraction[] {
    return DRUG_INTERACTION_DATABASE.filter((interaction) => {
      const interactionClass1 =
        interaction.drug1.therapeuticClass.toLowerCase();
      const interactionClass2 =
        interaction.drug2.therapeuticClass.toLowerCase();
      const c1 = class1.toLowerCase();
      const c2 = class2.toLowerCase();

      return (
        (interactionClass1.includes(c1) && interactionClass2.includes(c2)) ||
        (interactionClass1.includes(c2) && interactionClass2.includes(c1))
      );
    });
  }

  /**
   * Check if medication matches drug identifier
   */
  private matchesDrug(drug: DrugIdentifier, med: ContextMedication): boolean {
    const genericMatch =
      drug.genericName.toLowerCase() === med.genericName.toLowerCase();
    const nameMatch = drug.name.toLowerCase() === med.name.toLowerCase();
    const rxcuiMatch = drug.rxcui && med.rxcui && drug.rxcui === med.rxcui;

    return genericMatch || nameMatch || rxcuiMatch || false;
  }

  /**
   * Get drug key for indexing
   */
  private getDrugKey(drug: DrugIdentifier): string {
    return drug.genericName.toLowerCase();
  }

  /**
   * Get unique key for interaction
   */
  private getInteractionKey(interaction: DrugDrugInteraction): string {
    const drugs = [
      interaction.drug1.genericName.toLowerCase(),
      interaction.drug2.genericName.toLowerCase(),
    ].sort();
    return drugs.join("-");
  }

  /**
   * Sort interactions by severity
   */
  private sortBySeverity(
    interactions: DrugDrugInteraction[],
  ): DrugDrugInteraction[] {
    const severityOrder = {
      [InteractionSeverity.CONTRAINDICATED]: 4,
      [InteractionSeverity.MAJOR]: 3,
      [InteractionSeverity.MODERATE]: 2,
      [InteractionSeverity.MINOR]: 1,
    };

    return interactions.sort((a, b) => {
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get all interactions for a medication
   */
  getAllInteractions(medication: ContextMedication): DrugDrugInteraction[] {
    const key = medication.genericName.toLowerCase();
    return this.interactions.get(key) || [];
  }

  /**
   * Search interactions by drug name
   */
  searchInteractions(drugName: string): DrugDrugInteraction[] {
    const searchTerm = drugName.toLowerCase();
    return DRUG_INTERACTION_DATABASE.filter(
      (interaction) =>
        interaction.drug1.name.toLowerCase().includes(searchTerm) ||
        interaction.drug1.genericName.toLowerCase().includes(searchTerm) ||
        interaction.drug2.name.toLowerCase().includes(searchTerm) ||
        interaction.drug2.genericName.toLowerCase().includes(searchTerm),
    );
  }
}

// Export singleton instance
export const drugInteractionChecker = new DrugInteractionChecker();
