/**
 * Cardiac Genetic Risk Panel
 * Analyzes variants in genes associated with inherited cardiac conditions
 * Implements ACMG/AHA guidelines for cardiovascular genetic testing
 */

import { VCFVariant } from '../vcf/parser';
import { VariantAnnotation } from '../vcf/annotator';

export interface CardiacRiskAssessment {
  gene: string;
  condition: string;
  pathogenicVariants: CardiacVariant[];
  likelyPathogenicVariants: CardiacVariant[];
  vus: CardiacVariant[];
  riskLevel: 'high' | 'moderate' | 'low' | 'uncertain';
  clinicalFeatures: string[];
  management: CardiacManagement[];
  familyScreening: boolean;
  inheritance: 'autosomal_dominant' | 'autosomal_recessive' | 'x_linked';
  penetrance: 'high' | 'moderate' | 'low' | 'variable';
}

export interface CardiacVariant {
  gene: string;
  hgvsc: string;
  hgvsp: string;
  chromosome: string;
  position: number;
  reference: string;
  alternate: string;
  classification: 'pathogenic' | 'likely_pathogenic' | 'vus' | 'likely_benign' | 'benign';
  functionalImpact: string;
  prevalence?: number;
  clinicalAssociation: string;
}

export interface CardiacManagement {
  category: 'diagnostic' | 'monitoring' | 'treatment' | 'lifestyle' | 'counseling';
  recommendation: string;
  frequency?: string;
  urgency?: 'immediate' | 'soon' | 'routine';
  guideline?: string;
}

export interface CardiacGeneInfo {
  gene: string;
  fullName: string;
  function: string;
  conditions: string[];
  inheritance: 'autosomal_dominant' | 'autosomal_recessive' | 'x_linked';
  penetrance: 'high' | 'moderate' | 'low' | 'variable';
  clinicalFeatures: string[];
  diagnosticTests: CardiacManagement[];
  management: CardiacManagement[];
}

export class CardiacGeneticPanel {
  private static readonly CARDIAC_GENES: Record<string, CardiacGeneInfo> = {
    MYH7: {
      gene: 'MYH7',
      fullName: 'Myosin Heavy Chain 7',
      function: 'Cardiac muscle contraction',
      conditions: ['Hypertrophic Cardiomyopathy', 'Dilated Cardiomyopathy'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      clinicalFeatures: [
        'Left ventricular hypertrophy',
        'Diastolic dysfunction',
        'Risk of sudden cardiac death',
        'Heart failure',
        'Arrhythmias',
      ],
      diagnosticTests: [
        {
          category: 'diagnostic',
          recommendation: 'Comprehensive cardiovascular evaluation',
          urgency: 'soon',
          guideline: 'AHA/ACC',
        },
        {
          category: 'diagnostic',
          recommendation: 'Echocardiogram',
          urgency: 'soon',
          guideline: 'AHA/ACC',
        },
        {
          category: 'diagnostic',
          recommendation: 'ECG (12-lead)',
          urgency: 'soon',
          guideline: 'AHA/ACC',
        },
        {
          category: 'diagnostic',
          recommendation: 'Cardiac MRI if echocardiogram inconclusive',
          urgency: 'routine',
          guideline: 'AHA/ACC',
        },
      ],
      management: [
        {
          category: 'monitoring',
          recommendation: 'Annual echocardiogram',
          frequency: 'Annually',
          guideline: 'AHA/ACC HCM Guidelines',
        },
        {
          category: 'monitoring',
          recommendation: 'Holter monitor or event recorder',
          frequency: 'As clinically indicated',
          guideline: 'AHA/ACC',
        },
        {
          category: 'treatment',
          recommendation: 'Beta-blockers or calcium channel blockers',
          guideline: 'AHA/ACC',
        },
        {
          category: 'treatment',
          recommendation: 'ICD if high-risk features present',
          guideline: 'AHA/ACC',
        },
        {
          category: 'lifestyle',
          recommendation: 'Avoid competitive sports and intense exercise',
          guideline: 'AHA/ACC',
        },
        {
          category: 'counseling',
          recommendation: 'Genetic counseling for family members',
          guideline: 'ACMG',
        },
      ],
    },
    MYBPC3: {
      gene: 'MYBPC3',
      fullName: 'Myosin Binding Protein C3',
      function: 'Cardiac muscle contraction regulation',
      conditions: ['Hypertrophic Cardiomyopathy'],
      inheritance: 'autosomal_dominant',
      penetrance: 'variable',
      clinicalFeatures: [
        'Left ventricular hypertrophy',
        'Often later onset than MYH7',
        'Variable expressivity',
        'Risk of sudden cardiac death',
      ],
      diagnosticTests: [
        {
          category: 'diagnostic',
          recommendation: 'Echocardiogram',
          urgency: 'soon',
          guideline: 'AHA/ACC',
        },
        {
          category: 'diagnostic',
          recommendation: 'ECG',
          urgency: 'soon',
          guideline: 'AHA/ACC',
        },
      ],
      management: [
        {
          category: 'monitoring',
          recommendation: 'Annual echocardiogram',
          frequency: 'Annually',
          guideline: 'AHA/ACC',
        },
        {
          category: 'treatment',
          recommendation: 'Medical therapy as appropriate for HCM',
          guideline: 'AHA/ACC',
        },
        {
          category: 'lifestyle',
          recommendation: 'Exercise restrictions based on phenotype',
          guideline: 'AHA/ACC',
        },
      ],
    },
    KCNQ1: {
      gene: 'KCNQ1',
      fullName: 'Potassium Voltage-Gated Channel Subfamily Q Member 1',
      function: 'Cardiac repolarization',
      conditions: ['Long QT Syndrome Type 1', 'Jervell and Lange-Nielsen Syndrome'],
      inheritance: 'autosomal_dominant',
      penetrance: 'moderate',
      clinicalFeatures: [
        'QT prolongation',
        'Risk of torsades de pointes',
        'Syncope',
        'Sudden cardiac death',
        'Exercise-triggered arrhythmias (especially swimming)',
      ],
      diagnosticTests: [
        {
          category: 'diagnostic',
          recommendation: 'ECG with QTc measurement',
          urgency: 'soon',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'diagnostic',
          recommendation: 'Exercise stress test',
          urgency: 'soon',
          guideline: 'HRS/EHRA/APHRS',
        },
      ],
      management: [
        {
          category: 'treatment',
          recommendation: 'Beta-blocker therapy (nadolol or propranolol)',
          urgency: 'soon',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'treatment',
          recommendation: 'ICD if high-risk (cardiac arrest, syncope on beta-blocker)',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'lifestyle',
          recommendation: 'Avoid QT-prolonging medications',
          urgency: 'immediate',
          guideline: 'crediblemeds.org',
        },
        {
          category: 'lifestyle',
          recommendation: 'Avoid competitive swimming and other triggers',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'monitoring',
          recommendation: 'Annual ECG and clinical evaluation',
          frequency: 'Annually',
          guideline: 'HRS/EHRA/APHRS',
        },
      ],
    },
    KCNH2: {
      gene: 'KCNH2',
      fullName: 'Potassium Voltage-Gated Channel Subfamily H Member 2',
      function: 'Cardiac repolarization',
      conditions: ['Long QT Syndrome Type 2'],
      inheritance: 'autosomal_dominant',
      penetrance: 'moderate',
      clinicalFeatures: [
        'QT prolongation',
        'Auditory-triggered arrhythmias',
        'Syncope',
        'Sudden cardiac death',
        'Post-partum risk period',
      ],
      diagnosticTests: [
        {
          category: 'diagnostic',
          recommendation: 'ECG with QTc measurement',
          urgency: 'soon',
          guideline: 'HRS/EHRA/APHRS',
        },
      ],
      management: [
        {
          category: 'treatment',
          recommendation: 'Beta-blocker therapy',
          urgency: 'soon',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'treatment',
          recommendation: 'ICD if high-risk',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'lifestyle',
          recommendation: 'Avoid QT-prolonging medications',
          urgency: 'immediate',
          guideline: 'crediblemeds.org',
        },
        {
          category: 'lifestyle',
          recommendation: 'Avoid loud noises and startling stimuli',
          guideline: 'HRS/EHRA/APHRS',
        },
      ],
    },
    SCN5A: {
      gene: 'SCN5A',
      fullName: 'Sodium Voltage-Gated Channel Alpha Subunit 5',
      function: 'Cardiac depolarization',
      conditions: ['Long QT Syndrome Type 3', 'Brugada Syndrome', 'Cardiac Conduction Disease'],
      inheritance: 'autosomal_dominant',
      penetrance: 'variable',
      clinicalFeatures: [
        'QT prolongation (LQT3)',
        'Brugada pattern on ECG',
        'Ventricular arrhythmias during rest/sleep',
        'Conduction abnormalities',
        'Risk of sudden cardiac death',
      ],
      diagnosticTests: [
        {
          category: 'diagnostic',
          recommendation: 'ECG',
          urgency: 'soon',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'diagnostic',
          recommendation: 'Ajmaline or flecainide challenge test for Brugada',
          urgency: 'routine',
          guideline: 'HRS/EHRA/APHRS',
        },
      ],
      management: [
        {
          category: 'treatment',
          recommendation: 'ICD for high-risk Brugada or LQT3 patients',
          guideline: 'HRS/EHRA/APHRS',
        },
        {
          category: 'treatment',
          recommendation: 'Avoid fever (treat promptly)',
          guideline: 'Brugada Guidelines',
        },
        {
          category: 'lifestyle',
          recommendation: 'Avoid drugs that block cardiac sodium channels',
          urgency: 'immediate',
          guideline: 'Brugada Guidelines',
        },
        {
          category: 'monitoring',
          recommendation: 'Regular cardiology follow-up',
          frequency: 'Every 6-12 months',
          guideline: 'HRS/EHRA/APHRS',
        },
      ],
    },
    LDLR: {
      gene: 'LDLR',
      fullName: 'Low-Density Lipoprotein Receptor',
      function: 'Cholesterol metabolism',
      conditions: ['Familial Hypercholesterolemia'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      clinicalFeatures: [
        'Elevated LDL cholesterol (>190 mg/dL)',
        'Premature coronary artery disease',
        'Tendon xanthomas',
        'Corneal arcus',
        'Family history of early heart disease',
      ],
      diagnosticTests: [
        {
          category: 'diagnostic',
          recommendation: 'Lipid panel (fasting)',
          urgency: 'soon',
          guideline: 'AHA/ACC',
        },
        {
          category: 'diagnostic',
          recommendation: 'Physical examination for xanthomas',
          urgency: 'routine',
          guideline: 'FH Foundation',
        },
        {
          category: 'diagnostic',
          recommendation: 'Coronary calcium score (if >30 years old)',
          urgency: 'routine',
          guideline: 'AHA/ACC',
        },
      ],
      management: [
        {
          category: 'treatment',
          recommendation: 'High-intensity statin therapy',
          urgency: 'soon',
          guideline: 'AHA/ACC',
        },
        {
          category: 'treatment',
          recommendation: 'Consider ezetimibe and/or PCSK9 inhibitor',
          guideline: 'AHA/ACC',
        },
        {
          category: 'monitoring',
          recommendation: 'Lipid panel every 3-6 months until LDL goal achieved, then annually',
          frequency: 'Variable',
          guideline: 'AHA/ACC',
        },
        {
          category: 'lifestyle',
          recommendation: 'Heart-healthy diet (low saturated fat)',
          guideline: 'AHA/ACC',
        },
        {
          category: 'lifestyle',
          recommendation: 'Regular aerobic exercise',
          guideline: 'AHA/ACC',
        },
        {
          category: 'counseling',
          recommendation: 'Cascade screening for family members',
          urgency: 'routine',
          guideline: 'FH Foundation',
        },
      ],
    },
    PKP2: {
      gene: 'PKP2',
      fullName: 'Plakophilin 2',
      function: 'Desmosome structure',
      conditions: ['Arrhythmogenic Right Ventricular Cardiomyopathy'],
      inheritance: 'autosomal_dominant',
      penetrance: 'variable',
      clinicalFeatures: [
        'Right ventricular dysfunction',
        'Ventricular arrhythmias',
        'T-wave inversion V1-V3',
        'Epsilon waves',
        'Risk of sudden cardiac death',
      ],
      diagnosticTests: [
        {
          category: 'diagnostic',
          recommendation: 'ECG',
          urgency: 'soon',
          guideline: 'HRS Expert Consensus',
        },
        {
          category: 'diagnostic',
          recommendation: 'Echocardiogram',
          urgency: 'soon',
          guideline: 'HRS Expert Consensus',
        },
        {
          category: 'diagnostic',
          recommendation: 'Cardiac MRI',
          urgency: 'soon',
          guideline: 'HRS Expert Consensus',
        },
        {
          category: 'diagnostic',
          recommendation: '24-hour Holter monitor',
          urgency: 'routine',
          guideline: 'HRS Expert Consensus',
        },
      ],
      management: [
        {
          category: 'treatment',
          recommendation: 'ICD for high-risk patients',
          guideline: 'HRS Expert Consensus',
        },
        {
          category: 'treatment',
          recommendation: 'Beta-blockers',
          guideline: 'HRS Expert Consensus',
        },
        {
          category: 'lifestyle',
          recommendation: 'Avoid competitive sports and intense exercise',
          urgency: 'immediate',
          guideline: 'HRS Expert Consensus',
        },
        {
          category: 'monitoring',
          recommendation: 'Annual evaluation with imaging and ECG',
          frequency: 'Annually',
          guideline: 'HRS Expert Consensus',
        },
      ],
    },
  };

  /**
   * Analyze variants for cardiac genetic risk
   */
  static analyzeCardiacRisk(
    variants: VCFVariant[],
    annotations: VariantAnnotation[],
    sampleName: string
  ): CardiacRiskAssessment[] {
    const assessments: CardiacRiskAssessment[] = [];

    for (const [geneName, geneInfo] of Object.entries(this.CARDIAC_GENES)) {
      const geneVariants = this.extractGeneVariants(variants, annotations, geneName, sampleName);

      if (geneVariants.length === 0) continue;

      const assessment = this.assessGeneRisk(geneInfo, geneVariants);
      assessments.push(assessment);
    }

    return assessments;
  }

  /**
   * Extract variants for a specific cardiac gene
   */
  private static extractGeneVariants(
    variants: VCFVariant[],
    annotations: VariantAnnotation[],
    geneName: string,
    sampleName: string
  ): CardiacVariant[] {
    const cardiacVariants: CardiacVariant[] = [];

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const annotation = annotations[i];

      if (!annotation?.geneContext || annotation.geneContext.geneSymbol !== geneName) {
        continue;
      }

      // Only include non-benign variants
      if (
        annotation.acmgClassification?.classification === 'benign' ||
        annotation.acmgClassification?.classification === 'likely_benign'
      ) {
        continue;
      }

      const sample = variant.samples[sampleName];
      if (!sample?.GT) continue;

      // Check if variant is heterozygous or homozygous alt
      const gt = String(sample.GT);
      if (gt === '0/0' || gt === '0|0') continue; // Homozygous reference

      cardiacVariants.push({
        gene: geneName,
        hgvsc: annotation.transcript?.[0]?.hgvsc || 'unknown',
        hgvsp: annotation.transcript?.[0]?.hgvsp || 'unknown',
        chromosome: variant.chromosome,
        position: variant.position,
        reference: variant.reference,
        alternate: variant.alternate[0],
        classification: annotation.acmgClassification?.classification || 'vus',
        functionalImpact: annotation.functionalImpact?.consequence || 'unknown',
        prevalence: annotation.populationFrequency?.maxPopulationFrequency,
        clinicalAssociation: this.CARDIAC_GENES[geneName]?.conditions.join(', ') || 'Unknown',
      });
    }

    return cardiacVariants;
  }

  /**
   * Assess risk for a specific gene
   */
  private static assessGeneRisk(
    geneInfo: CardiacGeneInfo,
    variants: CardiacVariant[]
  ): CardiacRiskAssessment {
    const pathogenicVariants = variants.filter((v) => v.classification === 'pathogenic');
    const likelyPathogenicVariants = variants.filter(
      (v) => v.classification === 'likely_pathogenic'
    );
    const vus = variants.filter((v) => v.classification === 'vus');

    let riskLevel: CardiacRiskAssessment['riskLevel'] = 'low';

    if (pathogenicVariants.length > 0) {
      riskLevel = 'high';
    } else if (likelyPathogenicVariants.length > 0) {
      riskLevel = 'moderate';
    } else if (vus.length > 0) {
      riskLevel = 'uncertain';
    }

    // Combine diagnostic tests and management
    const management =
      riskLevel === 'high' || riskLevel === 'moderate'
        ? [...geneInfo.diagnosticTests, ...geneInfo.management]
        : geneInfo.diagnosticTests;

    // Family screening recommended for pathogenic/likely pathogenic variants
    const familyScreening = riskLevel === 'high' || riskLevel === 'moderate';

    return {
      gene: geneInfo.gene,
      condition: geneInfo.conditions[0], // Primary condition
      pathogenicVariants,
      likelyPathogenicVariants,
      vus,
      riskLevel,
      clinicalFeatures: geneInfo.clinicalFeatures,
      management,
      familyScreening,
      inheritance: geneInfo.inheritance,
      penetrance: geneInfo.penetrance,
    };
  }

  /**
   * Get high-risk assessments
   */
  static getHighRiskAssessments(
    assessments: CardiacRiskAssessment[]
  ): CardiacRiskAssessment[] {
    return assessments.filter((a) => a.riskLevel === 'high');
  }

  /**
   * Get all cardiac genes
   */
  static getCardiacGenes(): string[] {
    return Object.keys(this.CARDIAC_GENES);
  }

  /**
   * Get gene information
   */
  static getGeneInfo(gene: string): CardiacGeneInfo | null {
    return this.CARDIAC_GENES[gene] || null;
  }

  /**
   * Generate cardiac risk report
   */
  static generateRiskReport(assessment: CardiacRiskAssessment): string {
    const lines: string[] = [];

    lines.push(`=== ${assessment.gene} Gene Analysis ===`);
    lines.push('');

    lines.push(`Condition: ${assessment.condition}`);
    lines.push(`Inheritance: ${assessment.inheritance.replace('_', ' ')}`);
    lines.push(`Penetrance: ${assessment.penetrance}`);
    lines.push('');

    lines.push(`Risk Level: ${assessment.riskLevel.toUpperCase()}`);
    lines.push('');

    if (assessment.pathogenicVariants.length > 0) {
      lines.push('Pathogenic Variants Found:');
      for (const variant of assessment.pathogenicVariants) {
        lines.push(`  - ${variant.hgvsp} (${variant.hgvsc})`);
        lines.push(`    Position: chr${variant.chromosome}:${variant.position}`);
        lines.push(`    Impact: ${variant.functionalImpact}`);
      }
      lines.push('');
    }

    if (assessment.likelyPathogenicVariants.length > 0) {
      lines.push('Likely Pathogenic Variants Found:');
      for (const variant of assessment.likelyPathogenicVariants) {
        lines.push(`  - ${variant.hgvsp} (${variant.hgvsc})`);
      }
      lines.push('');
    }

    if (assessment.vus.length > 0) {
      lines.push('Variants of Uncertain Significance (VUS):');
      for (const variant of assessment.vus) {
        lines.push(`  - ${variant.hgvsp}`);
      }
      lines.push('');
    }

    if (assessment.clinicalFeatures.length > 0) {
      lines.push('Clinical Features to Monitor:');
      for (const feature of assessment.clinicalFeatures) {
        lines.push(`  - ${feature}`);
      }
      lines.push('');
    }

    if (assessment.management.length > 0) {
      lines.push('Management Recommendations:');
      const categories = ['diagnostic', 'treatment', 'monitoring', 'lifestyle', 'counseling'];

      for (const category of categories) {
        const categoryRecs = assessment.management.filter((m) => m.category === category);
        if (categoryRecs.length === 0) continue;

        lines.push(`  ${category.toUpperCase()}:`);
        for (const rec of categoryRecs) {
          lines.push(`    - ${rec.recommendation}`);
          if (rec.frequency) lines.push(`      Frequency: ${rec.frequency}`);
          if (rec.urgency) lines.push(`      Urgency: ${rec.urgency}`);
          if (rec.guideline) lines.push(`      Guideline: ${rec.guideline}`);
        }
      }
      lines.push('');
    }

    if (assessment.familyScreening) {
      lines.push('FAMILY SCREENING RECOMMENDED');
      lines.push(
        'First-degree relatives should be offered genetic testing and clinical evaluation.'
      );
    }

    return lines.join('\n');
  }

  /**
   * Get immediate action items
   */
  static getImmediateActions(assessment: CardiacRiskAssessment): CardiacManagement[] {
    return assessment.management.filter((m) => m.urgency === 'immediate' || m.urgency === 'soon');
  }
}
