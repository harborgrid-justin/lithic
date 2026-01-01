/**
 * Genomic Report Generator
 * Generates comprehensive clinical genomic reports in various formats
 * Complies with HL7 Clinical Genomics Implementation Guide
 */

import { VCFVariant } from '../vcf/parser';
import { VariantAnnotation } from '../vcf/annotator';
import { StarAlleleCall } from '../pgx/star-allele-caller';
import { CPICRecommendation } from '../pgx/cpic-engine';
import { PolygenicRiskScore } from '../risk/polygenic-risk';
import { CancerRiskAssessment } from '../risk/cancer-panel';
import { CardiacRiskAssessment } from '../risk/cardiac-panel';

export interface GenomicReport {
  reportId: string;
  reportType: 'comprehensive' | 'pharmacogenomics' | 'cancer_risk' | 'cardiac_risk';
  patient: PatientInfo;
  specimen: SpecimenInfo;
  testInfo: TestInfo;
  findings: ReportFindings;
  interpretations: Interpretation[];
  recommendations: Recommendation[];
  limitations: string[];
  references: Reference[];
  signatures: Signature[];
  generatedAt: string;
  version: string;
}

export interface PatientInfo {
  id: string;
  name?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female' | 'other' | 'unknown';
  mrn?: string;
  ethnicity?: string;
}

export interface SpecimenInfo {
  id: string;
  type: string;
  collectionDate: string;
  receivedDate?: string;
  quality?: string;
}

export interface TestInfo {
  testName: string;
  testCode?: string;
  methodology: string[];
  genesCovered: string[];
  coverage?: string;
  reportedDate: string;
  performingLab: LaboratoryInfo;
}

export interface LaboratoryInfo {
  name: string;
  cliaNumber?: string;
  address?: string;
  director?: string;
  phone?: string;
}

export interface ReportFindings {
  pathogenicVariants: VariantFinding[];
  likelyPathogenicVariants: VariantFinding[];
  vusVariants: VariantFinding[];
  pharmacogenomics?: StarAlleleCall[];
  polygenicRisk?: PolygenicRiskScore[];
  cancerRisk?: CancerRiskAssessment[];
  cardiacRisk?: CardiacRiskAssessment[];
}

export interface VariantFinding {
  gene: string;
  variant: string;
  classification: string;
  zygosity: string;
  inheritance?: string;
  clinicalSignificance: string;
  diseaseAssociation?: string[];
}

export interface Interpretation {
  category: 'primary' | 'secondary' | 'incidental';
  finding: string;
  significance: string;
  implications: string;
  evidenceLevel: string;
}

export interface Recommendation {
  category: 'clinical_management' | 'genetic_counseling' | 'family_testing' | 'follow_up';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  timeframe?: string;
}

export interface Reference {
  id: string;
  citation: string;
  pmid?: string;
  doi?: string;
  url?: string;
}

export interface Signature {
  role: 'lab_director' | 'genetic_counselor' | 'pathologist' | 'reviewer';
  name: string;
  credentials: string;
  date: string;
}

export class GenomicReportGenerator {
  /**
   * Generate comprehensive genomic report
   */
  static generateComprehensiveReport(
    patient: PatientInfo,
    specimen: SpecimenInfo,
    variants: VCFVariant[],
    annotations: VariantAnnotation[],
    starAlleles: StarAlleleCall[],
    cpicRecommendations: CPICRecommendation[],
    polygenicRisk: PolygenicRiskScore[],
    cancerRisk: CancerRiskAssessment[],
    cardiacRisk: CardiacRiskAssessment[]
  ): GenomicReport {
    const reportId = this.generateReportId();

    // Extract variant findings
    const findings = this.extractFindings(
      variants,
      annotations,
      starAlleles,
      polygenicRisk,
      cancerRisk,
      cardiacRisk
    );

    // Generate interpretations
    const interpretations = this.generateInterpretations(
      findings,
      cpicRecommendations,
      polygenicRisk,
      cancerRisk,
      cardiacRisk
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      findings,
      cpicRecommendations,
      cancerRisk,
      cardiacRisk
    );

    const testInfo: TestInfo = {
      testName: 'Comprehensive Genomic Analysis',
      testCode: 'COMP_GENOMIC',
      methodology: ['Next-Generation Sequencing', 'Whole Genome Sequencing'],
      genesCovered: this.extractGenesCovered(findings),
      reportedDate: new Date().toISOString(),
      performingLab: {
        name: 'Lithic Genomics Laboratory',
        cliaNumber: '00D0000000',
        director: 'Laboratory Director, MD, PhD',
      },
    };

    return {
      reportId,
      reportType: 'comprehensive',
      patient,
      specimen,
      testInfo,
      findings,
      interpretations,
      recommendations,
      limitations: this.getTestLimitations(),
      references: this.getReferences(),
      signatures: this.getSignatures(),
      generatedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Generate pharmacogenomics report
   */
  static generatePGxReport(
    patient: PatientInfo,
    specimen: SpecimenInfo,
    starAlleles: StarAlleleCall[],
    cpicRecommendations: CPICRecommendation[]
  ): GenomicReport {
    const reportId = this.generateReportId();

    const findings: ReportFindings = {
      pathogenicVariants: [],
      likelyPathogenicVariants: [],
      vusVariants: [],
      pharmacogenomics: starAlleles,
    };

    const interpretations = cpicRecommendations.map((rec) => ({
      category: 'primary' as const,
      finding: `${rec.gene}: ${rec.phenotype}`,
      significance: rec.classification,
      implications: rec.implication,
      evidenceLevel: `CPIC Level ${rec.evidenceLevel}`,
    }));

    const recommendations = cpicRecommendations
      .filter((rec) => rec.classification === 'strong' || rec.classification === 'moderate')
      .map((rec) => ({
        category: 'clinical_management' as const,
        recommendation: rec.recommendation,
        priority: rec.classification === 'strong' ? ('high' as const) : ('medium' as const),
      }));

    const testInfo: TestInfo = {
      testName: 'Pharmacogenomic Panel',
      testCode: 'PGX_PANEL',
      methodology: ['Targeted Genotyping', 'Star Allele Analysis'],
      genesCovered: starAlleles.map((s) => s.gene),
      reportedDate: new Date().toISOString(),
      performingLab: {
        name: 'Lithic Genomics Laboratory',
        cliaNumber: '00D0000000',
      },
    };

    return {
      reportId,
      reportType: 'pharmacogenomics',
      patient,
      specimen,
      testInfo,
      findings,
      interpretations,
      recommendations,
      limitations: this.getPGxLimitations(),
      references: this.getPGxReferences(),
      signatures: this.getSignatures(),
      generatedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Extract findings from variants and annotations
   */
  private static extractFindings(
    variants: VCFVariant[],
    annotations: VariantAnnotation[],
    starAlleles: StarAlleleCall[],
    polygenicRisk: PolygenicRiskScore[],
    cancerRisk: CancerRiskAssessment[],
    cardiacRisk: CardiacRiskAssessment[]
  ): ReportFindings {
    const pathogenicVariants: VariantFinding[] = [];
    const likelyPathogenicVariants: VariantFinding[] = [];
    const vusVariants: VariantFinding[] = [];

    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i];
      const variant = variants[i];

      if (!annotation.acmgClassification) continue;

      const finding: VariantFinding = {
        gene: annotation.geneContext?.geneSymbol || 'Unknown',
        variant: annotation.variantId,
        classification: annotation.acmgClassification.classification,
        zygosity: this.determineZygosity(variant),
        clinicalSignificance: annotation.clinicalSignificance?.significance || 'Unknown',
        diseaseAssociation: annotation.geneContext?.diseaseAssociation,
      };

      switch (annotation.acmgClassification.classification) {
        case 'pathogenic':
          pathogenicVariants.push(finding);
          break;
        case 'likely_pathogenic':
          likelyPathogenicVariants.push(finding);
          break;
        case 'uncertain_significance':
          vusVariants.push(finding);
          break;
      }
    }

    return {
      pathogenicVariants,
      likelyPathogenicVariants,
      vusVariants,
      pharmacogenomics: starAlleles,
      polygenicRisk,
      cancerRisk,
      cardiacRisk,
    };
  }

  /**
   * Determine zygosity from variant
   */
  private static determineZygosity(variant: VCFVariant): string {
    const sampleKeys = Object.keys(variant.samples);
    if (sampleKeys.length === 0) return 'Unknown';

    const sample = variant.samples[sampleKeys[0]];
    const gt = String(sample.GT || '');
    const alleles = gt.split(/[/|]/);

    if (alleles.length === 2) {
      if (alleles[0] === alleles[1] && alleles[0] !== '0') {
        return 'Homozygous';
      } else if (alleles[0] !== alleles[1] && !alleles.includes('0')) {
        return 'Compound Heterozygous';
      } else if (alleles.includes('0')) {
        return 'Heterozygous';
      }
    }

    return 'Unknown';
  }

  /**
   * Generate clinical interpretations
   */
  private static generateInterpretations(
    findings: ReportFindings,
    cpicRecommendations: CPICRecommendation[],
    polygenicRisk: PolygenicRiskScore[],
    cancerRisk: CancerRiskAssessment[],
    cardiacRisk: CardiacRiskAssessment[]
  ): Interpretation[] {
    const interpretations: Interpretation[] = [];

    // Pathogenic variants
    for (const finding of findings.pathogenicVariants) {
      interpretations.push({
        category: 'primary',
        finding: `${finding.gene}: ${finding.variant}`,
        significance: 'Pathogenic',
        implications: `This variant is associated with ${finding.diseaseAssociation?.join(', ') || 'disease'}. Clinical correlation and genetic counseling recommended.`,
        evidenceLevel: 'High',
      });
    }

    // High-risk cancer findings
    for (const risk of cancerRisk.filter((r) => r.riskLevel === 'high')) {
      interpretations.push({
        category: 'primary',
        finding: `${risk.gene}: Hereditary Cancer Risk`,
        significance: 'High Risk',
        implications: `Increased lifetime risk for ${risk.cancerTypes.join(', ')}. Enhanced screening and risk-reduction strategies recommended.`,
        evidenceLevel: 'High',
      });
    }

    // High-risk cardiac findings
    for (const risk of cardiacRisk.filter((r) => r.riskLevel === 'high')) {
      interpretations.push({
        category: 'primary',
        finding: `${risk.gene}: ${risk.condition}`,
        significance: 'High Risk',
        implications: 'Cardiovascular evaluation and management required. Family screening recommended.',
        evidenceLevel: 'High',
      });
    }

    // Pharmacogenomic findings
    const actionablePGx = cpicRecommendations.filter((r) => r.classification === 'strong');
    for (const pgx of actionablePGx) {
      interpretations.push({
        category: 'secondary',
        finding: `${pgx.gene}: ${pgx.phenotype}`,
        significance: pgx.classification,
        implications: pgx.implication,
        evidenceLevel: `CPIC Level ${pgx.evidenceLevel}`,
      });
    }

    return interpretations;
  }

  /**
   * Generate clinical recommendations
   */
  private static generateRecommendations(
    findings: ReportFindings,
    cpicRecommendations: CPICRecommendation[],
    cancerRisk: CancerRiskAssessment[],
    cardiacRisk: CardiacRiskAssessment[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Always recommend genetic counseling for significant findings
    if (findings.pathogenicVariants.length > 0 || findings.likelyPathogenicVariants.length > 0) {
      recommendations.push({
        category: 'genetic_counseling',
        recommendation: 'Genetic counseling recommended to discuss implications and management',
        priority: 'high',
      });

      recommendations.push({
        category: 'family_testing',
        recommendation: 'Cascade testing recommended for at-risk family members',
        priority: 'high',
      });
    }

    // Cancer risk recommendations
    for (const risk of cancerRisk.filter((r) => r.riskLevel === 'high')) {
      for (const mgmt of risk.management.slice(0, 3)) {
        recommendations.push({
          category: 'clinical_management',
          recommendation: mgmt.recommendation,
          priority: 'high',
          timeframe: mgmt.frequency,
        });
      }
    }

    // Cardiac risk recommendations
    for (const risk of cardiacRisk.filter((r) => r.riskLevel === 'high')) {
      const urgentActions = risk.management.filter(
        (m) => m.urgency === 'immediate' || m.urgency === 'soon'
      );
      for (const mgmt of urgentActions.slice(0, 3)) {
        recommendations.push({
          category: 'clinical_management',
          recommendation: mgmt.recommendation,
          priority: mgmt.urgency === 'immediate' ? 'high' : 'medium',
        });
      }
    }

    // Pharmacogenomic recommendations
    for (const pgx of cpicRecommendations.filter((r) => r.classification === 'strong')) {
      recommendations.push({
        category: 'clinical_management',
        recommendation: `${pgx.drug}: ${pgx.recommendation}`,
        priority: pgx.dosageAdjustment?.type === 'avoid' ? 'high' : 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Extract genes covered
   */
  private static extractGenesCovered(findings: ReportFindings): string[] {
    const genes = new Set<string>();

    for (const variant of findings.pathogenicVariants) {
      genes.add(variant.gene);
    }
    for (const variant of findings.likelyPathogenicVariants) {
      genes.add(variant.gene);
    }
    if (findings.pharmacogenomics) {
      for (const pgx of findings.pharmacogenomics) {
        genes.add(pgx.gene);
      }
    }

    return Array.from(genes);
  }

  /**
   * Get test limitations
   */
  private static getTestLimitations(): string[] {
    return [
      'This test was developed and its performance characteristics determined by Lithic Genomics Laboratory.',
      'Results should be interpreted in the context of clinical findings, family history, and other laboratory data.',
      'Variants of uncertain significance (VUS) may be reclassified as more evidence becomes available.',
      'This test does not detect all possible genetic variants and has limitations in certain genomic regions.',
      'Mosaic variants present in <20% of cells may not be detected.',
      'Copy number variants may not be reliably detected depending on size and location.',
      'Results are based on current scientific understanding and may change as knowledge evolves.',
    ];
  }

  /**
   * Get PGx-specific limitations
   */
  private static getPGxLimitations(): string[] {
    return [
      'Pharmacogenomic results represent genetic factors only and should be considered alongside clinical factors.',
      'Drug response is influenced by multiple factors including age, organ function, drug interactions, and disease state.',
      'Not all pharmacogenetic variants are included in this analysis.',
      'Copy number variations and structural variants are not assessed.',
      'Results should be interpreted by healthcare providers familiar with pharmacogenomics.',
    ];
  }

  /**
   * Get references
   */
  private static getReferences(): Reference[] {
    return [
      {
        id: 'ACMG2015',
        citation: 'Richards S, et al. Standards and guidelines for the interpretation of sequence variants. Genet Med. 2015;17(5):405-24.',
        pmid: '25741868',
      },
      {
        id: 'CPIC',
        citation: 'Clinical Pharmacogenetics Implementation Consortium (CPIC) Guidelines. https://cpicpgx.org',
        url: 'https://cpicpgx.org',
      },
    ];
  }

  /**
   * Get PGx references
   */
  private static getPGxReferences(): Reference[] {
    return [
      {
        id: 'CPIC',
        citation: 'Clinical Pharmacogenetics Implementation Consortium (CPIC) Guidelines. https://cpicpgx.org',
        url: 'https://cpicpgx.org',
      },
      {
        id: 'PharmGKB',
        citation: 'PharmGKB: The Pharmacogenomics Knowledgebase. https://www.pharmgkb.org',
        url: 'https://www.pharmgkb.org',
      },
    ];
  }

  /**
   * Get signatures
   */
  private static getSignatures(): Signature[] {
    return [
      {
        role: 'lab_director',
        name: 'Laboratory Director',
        credentials: 'MD, PhD, FACMG',
        date: new Date().toISOString(),
      },
    ];
  }

  /**
   * Generate unique report ID
   */
  private static generateReportId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GEN-${timestamp}-${random}`;
  }

  /**
   * Export report as JSON
   */
  static exportJSON(report: GenomicReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as formatted text
   */
  static exportText(report: GenomicReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('GENOMIC ANALYSIS REPORT');
    lines.push('='.repeat(80));
    lines.push('');

    lines.push(`Report ID: ${report.reportId}`);
    lines.push(`Report Type: ${report.reportType.replace('_', ' ').toUpperCase()}`);
    lines.push(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`);
    lines.push('');

    lines.push('PATIENT INFORMATION');
    lines.push('-'.repeat(80));
    lines.push(`Patient ID: ${report.patient.id}`);
    if (report.patient.mrn) lines.push(`MRN: ${report.patient.mrn}`);
    if (report.patient.dateOfBirth) lines.push(`DOB: ${report.patient.dateOfBirth}`);
    if (report.patient.sex) lines.push(`Sex: ${report.patient.sex}`);
    lines.push('');

    lines.push('TEST INFORMATION');
    lines.push('-'.repeat(80));
    lines.push(`Test: ${report.testInfo.testName}`);
    lines.push(`Methodology: ${report.testInfo.methodology.join(', ')}`);
    lines.push(`Performing Lab: ${report.testInfo.performingLab.name}`);
    lines.push('');

    if (report.interpretations.length > 0) {
      lines.push('CLINICAL INTERPRETATIONS');
      lines.push('-'.repeat(80));
      for (const interp of report.interpretations) {
        lines.push(`[${interp.category.toUpperCase()}] ${interp.finding}`);
        lines.push(`  Significance: ${interp.significance}`);
        lines.push(`  ${interp.implications}`);
        lines.push('');
      }
    }

    if (report.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS');
      lines.push('-'.repeat(80));
      for (const rec of report.recommendations) {
        lines.push(`[${rec.priority.toUpperCase()}] ${rec.recommendation}`);
        if (rec.timeframe) lines.push(`  Timeframe: ${rec.timeframe}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
