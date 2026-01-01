/**
 * Hereditary Cancer Panel
 * Analyzes variants in cancer predisposition genes
 * Implements ACMG guidelines for cancer gene classification
 */

import { VCFVariant } from '../vcf/parser';
import { VariantAnnotation } from '../vcf/annotator';

export interface CancerRiskAssessment {
  gene: string;
  cancerTypes: string[];
  pathogenicVariants: CancerVariant[];
  likelyPathogenicVariants: CancerVariant[];
  vus: CancerVariant[];
  riskLevel: 'high' | 'moderate' | 'average' | 'uncertain';
  lifetimeRisk?: LifetimeRisk;
  management: ManagementRecommendation[];
  inheritance: 'autosomal_dominant' | 'autosomal_recessive' | 'x_linked';
  penetrance: 'high' | 'moderate' | 'low';
}

export interface CancerVariant {
  gene: string;
  hgvsc: string;
  hgvsp: string;
  chromosome: string;
  position: number;
  reference: string;
  alternate: string;
  classification: 'pathogenic' | 'likely_pathogenic' | 'vus' | 'likely_benign' | 'benign';
  clinicalSignificance?: string;
  cancerAssociation: string[];
  functionalImpact: string;
  prevalence?: number;
}

export interface LifetimeRisk {
  cancerType: string;
  withVariant: number;
  general: number;
  relativeRisk: number;
  ageRange?: string;
}

export interface ManagementRecommendation {
  category: 'screening' | 'prevention' | 'treatment' | 'counseling';
  recommendation: string;
  frequency?: string;
  ageToStart?: number;
  guideline?: string;
}

export interface CancerGeneInfo {
  gene: string;
  fullName: string;
  function: string;
  cancerTypes: string[];
  inheritance: 'autosomal_dominant' | 'autosomal_recessive' | 'x_linked';
  penetrance: 'high' | 'moderate' | 'low';
  lifetimeRisks: LifetimeRisk[];
  screening: ManagementRecommendation[];
  prevention: ManagementRecommendation[];
}

export class HereditaryCancerPanel {
  private static readonly CANCER_GENES: Record<string, CancerGeneInfo> = {
    BRCA1: {
      gene: 'BRCA1',
      fullName: 'Breast Cancer 1 gene',
      function: 'DNA repair, tumor suppressor',
      cancerTypes: ['Breast cancer', 'Ovarian cancer', 'Pancreatic cancer', 'Prostate cancer'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      lifetimeRisks: [
        {
          cancerType: 'Breast cancer',
          withVariant: 0.72,
          general: 0.125,
          relativeRisk: 5.76,
          ageRange: 'by age 80',
        },
        {
          cancerType: 'Ovarian cancer',
          withVariant: 0.44,
          general: 0.013,
          relativeRisk: 33.8,
          ageRange: 'by age 80',
        },
      ],
      screening: [
        {
          category: 'screening',
          recommendation: 'Clinical breast examination every 6-12 months',
          frequency: 'Every 6-12 months',
          ageToStart: 25,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Annual mammography and breast MRI',
          frequency: 'Annually',
          ageToStart: 30,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Consider transvaginal ultrasound and CA-125',
          frequency: 'Every 6 months',
          ageToStart: 30,
          guideline: 'NCCN',
        },
      ],
      prevention: [
        {
          category: 'prevention',
          recommendation: 'Risk-reducing mastectomy (90% risk reduction)',
          guideline: 'NCCN',
        },
        {
          category: 'prevention',
          recommendation: 'Risk-reducing salpingo-oophorectomy (85-95% ovarian cancer risk reduction)',
          ageToStart: 35,
          guideline: 'NCCN',
        },
        {
          category: 'prevention',
          recommendation: 'Consider chemoprevention (tamoxifen, raloxifene)',
          guideline: 'NCCN',
        },
      ],
    },
    BRCA2: {
      gene: 'BRCA2',
      fullName: 'Breast Cancer 2 gene',
      function: 'DNA repair, tumor suppressor',
      cancerTypes: ['Breast cancer', 'Ovarian cancer', 'Pancreatic cancer', 'Prostate cancer', 'Melanoma'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      lifetimeRisks: [
        {
          cancerType: 'Breast cancer',
          withVariant: 0.69,
          general: 0.125,
          relativeRisk: 5.52,
          ageRange: 'by age 80',
        },
        {
          cancerType: 'Ovarian cancer',
          withVariant: 0.17,
          general: 0.013,
          relativeRisk: 13.1,
          ageRange: 'by age 80',
        },
        {
          cancerType: 'Pancreatic cancer',
          withVariant: 0.05,
          general: 0.015,
          relativeRisk: 3.3,
        },
      ],
      screening: [
        {
          category: 'screening',
          recommendation: 'Clinical breast examination every 6-12 months',
          frequency: 'Every 6-12 months',
          ageToStart: 25,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Annual mammography and breast MRI',
          frequency: 'Annually',
          ageToStart: 30,
          guideline: 'NCCN',
        },
      ],
      prevention: [
        {
          category: 'prevention',
          recommendation: 'Risk-reducing mastectomy',
          guideline: 'NCCN',
        },
        {
          category: 'prevention',
          recommendation: 'Risk-reducing salpingo-oophorectomy',
          ageToStart: 40,
          guideline: 'NCCN',
        },
      ],
    },
    TP53: {
      gene: 'TP53',
      fullName: 'Tumor Protein p53',
      function: 'Cell cycle regulation, tumor suppressor',
      cancerTypes: [
        'Breast cancer',
        'Soft tissue sarcoma',
        'Osteosarcoma',
        'Brain tumors',
        'Adrenocortical carcinoma',
        'Leukemia',
      ],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      lifetimeRisks: [
        {
          cancerType: 'Any cancer',
          withVariant: 0.90,
          general: 0.40,
          relativeRisk: 2.25,
          ageRange: 'by age 70',
        },
      ],
      screening: [
        {
          category: 'screening',
          recommendation: 'Comprehensive annual physical examination',
          frequency: 'Annually',
          ageToStart: 18,
          guideline: 'Li-Fraumeni Protocol',
        },
        {
          category: 'screening',
          recommendation: 'Whole body MRI',
          frequency: 'Annually',
          ageToStart: 18,
          guideline: 'Li-Fraumeni Protocol',
        },
        {
          category: 'screening',
          recommendation: 'Brain MRI',
          frequency: 'Annually',
          ageToStart: 18,
          guideline: 'Li-Fraumeni Protocol',
        },
        {
          category: 'screening',
          recommendation: 'Annual breast MRI (females)',
          frequency: 'Annually',
          ageToStart: 20,
          guideline: 'NCCN',
        },
      ],
      prevention: [],
    },
    MLH1: {
      gene: 'MLH1',
      fullName: 'MutL Homolog 1',
      function: 'DNA mismatch repair',
      cancerTypes: ['Colorectal cancer', 'Endometrial cancer', 'Ovarian cancer', 'Gastric cancer'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      lifetimeRisks: [
        {
          cancerType: 'Colorectal cancer',
          withVariant: 0.54,
          general: 0.045,
          relativeRisk: 12.0,
          ageRange: 'by age 70',
        },
        {
          cancerType: 'Endometrial cancer',
          withVariant: 0.43,
          general: 0.028,
          relativeRisk: 15.4,
          ageRange: 'by age 70',
        },
      ],
      screening: [
        {
          category: 'screening',
          recommendation: 'Colonoscopy',
          frequency: 'Every 1-2 years',
          ageToStart: 25,
          guideline: 'NCCN - Lynch Syndrome',
        },
        {
          category: 'screening',
          recommendation: 'Annual endometrial biopsy and transvaginal ultrasound',
          frequency: 'Annually',
          ageToStart: 30,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Upper endoscopy',
          frequency: 'Every 3-5 years',
          ageToStart: 30,
          guideline: 'NCCN',
        },
      ],
      prevention: [
        {
          category: 'prevention',
          recommendation: 'Consider prophylactic hysterectomy and bilateral salpingo-oophorectomy',
          guideline: 'NCCN',
        },
      ],
    },
    MSH2: {
      gene: 'MSH2',
      fullName: 'MutS Homolog 2',
      function: 'DNA mismatch repair',
      cancerTypes: ['Colorectal cancer', 'Endometrial cancer', 'Ovarian cancer', 'Gastric cancer', 'Urothelial cancer'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      lifetimeRisks: [
        {
          cancerType: 'Colorectal cancer',
          withVariant: 0.48,
          general: 0.045,
          relativeRisk: 10.7,
          ageRange: 'by age 70',
        },
        {
          cancerType: 'Endometrial cancer',
          withVariant: 0.30,
          general: 0.028,
          relativeRisk: 10.7,
          ageRange: 'by age 70',
        },
      ],
      screening: [
        {
          category: 'screening',
          recommendation: 'Colonoscopy',
          frequency: 'Every 1-2 years',
          ageToStart: 25,
          guideline: 'NCCN - Lynch Syndrome',
        },
        {
          category: 'screening',
          recommendation: 'Annual endometrial biopsy and transvaginal ultrasound',
          frequency: 'Annually',
          ageToStart: 30,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Urinalysis',
          frequency: 'Annually',
          ageToStart: 30,
          guideline: 'NCCN',
        },
      ],
      prevention: [],
    },
    APC: {
      gene: 'APC',
      fullName: 'Adenomatous Polyposis Coli',
      function: 'Wnt signaling pathway regulation',
      cancerTypes: ['Colorectal cancer', 'Duodenal cancer', 'Thyroid cancer', 'Brain tumors'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      lifetimeRisks: [
        {
          cancerType: 'Colorectal cancer',
          withVariant: 0.90,
          general: 0.045,
          relativeRisk: 20.0,
          ageRange: 'by age 40',
        },
      ],
      screening: [
        {
          category: 'screening',
          recommendation: 'Colonoscopy or flexible sigmoidoscopy',
          frequency: 'Every 1-2 years',
          ageToStart: 10,
          guideline: 'NCCN - FAP',
        },
        {
          category: 'screening',
          recommendation: 'Upper endoscopy',
          frequency: 'Every 1-3 years',
          ageToStart: 25,
          guideline: 'NCCN',
        },
      ],
      prevention: [
        {
          category: 'prevention',
          recommendation: 'Prophylactic colectomy (typically by age 20-25)',
          guideline: 'NCCN',
        },
      ],
    },
    PTEN: {
      gene: 'PTEN',
      fullName: 'Phosphatase and Tensin Homolog',
      function: 'Cell growth regulation, tumor suppressor',
      cancerTypes: ['Breast cancer', 'Thyroid cancer', 'Endometrial cancer', 'Colorectal cancer'],
      inheritance: 'autosomal_dominant',
      penetrance: 'high',
      lifetimeRisks: [
        {
          cancerType: 'Breast cancer',
          withVariant: 0.85,
          general: 0.125,
          relativeRisk: 6.8,
        },
        {
          cancerType: 'Thyroid cancer',
          withVariant: 0.35,
          general: 0.013,
          relativeRisk: 26.9,
        },
        {
          cancerType: 'Endometrial cancer',
          withVariant: 0.28,
          general: 0.028,
          relativeRisk: 10.0,
        },
      ],
      screening: [
        {
          category: 'screening',
          recommendation: 'Annual comprehensive physical examination',
          frequency: 'Annually',
          ageToStart: 18,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Annual breast imaging (mammography and MRI)',
          frequency: 'Annually',
          ageToStart: 30,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Annual thyroid ultrasound',
          frequency: 'Annually',
          ageToStart: 18,
          guideline: 'NCCN',
        },
        {
          category: 'screening',
          recommendation: 'Annual endometrial sampling or ultrasound',
          frequency: 'Annually',
          ageToStart: 35,
          guideline: 'NCCN',
        },
      ],
      prevention: [],
    },
  };

  /**
   * Analyze variants for hereditary cancer risk
   */
  static analyzeCancerRisk(
    variants: VCFVariant[],
    annotations: VariantAnnotation[],
    sampleName: string
  ): CancerRiskAssessment[] {
    const assessments: CancerRiskAssessment[] = [];

    for (const [geneName, geneInfo] of Object.entries(this.CANCER_GENES)) {
      const geneVariants = this.extractGeneVariants(variants, annotations, geneName, sampleName);

      if (geneVariants.length === 0) continue;

      const assessment = this.assessGeneRisk(geneInfo, geneVariants);
      assessments.push(assessment);
    }

    return assessments;
  }

  /**
   * Extract variants for a specific cancer gene
   */
  private static extractGeneVariants(
    variants: VCFVariant[],
    annotations: VariantAnnotation[],
    geneName: string,
    sampleName: string
  ): CancerVariant[] {
    const cancerVariants: CancerVariant[] = [];

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

      cancerVariants.push({
        gene: geneName,
        hgvsc: annotation.transcript?.[0]?.hgvsc || 'unknown',
        hgvsp: annotation.transcript?.[0]?.hgvsp || 'unknown',
        chromosome: variant.chromosome,
        position: variant.position,
        reference: variant.reference,
        alternate: variant.alternate[0],
        classification: annotation.acmgClassification?.classification || 'vus',
        clinicalSignificance: annotation.clinicalSignificance?.significance,
        cancerAssociation: this.CANCER_GENES[geneName]?.cancerTypes || [],
        functionalImpact: annotation.functionalImpact?.consequence || 'unknown',
        prevalence: annotation.populationFrequency?.maxPopulationFrequency,
      });
    }

    return cancerVariants;
  }

  /**
   * Assess risk for a specific gene
   */
  private static assessGeneRisk(
    geneInfo: CancerGeneInfo,
    variants: CancerVariant[]
  ): CancerRiskAssessment {
    const pathogenicVariants = variants.filter((v) => v.classification === 'pathogenic');
    const likelyPathogenicVariants = variants.filter(
      (v) => v.classification === 'likely_pathogenic'
    );
    const vus = variants.filter((v) => v.classification === 'vus');

    let riskLevel: CancerRiskAssessment['riskLevel'] = 'average';

    if (pathogenicVariants.length > 0) {
      riskLevel = 'high';
    } else if (likelyPathogenicVariants.length > 0) {
      riskLevel = 'moderate';
    } else if (vus.length > 0) {
      riskLevel = 'uncertain';
    }

    // Get management recommendations based on risk level
    const management =
      riskLevel === 'high' || riskLevel === 'moderate'
        ? [...geneInfo.screening, ...geneInfo.prevention]
        : [];

    // Add genetic counseling recommendation
    if (riskLevel !== 'average') {
      management.unshift({
        category: 'counseling',
        recommendation: 'Genetic counseling strongly recommended',
        guideline: 'NCCN',
      });
    }

    // Get lifetime risk (first one if available)
    const lifetimeRisk = riskLevel === 'high' ? geneInfo.lifetimeRisks[0] : undefined;

    return {
      gene: geneInfo.gene,
      cancerTypes: geneInfo.cancerTypes,
      pathogenicVariants,
      likelyPathogenicVariants,
      vus,
      riskLevel,
      lifetimeRisk,
      management,
      inheritance: geneInfo.inheritance,
      penetrance: geneInfo.penetrance,
    };
  }

  /**
   * Get high-risk assessments
   */
  static getHighRiskAssessments(
    assessments: CancerRiskAssessment[]
  ): CancerRiskAssessment[] {
    return assessments.filter((a) => a.riskLevel === 'high');
  }

  /**
   * Get all cancer genes
   */
  static getCancerGenes(): string[] {
    return Object.keys(this.CANCER_GENES);
  }

  /**
   * Get gene information
   */
  static getGeneInfo(gene: string): CancerGeneInfo | null {
    return this.CANCER_GENES[gene] || null;
  }

  /**
   * Generate cancer risk report
   */
  static generateRiskReport(assessment: CancerRiskAssessment): string {
    const lines: string[] = [];

    lines.push(`=== ${assessment.gene} Gene Analysis ===`);
    lines.push('');

    lines.push(`Cancer Types Associated: ${assessment.cancerTypes.join(', ')}`);
    lines.push(`Inheritance Pattern: ${assessment.inheritance.replace('_', ' ')}`);
    lines.push(`Penetrance: ${assessment.penetrance}`);
    lines.push('');

    lines.push(`Risk Level: ${assessment.riskLevel.toUpperCase().replace('_', ' ')}`);
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

    if (assessment.lifetimeRisk) {
      lines.push('Lifetime Risk:');
      lines.push(`  Cancer Type: ${assessment.lifetimeRisk.cancerType}`);
      lines.push(
        `  Risk with variant: ${(assessment.lifetimeRisk.withVariant * 100).toFixed(1)}%`
      );
      lines.push(
        `  General population risk: ${(assessment.lifetimeRisk.general * 100).toFixed(1)}%`
      );
      lines.push(
        `  Relative risk: ${assessment.lifetimeRisk.relativeRisk.toFixed(1)}x`
      );
      lines.push('');
    }

    if (assessment.management.length > 0) {
      lines.push('Management Recommendations:');
      for (const rec of assessment.management) {
        lines.push(`  [${rec.category.toUpperCase()}] ${rec.recommendation}`);
        if (rec.frequency) lines.push(`    Frequency: ${rec.frequency}`);
        if (rec.ageToStart) lines.push(`    Start at age: ${rec.ageToStart}`);
        if (rec.guideline) lines.push(`    Guideline: ${rec.guideline}`);
      }
    }

    return lines.join('\n');
  }
}
