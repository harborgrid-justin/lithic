/**
 * Patient-Friendly Genomic Summary
 * Generates easy-to-understand summaries of genomic findings
 * Focuses on actionable information and next steps
 */

import { GenomicReport } from './report-generator';
import { StarAlleleCall } from '../pgx/star-allele-caller';
import { CPICRecommendation } from '../pgx/cpic-engine';
import { PolygenicRiskScore } from '../risk/polygenic-risk';

export interface PatientSummary {
  patientId: string;
  generatedDate: string;
  keyFindings: KeyFinding[];
  actionItems: ActionItem[];
  medications: MedicationGuidance[];
  lifestyleRecommendations: string[];
  nextSteps: string[];
  glossary: GlossaryTerm[];
  resources: ResourceLink[];
}

export interface KeyFinding {
  title: string;
  category: 'genetics' | 'pharmacogenomics' | 'risk' | 'health';
  summary: string;
  whatThisMeans: string;
  importance: 'high' | 'medium' | 'low';
  icon?: string;
}

export interface ActionItem {
  action: string;
  reason: string;
  priority: 'urgent' | 'soon' | 'routine';
  timeframe?: string;
  whoToContact?: string;
}

export interface MedicationGuidance {
  medication: string;
  gene: string;
  yourGenotype: string;
  recommendation: string;
  alternative?: string[];
  importance: 'critical' | 'important' | 'informational';
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export interface ResourceLink {
  title: string;
  description: string;
  url: string;
  category: 'education' | 'support' | 'professional';
}

export class PatientSummaryGenerator {
  /**
   * Generate patient-friendly summary from genomic report
   */
  static generateSummary(
    report: GenomicReport,
    cpicRecommendations: CPICRecommendation[],
    polygenicRisk: PolygenicRiskScore[]
  ): PatientSummary {
    const keyFindings = this.extractKeyFindings(report, polygenicRisk);
    const actionItems = this.generateActionItems(report, cpicRecommendations);
    const medications = this.generateMedicationGuidance(cpicRecommendations);
    const lifestyleRecommendations = this.generateLifestyleRecommendations(report, polygenicRisk);
    const nextSteps = this.generateNextSteps(report);

    return {
      patientId: report.patient.id,
      generatedDate: new Date().toISOString(),
      keyFindings,
      actionItems,
      medications,
      lifestyleRecommendations,
      nextSteps,
      glossary: this.getGlossary(),
      resources: this.getResources(),
    };
  }

  /**
   * Extract key findings in patient-friendly language
   */
  private static extractKeyFindings(
    report: GenomicReport,
    polygenicRisk: PolygenicRiskScore[]
  ): KeyFinding[] {
    const findings: KeyFinding[] = [];

    // Pharmacogenomics findings
    if (report.findings.pharmacogenomics && report.findings.pharmacogenomics.length > 0) {
      const actionableGenes = report.findings.pharmacogenomics.filter(
        (pgx) => pgx.metabolizerStatus !== 'normal'
      );

      if (actionableGenes.length > 0) {
        findings.push({
          title: 'Medication Processing Variations',
          category: 'pharmacogenomics',
          summary: `Your body may process ${actionableGenes.length} type(s) of medications differently than most people.`,
          whatThisMeans: `Certain medications may need dose adjustments or alternatives based on your genetic makeup. This can help prevent side effects and ensure medications work effectively for you.`,
          importance: 'high',
          icon: 'pill',
        });
      }
    }

    // High-risk cancer findings
    const highRiskCancer = report.findings.cancerRisk?.filter((r) => r.riskLevel === 'high') || [];
    if (highRiskCancer.length > 0) {
      const cancerTypes = new Set<string>();
      for (const risk of highRiskCancer) {
        risk.cancerTypes.forEach((type) => cancerTypes.add(type));
      }

      findings.push({
        title: 'Hereditary Cancer Risk',
        category: 'risk',
        summary: `You have an increased genetic risk for ${Array.from(cancerTypes).join(', ')}.`,
        whatThisMeans: `This doesn't mean you will definitely develop cancer, but your risk is higher than the general population. Early detection through enhanced screening can significantly improve outcomes.`,
        importance: 'high',
        icon: 'alert-circle',
      });
    }

    // High-risk cardiac findings
    const highRiskCardiac = report.findings.cardiacRisk?.filter((r) => r.riskLevel === 'high') || [];
    if (highRiskCardiac.length > 0) {
      const conditions = highRiskCardiac.map((r) => r.condition);

      findings.push({
        title: 'Inherited Heart Condition Risk',
        category: 'risk',
        summary: `Your genetic results suggest a risk for ${conditions.join(', ')}.`,
        whatThisMeans: `Regular heart monitoring and preventive care can help manage this condition effectively. Many people with these genetic variants live healthy lives with proper medical care.`,
        importance: 'high',
        icon: 'heart',
      });
    }

    // Polygenic risk scores
    const highRiskPRS = polygenicRisk.filter(
      (prs) => prs.riskCategory === 'high' || prs.riskCategory === 'very_high'
    );

    for (const prs of highRiskPRS.slice(0, 2)) {
      findings.push({
        title: `${prs.condition} Risk`,
        category: 'risk',
        summary: `Your genetic risk for ${prs.condition} is in the ${prs.percentile.toFixed(0)}th percentile.`,
        whatThisMeans: `You have a higher genetic predisposition than ${prs.percentile.toFixed(0)}% of the population. However, lifestyle and environmental factors also play important roles in disease development.`,
        importance: 'medium',
        icon: 'trending-up',
      });
    }

    // Pathogenic variants
    if (report.findings.pathogenicVariants.length > 0) {
      findings.push({
        title: 'Significant Genetic Variants Identified',
        category: 'genetics',
        summary: `${report.findings.pathogenicVariants.length} significant genetic variant(s) were found that may impact your health.`,
        whatThisMeans: `These genetic changes are associated with specific health conditions. Meeting with a genetic counselor can help you understand what this means for you and your family.`,
        importance: 'high',
        icon: 'dna',
      });
    }

    return findings;
  }

  /**
   * Generate actionable items for patients
   */
  private static generateActionItems(
    report: GenomicReport,
    cpicRecommendations: CPICRecommendation[]
  ): ActionItem[] {
    const actions: ActionItem[] = [];

    // Genetic counseling for significant findings
    if (
      report.findings.pathogenicVariants.length > 0 ||
      report.findings.likelyPathogenicVariants.length > 0 ||
      (report.findings.cancerRisk?.some((r) => r.riskLevel === 'high')) ||
      (report.findings.cardiacRisk?.some((r) => r.riskLevel === 'high'))
    ) {
      actions.push({
        action: 'Schedule genetic counseling appointment',
        reason: 'To discuss your results, what they mean for you and your family, and develop a personalized health plan',
        priority: 'soon',
        timeframe: 'Within 2-4 weeks',
        whoToContact: 'Your healthcare provider or our genetic counseling team',
      });
    }

    // Medication reviews for PGx
    const criticalPGx = cpicRecommendations.filter(
      (r) => r.dosageAdjustment?.type === 'avoid' || r.classification === 'strong'
    );

    if (criticalPGx.length > 0) {
      actions.push({
        action: 'Review your current medications with your doctor or pharmacist',
        reason: 'Some of your medications may need dose adjustments or alternatives based on your genetic profile',
        priority: 'soon',
        timeframe: 'At your next appointment',
        whoToContact: 'Your primary care physician or pharmacist',
      });
    }

    // Cancer screening for high-risk individuals
    const highRiskCancer = report.findings.cancerRisk?.filter((r) => r.riskLevel === 'high') || [];
    if (highRiskCancer.length > 0) {
      actions.push({
        action: 'Discuss enhanced cancer screening options',
        reason: 'Earlier and more frequent screening can detect cancer at treatable stages',
        priority: 'soon',
        timeframe: 'Within 1-2 months',
        whoToContact: 'Your primary care physician or oncologist',
      });
    }

    // Cardiac evaluation
    const highRiskCardiac = report.findings.cardiacRisk?.filter((r) => r.riskLevel === 'high') || [];
    if (highRiskCardiac.length > 0) {
      const needsUrgent = highRiskCardiac.some((r) =>
        r.management.some((m) => m.urgency === 'immediate')
      );

      actions.push({
        action: 'Schedule cardiovascular evaluation',
        reason: 'Heart monitoring and preventive care can help manage your inherited heart condition risk',
        priority: needsUrgent ? 'urgent' : 'soon',
        timeframe: needsUrgent ? 'This week' : 'Within 1 month',
        whoToContact: 'Cardiologist or your primary care physician',
      });
    }

    // Family member testing
    if (actions.length > 0) {
      actions.push({
        action: 'Inform close family members about your genetic results',
        reason: 'Some genetic conditions run in families. Your results may be relevant for blood relatives',
        priority: 'routine',
        timeframe: 'When you feel comfortable',
        whoToContact: 'Genetic counselor can help with family communication',
      });
    }

    return actions;
  }

  /**
   * Generate medication-specific guidance
   */
  private static generateMedicationGuidance(
    cpicRecommendations: CPICRecommendation[]
  ): MedicationGuidance[] {
    return cpicRecommendations.map((rec) => ({
      medication: rec.drug,
      gene: rec.gene,
      yourGenotype: rec.phenotype,
      recommendation: this.simplifyRecommendation(rec.recommendation),
      alternative: rec.alternatives,
      importance:
        rec.dosageAdjustment?.type === 'avoid'
          ? 'critical'
          : rec.classification === 'strong'
          ? 'important'
          : 'informational',
    }));
  }

  /**
   * Simplify recommendation for patient understanding
   */
  private static simplifyRecommendation(recommendation: string): string {
    // Remove technical jargon and make more patient-friendly
    return recommendation
      .replace(/per label/gi, 'as normally prescribed')
      .replace(/consider/gi, 'you may want to discuss')
      .replace(/prescribe/gi, 'use');
  }

  /**
   * Generate lifestyle recommendations
   */
  private static generateLifestyleRecommendations(
    report: GenomicReport,
    polygenicRisk: PolygenicRiskScore[]
  ): string[] {
    const recommendations = new Set<string>();

    // High-risk polygenic conditions
    const highRiskPRS = polygenicRisk.filter(
      (prs) => prs.riskCategory === 'high' || prs.riskCategory === 'very_high'
    );

    for (const prs of highRiskPRS) {
      for (const rec of prs.recommendations.slice(0, 3)) {
        recommendations.add(rec);
      }
    }

    // General wellness
    if (recommendations.size === 0) {
      recommendations.add('Maintain a balanced, nutritious diet');
      recommendations.add('Engage in regular physical activity (at least 150 minutes per week)');
      recommendations.add('Avoid smoking and limit alcohol consumption');
      recommendations.add('Get adequate sleep (7-9 hours per night)');
      recommendations.add('Manage stress through mindfulness or relaxation techniques');
    }

    return Array.from(recommendations);
  }

  /**
   * Generate next steps
   */
  private static generateNextSteps(report: GenomicReport): string[] {
    const steps: string[] = [];

    steps.push('Share this report with your healthcare provider');
    steps.push('Keep a copy of your results for your medical records');

    if (
      report.findings.pathogenicVariants.length > 0 ||
      report.findings.likelyPathogenicVariants.length > 0
    ) {
      steps.push('Schedule an appointment to discuss these results with a healthcare professional');
      steps.push('Consider genetic counseling to understand implications for you and your family');
    }

    if (report.findings.pharmacogenomics && report.findings.pharmacogenomics.length > 0) {
      steps.push(
        'Inform your doctor and pharmacist about your pharmacogenomic results before starting new medications'
      );
      steps.push('Keep a wallet card or digital record of your medication-related genetic variants');
    }

    steps.push('Review this summary with family members if appropriate');
    steps.push(
      'Stay informed about new research - genetic knowledge is constantly evolving'
    );

    return steps;
  }

  /**
   * Get glossary of genetic terms
   */
  private static getGlossary(): GlossaryTerm[] {
    return [
      {
        term: 'Gene',
        definition:
          'A section of DNA that contains instructions for making proteins, which do most of the work in your cells.',
        example: 'The BRCA1 gene provides instructions for making a protein that helps prevent cancer.',
      },
      {
        term: 'Variant',
        definition:
          'A difference in your DNA sequence compared to a reference sequence. Some variants affect health, while others are normal variations.',
      },
      {
        term: 'Pathogenic',
        definition:
          'A genetic variant known to cause or strongly contribute to disease.',
      },
      {
        term: 'Pharmacogenomics',
        definition:
          'The study of how your genes affect the way you respond to medications.',
      },
      {
        term: 'Metabolizer Status',
        definition:
          'How fast or slow your body breaks down certain medications, which can affect how well they work and whether you experience side effects.',
        example:
          'A "poor metabolizer" processes certain drugs slowly, which may require a lower dose.',
      },
      {
        term: 'Polygenic Risk Score',
        definition:
          'A number that represents your genetic risk for a disease based on many genetic variants.',
      },
      {
        term: 'Penetrance',
        definition:
          'The likelihood that a genetic variant will actually cause disease. High penetrance means the variant usually causes disease.',
      },
      {
        term: 'Heterozygous',
        definition:
          'Having one copy of a variant (inherited from one parent). Most people are heterozygous for many variants.',
      },
      {
        term: 'Homozygous',
        definition:
          'Having two copies of a variant (one from each parent). This can increase the effect of the variant.',
      },
      {
        term: 'VUS (Variant of Uncertain Significance)',
        definition:
          "A genetic change whose impact on health isn't yet known. More research is needed to determine if it's harmful.",
      },
    ];
  }

  /**
   * Get educational resources
   */
  private static getResources(): ResourceLink[] {
    return [
      {
        title: 'National Human Genome Research Institute',
        description: 'Educational resources about genetics and genomics',
        url: 'https://www.genome.gov',
        category: 'education',
      },
      {
        title: 'Genetics Home Reference',
        description: 'Consumer-friendly information about genetic conditions',
        url: 'https://medlineplus.gov/genetics/',
        category: 'education',
      },
      {
        title: 'National Society of Genetic Counselors',
        description: 'Find a genetic counselor near you',
        url: 'https://www.nsgc.org',
        category: 'professional',
      },
      {
        title: 'CPIC (Clinical Pharmacogenetics Implementation Consortium)',
        description: 'Guidelines for using genetic information in medication decisions',
        url: 'https://cpicpgx.org',
        category: 'education',
      },
      {
        title: 'Facing Our Risk of Cancer Empowered (FORCE)',
        description: 'Support and resources for hereditary cancer',
        url: 'https://www.facingourrisk.org',
        category: 'support',
      },
    ];
  }

  /**
   * Export summary as HTML
   */
  static exportHTML(summary: PatientSummary): string {
    const html: string[] = [];

    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>Your Genomic Results Summary</title>');
    html.push('<style>');
    html.push('body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }');
    html.push('h1, h2 { color: #2c3e50; }');
    html.push('.finding { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #3498db; }');
    html.push('.high-importance { border-left-color: #e74c3c; }');
    html.push('.action-item { background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px; }');
    html.push('.urgent { background: #f8d7da; }');
    html.push('</style>');
    html.push('</head>');
    html.push('<body>');

    html.push('<h1>Your Genomic Results Summary</h1>');
    html.push(`<p><em>Generated: ${new Date(summary.generatedDate).toLocaleDateString()}</em></p>`);

    html.push('<h2>Key Findings</h2>');
    for (const finding of summary.keyFindings) {
      const importanceClass = finding.importance === 'high' ? 'high-importance' : '';
      html.push(`<div class="finding ${importanceClass}">`);
      html.push(`<h3>${finding.title}</h3>`);
      html.push(`<p><strong>${finding.summary}</strong></p>`);
      html.push(`<p>${finding.whatThisMeans}</p>`);
      html.push('</div>');
    }

    html.push('<h2>What You Should Do</h2>');
    for (const action of summary.actionItems) {
      const urgentClass = action.priority === 'urgent' ? 'urgent' : '';
      html.push(`<div class="action-item ${urgentClass}">`);
      html.push(`<h3>${action.action}</h3>`);
      html.push(`<p>${action.reason}</p>`);
      if (action.timeframe) html.push(`<p><strong>Timeframe:</strong> ${action.timeframe}</p>`);
      if (action.whoToContact) html.push(`<p><strong>Who to contact:</strong> ${action.whoToContact}</p>`);
      html.push('</div>');
    }

    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  /**
   * Export summary as plain text
   */
  static exportText(summary: PatientSummary): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('YOUR GENOMIC RESULTS SUMMARY');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Generated: ${new Date(summary.generatedDate).toLocaleDateString()}`);
    lines.push('');

    lines.push('KEY FINDINGS');
    lines.push('-'.repeat(60));
    for (const finding of summary.keyFindings) {
      lines.push(`\n${finding.title.toUpperCase()}`);
      lines.push(finding.summary);
      lines.push(`What this means: ${finding.whatThisMeans}`);
    }
    lines.push('');

    lines.push('WHAT YOU SHOULD DO');
    lines.push('-'.repeat(60));
    for (const action of summary.actionItems) {
      lines.push(`\n[${action.priority.toUpperCase()}] ${action.action}`);
      lines.push(`Why: ${action.reason}`);
      if (action.timeframe) lines.push(`When: ${action.timeframe}`);
      if (action.whoToContact) lines.push(`Contact: ${action.whoToContact}`);
    }
    lines.push('');

    if (summary.medications.length > 0) {
      lines.push('MEDICATION GUIDANCE');
      lines.push('-'.repeat(60));
      for (const med of summary.medications) {
        lines.push(`\n${med.medication} (${med.gene})`);
        lines.push(`Your genotype: ${med.yourGenotype}`);
        lines.push(`Recommendation: ${med.recommendation}`);
      }
      lines.push('');
    }

    lines.push('LIFESTYLE RECOMMENDATIONS');
    lines.push('-'.repeat(60));
    for (const rec of summary.lifestyleRecommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');

    lines.push('NEXT STEPS');
    lines.push('-'.repeat(60));
    for (let i = 0; i < summary.nextSteps.length; i++) {
      lines.push(`${i + 1}. ${summary.nextSteps[i]}`);
    }

    return lines.join('\n');
  }
}
