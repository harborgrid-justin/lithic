/**
 * CPIC (Clinical Pharmacogenetics Implementation Consortium) Engine
 * Implements CPIC guidelines for drug-gene interactions
 * Provides dosing recommendations based on pharmacogenomic data
 */

import { StarAlleleCall, MetabolizerStatus } from './star-allele-caller';

export interface CPICRecommendation {
  drug: string;
  gene: string;
  phenotype: string;
  recommendation: string;
  implication: string;
  classification: 'strong' | 'moderate' | 'optional';
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  alternatives?: string[];
  dosageAdjustment?: DosageAdjustment;
  references: string[];
  lastUpdated: string;
}

export interface DosageAdjustment {
  type: 'increase' | 'decrease' | 'avoid' | 'standard' | 'alternative';
  percentage?: number;
  specificDose?: string;
  monitoringRequired: boolean;
  frequency?: string;
}

export interface DrugGeneInteraction {
  drug: string;
  genes: string[];
  guidelineUrl: string;
  cpicLevel: 'A' | 'B' | 'C' | 'D';
  fdaLabel: boolean;
  interactions: CPICGuideline[];
}

export interface CPICGuideline {
  phenotype: string;
  metabolizerStatus?: MetabolizerStatus;
  activityScoreRange?: { min: number; max: number };
  recommendation: string;
  implication: string;
  classification: 'strong' | 'moderate' | 'optional';
  alternatives?: string[];
  dosageAdjustment?: DosageAdjustment;
}

export class CPICEngine {
  private static readonly DRUG_GENE_GUIDELINES: Record<string, DrugGeneInteraction> = {
    clopidogrel: {
      drug: 'Clopidogrel',
      genes: ['CYP2C19'],
      guidelineUrl: 'https://cpicpgx.org/guidelines/guideline-for-clopidogrel-and-cyp2c19/',
      cpicLevel: 'A',
      fdaLabel: true,
      interactions: [
        {
          phenotype: 'Ultrarapid metabolizer',
          metabolizerStatus: 'ultrarapid',
          recommendation: 'Clopidogrel (standard dose 75mg daily)',
          implication: 'Normal platelet inhibition; normal residual platelet aggregation',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: false,
          },
        },
        {
          phenotype: 'Rapid metabolizer',
          metabolizerStatus: 'rapid',
          recommendation: 'Clopidogrel (standard dose 75mg daily)',
          implication: 'Normal platelet inhibition; normal residual platelet aggregation',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: false,
          },
        },
        {
          phenotype: 'Normal metabolizer',
          metabolizerStatus: 'normal',
          recommendation: 'Clopidogrel (standard dose 75mg daily)',
          implication: 'Normal platelet inhibition; normal residual platelet aggregation',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: false,
          },
        },
        {
          phenotype: 'Intermediate metabolizer',
          metabolizerStatus: 'intermediate',
          recommendation: 'Alternative antiplatelet therapy (e.g., prasugrel, ticagrelor)',
          implication: 'Reduced platelet inhibition; increased residual platelet aggregation; increased risk for adverse cardiovascular events',
          classification: 'strong',
          alternatives: ['Prasugrel', 'Ticagrelor'],
          dosageAdjustment: {
            type: 'alternative',
            monitoringRequired: true,
          },
        },
        {
          phenotype: 'Poor metabolizer',
          metabolizerStatus: 'poor',
          recommendation: 'Alternative antiplatelet therapy (e.g., prasugrel, ticagrelor)',
          implication: 'Significantly reduced platelet inhibition; increased residual platelet aggregation; increased risk for adverse cardiovascular events',
          classification: 'strong',
          alternatives: ['Prasugrel', 'Ticagrelor'],
          dosageAdjustment: {
            type: 'alternative',
            monitoringRequired: true,
          },
        },
      ],
    },
    codeine: {
      drug: 'Codeine',
      genes: ['CYP2D6'],
      guidelineUrl: 'https://cpicpgx.org/guidelines/guideline-for-codeine-and-cyp2d6/',
      cpicLevel: 'A',
      fdaLabel: true,
      interactions: [
        {
          phenotype: 'Ultrarapid metabolizer',
          metabolizerStatus: 'ultrarapid',
          recommendation: 'Avoid codeine use. Select alternative analgesic (acetaminophen, NSAID, or non-tramadol opioid)',
          implication: 'Increased formation of morphine; increased risk of toxicity',
          classification: 'strong',
          alternatives: ['Acetaminophen', 'Ibuprofen', 'Morphine', 'Hydromorphone'],
          dosageAdjustment: {
            type: 'avoid',
            monitoringRequired: false,
          },
        },
        {
          phenotype: 'Normal metabolizer',
          metabolizerStatus: 'normal',
          recommendation: 'Use codeine per label',
          implication: 'Normal morphine formation',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: false,
          },
        },
        {
          phenotype: 'Intermediate metabolizer',
          metabolizerStatus: 'intermediate',
          recommendation: 'Use alternative analgesic; if codeine used, monitor closely',
          implication: 'Reduced morphine formation; reduced efficacy',
          classification: 'moderate',
          alternatives: ['Morphine', 'Hydromorphone', 'Oxycodone'],
          dosageAdjustment: {
            type: 'alternative',
            monitoringRequired: true,
          },
        },
        {
          phenotype: 'Poor metabolizer',
          metabolizerStatus: 'poor',
          recommendation: 'Avoid codeine use. Select alternative analgesic',
          implication: 'Greatly reduced morphine formation; reduced to no efficacy',
          classification: 'strong',
          alternatives: ['Morphine', 'Hydromorphone', 'Oxycodone'],
          dosageAdjustment: {
            type: 'avoid',
            monitoringRequired: false,
          },
        },
      ],
    },
    azathioprine: {
      drug: 'Azathioprine',
      genes: ['TPMT'],
      guidelineUrl: 'https://cpicpgx.org/guidelines/guideline-for-thiopurines-and-tpmt/',
      cpicLevel: 'A',
      fdaLabel: true,
      interactions: [
        {
          phenotype: 'Normal metabolizer',
          recommendation: 'Start with normal starting dose (e.g., 2-3 mg/kg/day). Adjust dose based on disease-specific guidelines',
          implication: 'Normal TPMT activity; normal risk for myelosuppression',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: true,
            frequency: 'Monitor CBC weekly for 4 weeks, then monthly for 3 months, then every 3 months',
          },
        },
        {
          phenotype: 'Intermediate metabolizer',
          recommendation: 'Start with reduced dose (30-70% of normal dose, e.g., 0.6-2.1 mg/kg/day). Adjust dose based on myelosuppression and disease-specific guidelines',
          implication: 'Reduced TPMT activity; increased risk for myelosuppression',
          classification: 'strong',
          dosageAdjustment: {
            type: 'decrease',
            percentage: 50,
            specificDose: '0.6-2.1 mg/kg/day',
            monitoringRequired: true,
            frequency: 'Monitor CBC more frequently',
          },
        },
        {
          phenotype: 'Poor metabolizer',
          recommendation: 'For malignancy, consider alternative agents. If using azathioprine, drastically reduce dose (reduce daily dose by 10-fold and dose thrice weekly instead of daily). For non-malignancy conditions, consider alternative immunosuppressant therapy',
          implication: 'Significantly increased risk for severe, life-threatening myelosuppression',
          classification: 'strong',
          alternatives: ['Mycophenolate mofetil', 'Cyclophosphamide', 'Methotrexate'],
          dosageAdjustment: {
            type: 'decrease',
            percentage: 90,
            monitoringRequired: true,
            frequency: 'Very frequent CBC monitoring required',
          },
        },
      ],
    },
    simvastatin: {
      drug: 'Simvastatin',
      genes: ['SLCO1B1'],
      guidelineUrl: 'https://cpicpgx.org/guidelines/guideline-for-simvastatin-and-slco1b1/',
      cpicLevel: 'A',
      fdaLabel: true,
      interactions: [
        {
          phenotype: 'Normal function',
          recommendation: 'Prescribe simvastatin per standard dosing guidelines',
          implication: 'Normal myopathy risk',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: false,
          },
        },
        {
          phenotype: 'Decreased function',
          recommendation: 'Prescribe a lower dose or consider alternative statin (e.g., pravastatin or rosuvastatin); if simvastatin is used, limit dose to ≤20 mg daily',
          implication: 'Increased myopathy risk',
          classification: 'strong',
          alternatives: ['Pravastatin', 'Rosuvastatin', 'Fluvastatin'],
          dosageAdjustment: {
            type: 'decrease',
            specificDose: '≤20 mg daily',
            monitoringRequired: true,
          },
        },
        {
          phenotype: 'Poor function',
          recommendation: 'Prescribe alternative statin (e.g., pravastatin or rosuvastatin); if simvastatin is used, limit dose to ≤20 mg daily and monitor closely',
          implication: 'Significantly increased myopathy risk',
          classification: 'strong',
          alternatives: ['Pravastatin', 'Rosuvastatin', 'Fluvastatin', 'Atorvastatin (lower risk)'],
          dosageAdjustment: {
            type: 'alternative',
            specificDose: 'If using simvastatin: ≤20 mg daily',
            monitoringRequired: true,
          },
        },
      ],
    },
    ondansetron: {
      drug: 'Ondansetron',
      genes: ['CYP2D6'],
      guidelineUrl: 'https://cpicpgx.org/guidelines/guideline-for-ondansetron-and-cyp2d6/',
      cpicLevel: 'B',
      fdaLabel: false,
      interactions: [
        {
          phenotype: 'Ultrarapid metabolizer',
          metabolizerStatus: 'ultrarapid',
          recommendation: 'Consider alternative 5-HT3 antagonist. If ondansetron is used, be alert to reduced response',
          implication: 'Increased metabolism to less active compounds; reduced efficacy',
          classification: 'moderate',
          alternatives: ['Granisetron', 'Palonosetron'],
          dosageAdjustment: {
            type: 'alternative',
            monitoringRequired: true,
          },
        },
        {
          phenotype: 'Normal metabolizer',
          metabolizerStatus: 'normal',
          recommendation: 'Use ondansetron per standard dosing guidelines',
          implication: 'Normal ondansetron metabolism',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: false,
          },
        },
        {
          phenotype: 'Poor metabolizer',
          metabolizerStatus: 'poor',
          recommendation: 'Use ondansetron per standard dosing guidelines',
          implication: 'Reduced metabolism; may have improved response',
          classification: 'moderate',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: false,
          },
        },
      ],
    },
    warfarin: {
      drug: 'Warfarin',
      genes: ['CYP2C9', 'VKORC1'],
      guidelineUrl: 'https://cpicpgx.org/guidelines/guideline-for-warfarin-and-cyp2c9-and-vkorc1/',
      cpicLevel: 'A',
      fdaLabel: true,
      interactions: [
        {
          phenotype: 'CYP2C9 Normal metabolizer',
          recommendation: 'Use pharmacogenetic-based dosing algorithm (e.g., www.warfarindosing.org)',
          implication: 'Normal warfarin metabolism',
          classification: 'strong',
          dosageAdjustment: {
            type: 'standard',
            monitoringRequired: true,
            frequency: 'Regular INR monitoring',
          },
        },
        {
          phenotype: 'CYP2C9 Intermediate metabolizer',
          recommendation: 'Use pharmacogenetic-based dosing algorithm; lower initial dose',
          implication: 'Reduced warfarin metabolism; increased bleeding risk',
          classification: 'strong',
          dosageAdjustment: {
            type: 'decrease',
            percentage: 25,
            monitoringRequired: true,
            frequency: 'More frequent INR monitoring',
          },
        },
        {
          phenotype: 'CYP2C9 Poor metabolizer',
          recommendation: 'Use pharmacogenetic-based dosing algorithm; substantially lower initial dose',
          implication: 'Greatly reduced warfarin metabolism; significantly increased bleeding risk',
          classification: 'strong',
          dosageAdjustment: {
            type: 'decrease',
            percentage: 50,
            monitoringRequired: true,
            frequency: 'Very frequent INR monitoring',
          },
        },
      ],
    },
  };

  /**
   * Get CPIC recommendations for a drug based on star allele calls
   */
  static getRecommendation(
    drug: string,
    starAlleleCalls: StarAlleleCall[]
  ): CPICRecommendation[] {
    const normalizedDrug = drug.toLowerCase();
    const guideline = this.DRUG_GENE_GUIDELINES[normalizedDrug];

    if (!guideline) {
      console.warn(`No CPIC guideline found for drug: ${drug}`);
      return [];
    }

    const recommendations: CPICRecommendation[] = [];

    // Find matching star allele calls for genes in this guideline
    for (const gene of guideline.genes) {
      const starAllele = starAlleleCalls.find((call) => call.gene === gene);

      if (!starAllele) {
        console.warn(`No star allele call found for gene ${gene} required for ${drug}`);
        continue;
      }

      // Find matching interaction
      const interaction = guideline.interactions.find(
        (int) => int.metabolizerStatus === starAllele.metabolizerStatus ||
                 int.phenotype === starAllele.phenotype
      );

      if (interaction) {
        recommendations.push({
          drug: guideline.drug,
          gene,
          phenotype: starAllele.phenotype,
          recommendation: interaction.recommendation,
          implication: interaction.implication,
          classification: interaction.classification,
          evidenceLevel: guideline.cpicLevel,
          alternatives: interaction.alternatives,
          dosageAdjustment: interaction.dosageAdjustment,
          references: [guideline.guidelineUrl],
          lastUpdated: '2024-01-01', // Should be from guideline metadata
        });
      }
    }

    return recommendations;
  }

  /**
   * Get all recommendations for multiple drugs
   */
  static getRecommendations(
    drugs: string[],
    starAlleleCalls: StarAlleleCall[]
  ): CPICRecommendation[] {
    const allRecommendations: CPICRecommendation[] = [];

    for (const drug of drugs) {
      const recommendations = this.getRecommendation(drug, starAlleleCalls);
      allRecommendations.push(...recommendations);
    }

    return allRecommendations;
  }

  /**
   * Check if drug has CPIC guideline
   */
  static hasGuideline(drug: string): boolean {
    return !!this.DRUG_GENE_GUIDELINES[drug.toLowerCase()];
  }

  /**
   * Get all drugs with CPIC guidelines
   */
  static getSupportedDrugs(): string[] {
    return Object.values(this.DRUG_GENE_GUIDELINES).map((g) => g.drug);
  }

  /**
   * Get guideline information for a drug
   */
  static getGuideline(drug: string): DrugGeneInteraction | null {
    return this.DRUG_GENE_GUIDELINES[drug.toLowerCase()] || null;
  }

  /**
   * Search drugs by gene
   */
  static getDrugsByGene(gene: string): DrugGeneInteraction[] {
    return Object.values(this.DRUG_GENE_GUIDELINES).filter((guideline) =>
      guideline.genes.includes(gene)
    );
  }

  /**
   * Get actionable recommendations (strong or moderate)
   */
  static getActionableRecommendations(
    recommendations: CPICRecommendation[]
  ): CPICRecommendation[] {
    return recommendations.filter(
      (rec) => rec.classification === 'strong' || rec.classification === 'moderate'
    );
  }

  /**
   * Check if dosage adjustment is needed
   */
  static requiresDosageAdjustment(recommendation: CPICRecommendation): boolean {
    return (
      recommendation.dosageAdjustment?.type === 'increase' ||
      recommendation.dosageAdjustment?.type === 'decrease' ||
      recommendation.dosageAdjustment?.type === 'avoid' ||
      recommendation.dosageAdjustment?.type === 'alternative'
    );
  }

  /**
   * Generate clinical alert text
   */
  static generateAlert(recommendation: CPICRecommendation): string {
    const alerts: string[] = [];

    alerts.push(`PHARMACOGENOMIC ALERT: ${recommendation.drug}`);
    alerts.push(`Gene: ${recommendation.gene} | Phenotype: ${recommendation.phenotype}`);
    alerts.push(`Classification: ${recommendation.classification.toUpperCase()}`);
    alerts.push('');
    alerts.push(`Implication: ${recommendation.implication}`);
    alerts.push('');
    alerts.push(`Recommendation: ${recommendation.recommendation}`);

    if (recommendation.alternatives && recommendation.alternatives.length > 0) {
      alerts.push('');
      alerts.push(`Alternative medications: ${recommendation.alternatives.join(', ')}`);
    }

    if (recommendation.dosageAdjustment) {
      alerts.push('');
      if (recommendation.dosageAdjustment.specificDose) {
        alerts.push(`Recommended dose: ${recommendation.dosageAdjustment.specificDose}`);
      }
      if (recommendation.dosageAdjustment.monitoringRequired) {
        alerts.push('⚠ Enhanced monitoring required');
        if (recommendation.dosageAdjustment.frequency) {
          alerts.push(`Monitoring: ${recommendation.dosageAdjustment.frequency}`);
        }
      }
    }

    alerts.push('');
    alerts.push(`CPIC Evidence Level: ${recommendation.evidenceLevel}`);
    alerts.push(`Reference: ${recommendation.references[0]}`);

    return alerts.join('\n');
  }

  /**
   * Get recommendations by priority
   */
  static prioritizeRecommendations(
    recommendations: CPICRecommendation[]
  ): CPICRecommendation[] {
    return [...recommendations].sort((a, b) => {
      // Priority by classification
      const classOrder = { strong: 0, moderate: 1, optional: 2 };
      if (classOrder[a.classification] !== classOrder[b.classification]) {
        return classOrder[a.classification] - classOrder[b.classification];
      }

      // Priority by evidence level
      const evidenceOrder = { A: 0, B: 1, C: 2, D: 3 };
      if (evidenceOrder[a.evidenceLevel] !== evidenceOrder[b.evidenceLevel]) {
        return evidenceOrder[a.evidenceLevel] - evidenceOrder[b.evidenceLevel];
      }

      // Priority by action type
      const actionOrder = { avoid: 0, alternative: 1, decrease: 2, increase: 3, standard: 4 };
      const aAction = a.dosageAdjustment?.type || 'standard';
      const bAction = b.dosageAdjustment?.type || 'standard';

      return actionOrder[aAction] - actionOrder[bAction];
    });
  }
}
