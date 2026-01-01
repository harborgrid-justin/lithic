/**
 * DrugInteractionService.ts
 * Drug interaction checking and clinical decision support
 */

import { EventEmitter } from 'events';
import type { Medication } from './PharmacyService';

export interface DrugInteraction {
  id: string;
  drug1Id: string;
  drug1Name: string;
  drug2Id: string;
  drug2Name: string;
  severity: 'contraindicated' | 'major' | 'moderate' | 'minor';
  interactionType: 'drug-drug' | 'drug-food' | 'drug-disease' | 'drug-allergy';
  description: string;
  clinicalEffects: string;
  mechanism?: string;
  management: string;
  references?: string[];
  createdAt: Date;
}

export interface AllergyCheck {
  hasAllergy: boolean;
  allergyType: 'drug_class' | 'specific_drug' | 'ingredient';
  allergyName: string;
  severity: 'severe' | 'moderate' | 'mild';
  crossSensitivity?: string[];
  recommendation: string;
}

export interface DiseaseContraindication {
  diseaseCode: string;
  diseaseName: string;
  severity: 'absolute' | 'relative';
  description: string;
  recommendation: string;
}

export interface InteractionCheckResult {
  safe: boolean;
  interactions: DrugInteraction[];
  allergyAlerts: AllergyCheck[];
  diseaseContraindications: DiseaseContraindication[];
  foodInteractions: FoodInteraction[];
  clinicalWarnings: ClinicalWarning[];
  requiresPrescriberNotification: boolean;
}

export interface FoodInteraction {
  food: string;
  severity: 'major' | 'moderate' | 'minor';
  description: string;
  recommendation: string;
}

export interface ClinicalWarning {
  type: 'pregnancy' | 'lactation' | 'pediatric' | 'geriatric' | 'renal' | 'hepatic';
  severity: 'contraindicated' | 'warning' | 'caution';
  description: string;
  recommendation: string;
}

export interface PatientMedication {
  medicationId: string;
  medicationName: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export class DrugInteractionService extends EventEmitter {
  private interactions: Map<string, DrugInteraction> = new Map();

  // Drug class mappings for cross-sensitivity checking
  private drugClassMappings: Map<string, string[]> = new Map([
    ['NSAID', ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'aspirin']],
    ['Penicillin', ['amoxicillin', 'ampicillin', 'penicillin', 'piperacillin']],
    ['Sulfonamide', ['sulfamethoxazole', 'sulfadiazine', 'sulfasalazine']],
    ['Cephalosporin', ['cephalexin', 'cefazolin', 'ceftriaxone', 'cefuroxime']],
  ]);

  constructor() {
    super();
    this.initializeInteractionDatabase();
  }

  /**
   * Check for drug interactions
   */
  async checkInteractions(
    newMedication: Medication,
    currentMedications: PatientMedication[],
    patientData?: {
      allergies?: string[];
      diseases?: string[];
      age?: number;
      isPregnant?: boolean;
      isLactating?: boolean;
      renalFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
      hepaticFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
    }
  ): Promise<InteractionCheckResult> {
    const result: InteractionCheckResult = {
      safe: true,
      interactions: [],
      allergyAlerts: [],
      diseaseContraindications: [],
      foodInteractions: [],
      clinicalWarnings: [],
      requiresPrescriberNotification: false,
    };

    // Check drug-drug interactions
    for (const currentMed of currentMedications.filter(m => m.isActive)) {
      const interactions = await this.findDrugDrugInteractions(
        newMedication.id,
        currentMed.medicationId
      );
      result.interactions.push(...interactions);
    }

    // Check allergies
    if (patientData?.allergies && patientData.allergies.length > 0) {
      const allergyChecks = await this.checkAllergies(newMedication, patientData.allergies);
      result.allergyAlerts.push(...allergyChecks);
    }

    // Check disease contraindications
    if (patientData?.diseases && patientData.diseases.length > 0) {
      const contraindications = await this.checkDiseaseContraindications(
        newMedication,
        patientData.diseases
      );
      result.diseaseContraindications.push(...contraindications);
    }

    // Check food interactions
    const foodInteractions = await this.findFoodInteractions(newMedication);
    result.foodInteractions.push(...foodInteractions);

    // Clinical warnings
    if (patientData) {
      const warnings = await this.generateClinicalWarnings(newMedication, patientData);
      result.clinicalWarnings.push(...warnings);
    }

    // Determine overall safety
    const hasContraindications = result.interactions.some(i => i.severity === 'contraindicated') ||
                                 result.allergyAlerts.some(a => a.hasAllergy && a.severity === 'severe') ||
                                 result.diseaseContraindications.some(d => d.severity === 'absolute');

    const hasMajorIssues = result.interactions.some(i => i.severity === 'major') ||
                          result.allergyAlerts.some(a => a.hasAllergy && a.severity === 'moderate') ||
                          result.clinicalWarnings.some(w => w.severity === 'contraindicated');

    result.safe = !hasContraindications;
    result.requiresPrescriberNotification = hasContraindications || hasMajorIssues;

    this.emit('interaction:checked', { medication: newMedication, result });

    return result;
  }

  /**
   * Find drug-drug interactions between two medications
   */
  private async findDrugDrugInteractions(
    med1Id: string,
    med2Id: string
  ): Promise<DrugInteraction[]> {
    return Array.from(this.interactions.values()).filter(
      interaction =>
        (interaction.drug1Id === med1Id && interaction.drug2Id === med2Id) ||
        (interaction.drug1Id === med2Id && interaction.drug2Id === med1Id)
    );
  }

  /**
   * Check for drug allergies
   */
  private async checkAllergies(
    medication: Medication,
    allergies: string[]
  ): Promise<AllergyCheck[]> {
    const alerts: AllergyCheck[] = [];

    for (const allergy of allergies) {
      const allergyLower = allergy.toLowerCase();

      // Check direct drug match
      if (
        medication.name.toLowerCase().includes(allergyLower) ||
        medication.genericName.toLowerCase().includes(allergyLower)
      ) {
        alerts.push({
          hasAllergy: true,
          allergyType: 'specific_drug',
          allergyName: allergy,
          severity: 'severe',
          recommendation: 'DO NOT DISPENSE - Patient has documented allergy to this medication',
        });
        continue;
      }

      // Check drug class cross-sensitivity
      for (const [drugClass, members] of this.drugClassMappings.entries()) {
        if (allergyLower.includes(drugClass.toLowerCase())) {
          const medNameLower = medication.genericName.toLowerCase();
          if (members.some(member => medNameLower.includes(member.toLowerCase()))) {
            alerts.push({
              hasAllergy: true,
              allergyType: 'drug_class',
              allergyName: drugClass,
              severity: 'moderate',
              crossSensitivity: members,
              recommendation: `Caution: Patient allergic to ${drugClass}. Cross-sensitivity possible. Consult prescriber.`,
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Check for disease contraindications
   */
  private async checkDiseaseContraindications(
    medication: Medication,
    diseases: string[]
  ): Promise<DiseaseContraindication[]> {
    const contraindications: DiseaseContraindication[] = [];

    // Example contraindications (would be from a comprehensive database)
    const contraindicationRules: Record<string, DiseaseContraindication[]> = {
      'nsaid': [
        {
          diseaseCode: 'K25',
          diseaseName: 'Peptic Ulcer Disease',
          severity: 'relative',
          description: 'NSAIDs can exacerbate peptic ulcer disease',
          recommendation: 'Use with caution. Consider alternative therapy or add gastric protection.',
        },
        {
          diseaseCode: 'N18',
          diseaseName: 'Chronic Kidney Disease',
          severity: 'relative',
          description: 'NSAIDs can worsen renal function',
          recommendation: 'Avoid if possible. Monitor renal function closely if used.',
        },
      ],
      'beta-blocker': [
        {
          diseaseCode: 'J45',
          diseaseName: 'Asthma',
          severity: 'absolute',
          description: 'Beta-blockers can cause bronchospasm in asthma patients',
          recommendation: 'DO NOT USE. Select alternative antihypertensive agent.',
        },
      ],
    };

    const medNameLower = medication.genericName.toLowerCase();
    for (const [drugType, rules] of Object.entries(contraindicationRules)) {
      if (medNameLower.includes(drugType)) {
        for (const disease of diseases) {
          const matchingRules = rules.filter(rule =>
            disease.toLowerCase().includes(rule.diseaseName.toLowerCase()) ||
            disease.includes(rule.diseaseCode)
          );
          contraindications.push(...matchingRules);
        }
      }
    }

    return contraindications;
  }

  /**
   * Find food interactions
   */
  private async findFoodInteractions(medication: Medication): Promise<FoodInteraction[]> {
    const interactions: FoodInteraction[] = [];
    const medNameLower = medication.genericName.toLowerCase();

    // Common food interactions
    if (medNameLower.includes('warfarin')) {
      interactions.push({
        food: 'Vitamin K-rich foods (leafy greens, broccoli)',
        severity: 'moderate',
        description: 'High vitamin K intake can reduce warfarin effectiveness',
        recommendation: 'Maintain consistent vitamin K intake. Avoid large variations.',
      });
    }

    if (medNameLower.includes('levothyroxine')) {
      interactions.push({
        food: 'Calcium and iron supplements, soy products',
        severity: 'moderate',
        description: 'These can reduce levothyroxine absorption',
        recommendation: 'Take on empty stomach. Separate from calcium/iron by 4 hours.',
      });
    }

    if (
      medNameLower.includes('amlodipine') ||
      medNameLower.includes('felodipine') ||
      medNameLower.includes('nifedipine')
    ) {
      interactions.push({
        food: 'Grapefruit juice',
        severity: 'major',
        description: 'Grapefruit can significantly increase drug levels',
        recommendation: 'Avoid grapefruit and grapefruit juice entirely.',
      });
    }

    if (
      medication.therapeuticClass.toLowerCase().includes('antibiotic') &&
      (medNameLower.includes('tetracycline') || medNameLower.includes('fluoroquinolone'))
    ) {
      interactions.push({
        food: 'Dairy products, calcium, magnesium, iron',
        severity: 'moderate',
        description: 'These can chelate and reduce antibiotic absorption',
        recommendation: 'Take 2 hours before or 6 hours after dairy/supplements.',
      });
    }

    return interactions;
  }

  /**
   * Generate clinical warnings based on patient factors
   */
  private async generateClinicalWarnings(
    medication: Medication,
    patientData: {
      age?: number;
      isPregnant?: boolean;
      isLactating?: boolean;
      renalFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
      hepaticFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
    }
  ): Promise<ClinicalWarning[]> {
    const warnings: ClinicalWarning[] = [];
    const medNameLower = medication.genericName.toLowerCase();

    // Pregnancy warnings
    if (patientData.isPregnant) {
      // Absolute contraindications in pregnancy
      if (
        medNameLower.includes('isotretinoin') ||
        medNameLower.includes('methotrexate') ||
        medNameLower.includes('warfarin')
      ) {
        warnings.push({
          type: 'pregnancy',
          severity: 'contraindicated',
          description: 'This medication is contraindicated in pregnancy (Category X)',
          recommendation: 'DO NOT DISPENSE. Contact prescriber immediately.',
        });
      }
      // ACE inhibitors/ARBs
      else if (
        medNameLower.includes('pril') || // ACE inhibitors
        medNameLower.includes('sartan') // ARBs
      ) {
        warnings.push({
          type: 'pregnancy',
          severity: 'contraindicated',
          description: 'ACE inhibitors/ARBs can cause fetal harm in 2nd and 3rd trimester',
          recommendation: 'Discontinue as soon as pregnancy detected. Contact prescriber.',
        });
      }
    }

    // Lactation warnings
    if (patientData.isLactating && medication.isControlled) {
      warnings.push({
        type: 'lactation',
        severity: 'warning',
        description: 'Controlled substances may be excreted in breast milk',
        recommendation: 'Counsel patient on risks. Consider alternative if possible.',
      });
    }

    // Geriatric warnings (age 65+)
    if (patientData.age && patientData.age >= 65) {
      // Beers Criteria medications
      if (
        medNameLower.includes('diphenhydramine') ||
        medNameLower.includes('diazepam') ||
        medNameLower.includes('amitriptyline')
      ) {
        warnings.push({
          type: 'geriatric',
          severity: 'caution',
          description: 'This medication is potentially inappropriate in elderly (Beers Criteria)',
          recommendation: 'Use lowest effective dose. Monitor for adverse effects closely.',
        });
      }
    }

    // Pediatric warnings (age < 18)
    if (patientData.age && patientData.age < 18) {
      if (medNameLower.includes('tetracycline')) {
        warnings.push({
          type: 'pediatric',
          severity: 'contraindicated',
          description: 'Tetracyclines can cause permanent tooth discoloration in children',
          recommendation: 'Generally avoid in children under 8 years. Contact prescriber.',
        });
      }
    }

    // Renal function warnings
    if (patientData.renalFunction && patientData.renalFunction !== 'normal') {
      if (
        medNameLower.includes('metformin') ||
        medNameLower.includes('gabapentin') ||
        medNameLower.includes('digoxin')
      ) {
        warnings.push({
          type: 'renal',
          severity: patientData.renalFunction === 'severe' ? 'contraindicated' : 'warning',
          description: `Dose adjustment required for renal impairment (${patientData.renalFunction})`,
          recommendation: 'Verify dose is appropriate for renal function. May need reduction.',
        });
      }
    }

    // Hepatic function warnings
    if (patientData.hepaticFunction && patientData.hepaticFunction !== 'normal') {
      if (
        medNameLower.includes('atorvastatin') ||
        medNameLower.includes('acetaminophen')
      ) {
        warnings.push({
          type: 'hepatic',
          severity: patientData.hepaticFunction === 'severe' ? 'warning' : 'caution',
          description: `Caution in hepatic impairment (${patientData.hepaticFunction})`,
          recommendation: 'Monitor liver function. May need dose adjustment or alternative.',
        });
      }
    }

    return warnings;
  }

  /**
   * Add interaction to database
   */
  async addInteraction(
    data: Omit<DrugInteraction, 'id' | 'createdAt'>
  ): Promise<DrugInteraction> {
    const interaction: DrugInteraction = {
      ...data,
      id: this.generateId('INT'),
      createdAt: new Date(),
    };

    this.interactions.set(interaction.id, interaction);
    this.emit('interaction:added', interaction);

    return interaction;
  }

  /**
   * Initialize interaction database with common interactions
   */
  private initializeInteractionDatabase(): void {
    const commonInteractions: Omit<DrugInteraction, 'id' | 'createdAt'>[] = [
      {
        drug1Id: 'warfarin',
        drug1Name: 'Warfarin',
        drug2Id: 'aspirin',
        drug2Name: 'Aspirin',
        severity: 'major',
        interactionType: 'drug-drug',
        description: 'Increased risk of bleeding',
        clinicalEffects: 'Concurrent use increases bleeding risk significantly',
        mechanism: 'Additive anticoagulant/antiplatelet effects',
        management: 'Avoid combination if possible. If必要, monitor INR closely and watch for signs of bleeding.',
        references: ['Micromedex', 'Clinical Pharmacology'],
      },
      {
        drug1Id: 'simvastatin',
        drug1Name: 'Simvastatin',
        drug2Id: 'clarithromycin',
        drug2Name: 'Clarithromycin',
        severity: 'contraindicated',
        interactionType: 'drug-drug',
        description: 'Severe increase in statin levels with risk of rhabdomyolysis',
        clinicalEffects: 'Muscle pain, weakness, rhabdomyolysis, acute renal failure',
        mechanism: 'Clarithromycin inhibits CYP3A4 metabolism of simvastatin',
        management: 'DO NOT COMBINE. Discontinue statin during clarithromycin therapy or use alternative antibiotic.',
        references: ['FDA Safety Alert', 'Package Insert'],
      },
      {
        drug1Id: 'lisinopril',
        drug1Name: 'Lisinopril',
        drug2Id: 'spironolactone',
        drug2Name: 'Spironolactone',
        severity: 'major',
        interactionType: 'drug-drug',
        description: 'Risk of hyperkalemia',
        clinicalEffects: 'Elevated potassium levels, cardiac arrhythmias',
        mechanism: 'Both drugs can increase serum potassium',
        management: 'Monitor potassium levels closely. Use combination only if necessary.',
        references: ['UpToDate', 'Clinical Pharmacology'],
      },
    ];

    commonInteractions.forEach(interaction => {
      const full: DrugInteraction = {
        ...interaction,
        id: this.generateId('INT'),
        createdAt: new Date(),
      };
      this.interactions.set(full.id, full);
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

const drugInteractionService = new DrugInteractionService();
export default drugInteractionService;
