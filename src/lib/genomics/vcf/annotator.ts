/**
 * VCF Variant Annotator
 * Annotates variants with clinical significance, population frequency, and functional impact
 * Integrates with ClinVar, gnomAD, and ACMG classification
 */

import { VCFVariant } from './parser';

export interface VariantAnnotation {
  variantId: string;
  clinicalSignificance?: ClinicalSignificance;
  populationFrequency?: PopulationFrequency;
  functionalImpact?: FunctionalImpact;
  acmgClassification?: ACMGClassification;
  geneContext?: GeneContext;
  transcript?: TranscriptAnnotation[];
  externalIds?: ExternalIds;
  predictions?: InSilicoPredictions;
}

export interface ClinicalSignificance {
  clinvarId?: string;
  significance: 'pathogenic' | 'likely_pathogenic' | 'uncertain_significance' | 'likely_benign' | 'benign' | 'conflicting' | 'not_provided';
  reviewStatus: string;
  conditions: string[];
  submitters: number;
  lastEvaluated?: string;
  stars: number; // 0-4 star rating
}

export interface PopulationFrequency {
  gnomadExome?: FrequencyData;
  gnomadGenome?: FrequencyData;
  topmed?: FrequencyData;
  thousandGenomes?: FrequencyData;
  maxPopulationFrequency: number;
}

export interface FrequencyData {
  alleleFrequency: number;
  alleleCount: number;
  alleleNumber: number;
  homozygoteCount: number;
  populations: Record<string, number>; // population-specific frequencies
}

export interface FunctionalImpact {
  consequence: string; // SO term
  impact: 'high' | 'moderate' | 'low' | 'modifier';
  proteinChange?: string;
  cdnaChange?: string;
  exonNumber?: string;
  intronNumber?: string;
}

export interface ACMGClassification {
  classification: 'pathogenic' | 'likely_pathogenic' | 'uncertain_significance' | 'likely_benign' | 'benign';
  criteria: {
    pathogenic: string[]; // PVS1, PS1, etc.
    benign: string[]; // BA1, BS1, etc.
    supporting: string[]; // PP1, BP1, etc.
  };
  score: number;
  autoClassified: boolean;
}

export interface GeneContext {
  geneSymbol: string;
  geneId: string; // HGNC or Ensembl ID
  transcriptCount: number;
  omimId?: string;
  diseaseAssociation?: string[];
  inheritance?: string[];
  phenotypes?: string[];
}

export interface TranscriptAnnotation {
  transcriptId: string;
  isCanonical: boolean;
  biotype: string;
  consequence: string[];
  hgvsc?: string; // cDNA nomenclature
  hgvsp?: string; // Protein nomenclature
  aminoAcids?: string; // ref/alt
  codons?: string;
  proteinPosition?: number;
  sift?: { score: number; prediction: string };
  polyphen?: { score: number; prediction: string };
}

export interface ExternalIds {
  dbsnp?: string;
  cosmic?: string;
  clinvar?: string;
  hgmd?: string;
  omim?: string;
}

export interface InSilicoPredictions {
  cadd?: { phred: number; raw: number };
  revel?: number;
  gerp?: number;
  phylop?: number;
  phastcons?: number;
  spliceai?: {
    acceptorGain: number;
    acceptorLoss: number;
    donorGain: number;
    donorLoss: number;
    maxScore: number;
  };
}

export class VariantAnnotator {
  private clinvarCache: Map<string, ClinicalSignificance> = new Map();
  private gnomadCache: Map<string, PopulationFrequency> = new Map();

  /**
   * Annotate a single variant
   */
  async annotate(variant: VCFVariant): Promise<VariantAnnotation> {
    const variantId = this.buildVariantId(variant);

    const [
      clinicalSignificance,
      populationFrequency,
      functionalImpact,
      geneContext,
      predictions,
    ] = await Promise.all([
      this.annotateClinVar(variant),
      this.annotatePopulationFrequency(variant),
      this.annotateFunctionalImpact(variant),
      this.annotateGeneContext(variant),
      this.annotateInSilicoPredictions(variant),
    ]);

    const acmgClassification = this.classifyACMG(
      variant,
      clinicalSignificance,
      populationFrequency,
      functionalImpact,
      predictions
    );

    return {
      variantId,
      clinicalSignificance,
      populationFrequency,
      functionalImpact,
      acmgClassification,
      geneContext,
      externalIds: this.extractExternalIds(variant),
      predictions,
    };
  }

  /**
   * Annotate multiple variants in batch
   */
  async annotateBatch(variants: VCFVariant[]): Promise<VariantAnnotation[]> {
    // Process in batches of 100 to avoid overwhelming external APIs
    const batchSize = 100;
    const results: VariantAnnotation[] = [];

    for (let i = 0; i < variants.length; i += batchSize) {
      const batch = variants.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((variant) => this.annotate(variant))
      );
      results.push(...batchResults);

      // Rate limiting - wait 100ms between batches
      if (i + batchSize < variants.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Build standardized variant ID
   */
  private buildVariantId(variant: VCFVariant): string {
    return `${variant.chromosome}-${variant.position}-${variant.reference}-${variant.alternate.join(',')}`;
  }

  /**
   * Annotate with ClinVar data
   */
  private async annotateClinVar(
    variant: VCFVariant
  ): Promise<ClinicalSignificance | undefined> {
    const variantId = this.buildVariantId(variant);

    // Check cache
    if (this.clinvarCache.has(variantId)) {
      return this.clinvarCache.get(variantId);
    }

    // Check if variant already has ClinVar annotation in INFO field
    if (variant.info.CLNSIG || variant.info.CLNDN) {
      const significance = this.parseClinVarInfo(variant.info);
      this.clinvarCache.set(variantId, significance);
      return significance;
    }

    // Query ClinVar API (in production, use actual API)
    try {
      const significance = await this.queryClinVarAPI(variant);
      if (significance) {
        this.clinvarCache.set(variantId, significance);
      }
      return significance;
    } catch (error) {
      console.error('ClinVar annotation error:', error);
      return undefined;
    }
  }

  /**
   * Parse ClinVar info from VCF INFO field
   */
  private parseClinVarInfo(info: Record<string, any>): ClinicalSignificance {
    const significanceMap: Record<number, ClinicalSignificance['significance']> = {
      0: 'uncertain_significance',
      1: 'not_provided',
      2: 'benign',
      3: 'likely_benign',
      4: 'likely_pathogenic',
      5: 'pathogenic',
      6: 'conflicting',
    };

    const clnsig = Array.isArray(info.CLNSIG) ? info.CLNSIG[0] : info.CLNSIG;
    const significance = significanceMap[parseInt(clnsig)] || 'uncertain_significance';

    return {
      clinvarId: info.CLNVC || undefined,
      significance,
      reviewStatus: info.CLNREVSTAT || 'no_assertion',
      conditions: info.CLNDN ? info.CLNDN.split('|') : [],
      submitters: parseInt(info.CLNSUBMITTERS || '0'),
      lastEvaluated: info.CLNHGVS || undefined,
      stars: this.calculateClinVarStars(info.CLNREVSTAT),
    };
  }

  /**
   * Calculate ClinVar star rating based on review status
   */
  private calculateClinVarStars(reviewStatus: string): number {
    const status = String(reviewStatus || '').toLowerCase();
    if (status.includes('practice_guideline')) return 4;
    if (status.includes('reviewed_by_expert_panel')) return 3;
    if (status.includes('multiple_submitters')) return 2;
    if (status.includes('single_submitter')) return 1;
    return 0;
  }

  /**
   * Query ClinVar API (placeholder for actual API integration)
   */
  private async queryClinVarAPI(
    variant: VCFVariant
  ): Promise<ClinicalSignificance | undefined> {
    // In production, integrate with ClinVar E-utilities API
    // https://www.ncbi.nlm.nih.gov/clinvar/docs/help/

    // This is a placeholder that would make actual API calls
    // For now, return undefined to indicate no ClinVar annotation
    return undefined;
  }

  /**
   * Annotate with population frequency data
   */
  private async annotatePopulationFrequency(
    variant: VCFVariant
  ): Promise<PopulationFrequency | undefined> {
    const variantId = this.buildVariantId(variant);

    // Check cache
    if (this.gnomadCache.has(variantId)) {
      return this.gnomadCache.get(variantId);
    }

    // Parse from INFO field if available
    if (variant.info.AF || variant.info.gnomAD_AF) {
      const frequency = this.parseFrequencyInfo(variant.info);
      this.gnomadCache.set(variantId, frequency);
      return frequency;
    }

    // Query gnomAD API (in production)
    try {
      const frequency = await this.queryGnomADAPI(variant);
      if (frequency) {
        this.gnomadCache.set(variantId, frequency);
      }
      return frequency;
    } catch (error) {
      console.error('gnomAD annotation error:', error);
      return undefined;
    }
  }

  /**
   * Parse frequency data from INFO field
   */
  private parseFrequencyInfo(info: Record<string, any>): PopulationFrequency {
    const af = parseFloat(info.AF || info.gnomAD_AF || '0');
    const ac = parseInt(info.AC || info.gnomAD_AC || '0');
    const an = parseInt(info.AN || info.gnomAD_AN || '0');

    const frequencyData: FrequencyData = {
      alleleFrequency: af,
      alleleCount: ac,
      alleleNumber: an,
      homozygoteCount: parseInt(info.nhomalt || info.gnomAD_nhomalt || '0'),
      populations: {},
    };

    // Parse population-specific frequencies
    const popPrefixes = ['AFR', 'AMR', 'EAS', 'FIN', 'NFE', 'SAS', 'ASJ', 'OTH'];
    for (const pop of popPrefixes) {
      const popAF = info[`AF_${pop}`] || info[`gnomAD_AF_${pop}`];
      if (popAF !== undefined) {
        frequencyData.populations[pop] = parseFloat(popAF);
      }
    }

    return {
      gnomadExome: frequencyData,
      maxPopulationFrequency: Math.max(af, ...Object.values(frequencyData.populations)),
    };
  }

  /**
   * Query gnomAD API (placeholder)
   */
  private async queryGnomADAPI(
    variant: VCFVariant
  ): Promise<PopulationFrequency | undefined> {
    // In production, integrate with gnomAD GraphQL API
    // https://gnomad.broadinstitute.org/api
    return undefined;
  }

  /**
   * Annotate functional impact
   */
  private async annotateFunctionalImpact(
    variant: VCFVariant
  ): Promise<FunctionalImpact | undefined> {
    // Parse from INFO field (VEP, SnpEff annotations)
    const csq = variant.info.CSQ || variant.info.ANN;
    if (!csq) return undefined;

    // Parse consequence annotation
    const consequences = Array.isArray(csq) ? csq : [csq];
    const primaryConsequence = this.parsePrimaryConsequence(consequences[0]);

    return primaryConsequence;
  }

  /**
   * Parse primary consequence from annotation
   */
  private parsePrimaryConsequence(annotation: string): FunctionalImpact {
    // VEP format: consequence|gene|transcript|protein_change|...
    const fields = annotation.split('|');

    const consequence = fields[0] || 'unknown';
    const impact = this.determineImpact(consequence);

    return {
      consequence,
      impact,
      proteinChange: fields[3] || undefined,
      cdnaChange: fields[4] || undefined,
      exonNumber: fields[5] || undefined,
      intronNumber: fields[6] || undefined,
    };
  }

  /**
   * Determine variant impact based on consequence
   */
  private determineImpact(consequence: string): FunctionalImpact['impact'] {
    const high = [
      'transcript_ablation',
      'splice_acceptor_variant',
      'splice_donor_variant',
      'stop_gained',
      'frameshift_variant',
      'stop_lost',
      'start_lost',
    ];

    const moderate = [
      'inframe_insertion',
      'inframe_deletion',
      'missense_variant',
      'protein_altering_variant',
    ];

    const low = [
      'splice_region_variant',
      'incomplete_terminal_codon_variant',
      'start_retained_variant',
      'stop_retained_variant',
      'synonymous_variant',
    ];

    const consLower = consequence.toLowerCase();

    if (high.some((h) => consLower.includes(h))) return 'high';
    if (moderate.some((m) => consLower.includes(m))) return 'moderate';
    if (low.some((l) => consLower.includes(l))) return 'low';

    return 'modifier';
  }

  /**
   * Annotate gene context
   */
  private async annotateGeneContext(
    variant: VCFVariant
  ): Promise<GeneContext | undefined> {
    // Parse gene information from INFO field
    const geneSymbol = variant.info.GENEINFO || variant.info.SYMBOL;
    if (!geneSymbol) return undefined;

    return {
      geneSymbol: String(geneSymbol).split(':')[0],
      geneId: variant.info.GENE_ID || 'unknown',
      transcriptCount: 1,
      diseaseAssociation: [],
      inheritance: [],
      phenotypes: [],
    };
  }

  /**
   * Annotate with in silico predictions
   */
  private async annotateInSilicoPredictions(
    variant: VCFVariant
  ): Promise<InSilicoPredictions | undefined> {
    const predictions: InSilicoPredictions = {};

    if (variant.info.CADD_PHRED || variant.info.CADD_RAW) {
      predictions.cadd = {
        phred: parseFloat(variant.info.CADD_PHRED || '0'),
        raw: parseFloat(variant.info.CADD_RAW || '0'),
      };
    }

    if (variant.info.REVEL) {
      predictions.revel = parseFloat(variant.info.REVEL);
    }

    if (variant.info.GERP) {
      predictions.gerp = parseFloat(variant.info.GERP);
    }

    return Object.keys(predictions).length > 0 ? predictions : undefined;
  }

  /**
   * ACMG/AMP variant classification
   */
  private classifyACMG(
    variant: VCFVariant,
    clinvar?: ClinicalSignificance,
    popFreq?: PopulationFrequency,
    funcImpact?: FunctionalImpact,
    predictions?: InSilicoPredictions
  ): ACMGClassification {
    const criteria = {
      pathogenic: [] as string[],
      benign: [] as string[],
      supporting: [] as string[],
    };

    // BA1: Allele frequency > 5% in any population
    if (popFreq && popFreq.maxPopulationFrequency > 0.05) {
      criteria.benign.push('BA1');
    }

    // BS1: Allele frequency > 1%
    if (popFreq && popFreq.maxPopulationFrequency > 0.01) {
      criteria.benign.push('BS1');
    }

    // PVS1: Null variant (nonsense, frameshift) in gene where LOF is pathogenic
    if (funcImpact?.impact === 'high') {
      const lofConsequences = ['stop_gained', 'frameshift_variant', 'splice_acceptor_variant', 'splice_donor_variant'];
      if (lofConsequences.some((c) => funcImpact.consequence.includes(c))) {
        criteria.pathogenic.push('PVS1');
      }
    }

    // PS1: Same amino acid change as established pathogenic variant
    if (clinvar?.significance === 'pathogenic' || clinvar?.significance === 'likely_pathogenic') {
      criteria.pathogenic.push('PS1');
    }

    // PM2: Absent or extremely rare in population databases
    if (!popFreq || popFreq.maxPopulationFrequency < 0.0001) {
      criteria.supporting.push('PM2');
    }

    // PP3: Multiple lines of computational evidence support deleterious effect
    if (predictions?.cadd && predictions.cadd.phred > 20) {
      criteria.supporting.push('PP3');
    }

    // BP4: Multiple lines of computational evidence support benign effect
    if (predictions?.cadd && predictions.cadd.phred < 10) {
      criteria.supporting.push('BP4');
    }

    // Calculate final classification
    const classification = this.determineACMGClassification(criteria);
    const score = this.calculateACMGScore(criteria);

    return {
      classification,
      criteria,
      score,
      autoClassified: true,
    };
  }

  /**
   * Determine ACMG classification from criteria
   */
  private determineACMGClassification(criteria: {
    pathogenic: string[];
    benign: string[];
    supporting: string[];
  }): ACMGClassification['classification'] {
    const hasVeryStrong = criteria.pathogenic.some((c) => c.startsWith('PVS'));
    const hasStrong = criteria.pathogenic.some((c) => c.startsWith('PS'));
    const hasModerate = criteria.supporting.some((c) => c.startsWith('PM'));
    const hasSupporting = criteria.supporting.some((c) => c.startsWith('PP'));

    const hasBenignStrong = criteria.benign.some((c) => c.startsWith('BS') || c.startsWith('BA'));

    // Pathogenic rules
    if (hasVeryStrong && (hasStrong || criteria.supporting.filter((c) => c.startsWith('PM')).length >= 2)) {
      return 'pathogenic';
    }

    // Likely pathogenic rules
    if ((hasStrong && hasModerate) || (hasStrong && hasSupporting)) {
      return 'likely_pathogenic';
    }

    // Benign rules
    if (criteria.benign.some((c) => c === 'BA1')) {
      return 'benign';
    }

    if (hasBenignStrong && criteria.benign.length >= 2) {
      return 'benign';
    }

    // Likely benign rules
    if (hasBenignStrong) {
      return 'likely_benign';
    }

    return 'uncertain_significance';
  }

  /**
   * Calculate ACMG score
   */
  private calculateACMGScore(criteria: {
    pathogenic: string[];
    benign: string[];
    supporting: string[];
  }): number {
    let score = 0;

    // Pathogenic criteria (positive scores)
    score += criteria.pathogenic.filter((c) => c.startsWith('PVS')).length * 8;
    score += criteria.pathogenic.filter((c) => c.startsWith('PS')).length * 4;
    score += criteria.supporting.filter((c) => c.startsWith('PM')).length * 2;
    score += criteria.supporting.filter((c) => c.startsWith('PP')).length * 1;

    // Benign criteria (negative scores)
    score -= criteria.benign.filter((c) => c === 'BA1').length * 8;
    score -= criteria.benign.filter((c) => c.startsWith('BS')).length * 4;
    score -= criteria.supporting.filter((c) => c.startsWith('BP')).length * 1;

    return score;
  }

  /**
   * Extract external database IDs
   */
  private extractExternalIds(variant: VCFVariant): ExternalIds {
    const ids: ExternalIds = {};

    // dbSNP ID
    if (variant.id.length > 0 && variant.id[0].startsWith('rs')) {
      ids.dbsnp = variant.id[0];
    }

    // COSMIC ID
    if (variant.info.COSMIC) {
      ids.cosmic = String(variant.info.COSMIC);
    }

    // ClinVar ID
    if (variant.info.CLNVC) {
      ids.clinvar = String(variant.info.CLNVC);
    }

    return ids;
  }

  /**
   * Filter variants by clinical significance
   */
  static filterByClinicalSignificance(
    annotations: VariantAnnotation[],
    significance: ClinicalSignificance['significance'][]
  ): VariantAnnotation[] {
    return annotations.filter(
      (a) => a.clinicalSignificance && significance.includes(a.clinicalSignificance.significance)
    );
  }

  /**
   * Filter variants by ACMG classification
   */
  static filterByACMG(
    annotations: VariantAnnotation[],
    classifications: ACMGClassification['classification'][]
  ): VariantAnnotation[] {
    return annotations.filter(
      (a) => a.acmgClassification && classifications.includes(a.acmgClassification.classification)
    );
  }

  /**
   * Filter rare variants (MAF < threshold)
   */
  static filterRareVariants(
    annotations: VariantAnnotation[],
    mafThreshold: number = 0.01
  ): VariantAnnotation[] {
    return annotations.filter(
      (a) => !a.populationFrequency || a.populationFrequency.maxPopulationFrequency < mafThreshold
    );
  }
}
