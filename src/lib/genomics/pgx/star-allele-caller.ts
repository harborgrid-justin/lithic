/**
 * Star Allele Caller
 * Determines star (*) alleles for pharmacogenes based on variant genotypes
 * Implements PharmGKB and PharmVar standards
 */

import { VCFVariant } from '../vcf/parser';

export interface StarAlleleCall {
  gene: string;
  diplotype: string;
  allele1: string;
  allele2: string;
  metabolizerStatus: MetabolizerStatus;
  activityScore: number;
  confidence: 'high' | 'medium' | 'low';
  variants: StarAlleleVariant[];
  phenotype: string;
  clinicalImplications: string[];
}

export type MetabolizerStatus =
  | 'ultrarapid'
  | 'rapid'
  | 'normal'
  | 'intermediate'
  | 'poor'
  | 'indeterminate';

export interface StarAlleleVariant {
  position: number;
  chromosome: string;
  reference: string;
  alternate: string;
  genotype: string;
  rsid?: string;
  impact: string;
}

export interface StarAlleleDefinition {
  gene: string;
  allele: string;
  activity: number;
  variants: Array<{
    position: number;
    chromosome: string;
    reference: string;
    alternate: string;
    rsid?: string;
    impact: string;
  }>;
  notes?: string;
}

export interface DiplotypeActivity {
  diplotype: string;
  activityScore: number;
  metabolizerStatus: MetabolizerStatus;
  phenotype: string;
}

export class StarAlleleCaller {
  private static readonly STAR_ALLELE_DEFINITIONS: Record<string, StarAlleleDefinition[]> = {
    CYP2D6: [
      {
        gene: 'CYP2D6',
        allele: '*1',
        activity: 1.0,
        variants: [],
        notes: 'Reference/wild-type allele with normal function',
      },
      {
        gene: 'CYP2D6',
        allele: '*2',
        activity: 1.0,
        variants: [
          {
            position: 42522613,
            chromosome: '22',
            reference: 'C',
            alternate: 'T',
            rsid: 'rs16947',
            impact: 'synonymous',
          },
        ],
        notes: 'Normal function allele',
      },
      {
        gene: 'CYP2D6',
        allele: '*3',
        activity: 0.0,
        variants: [
          {
            position: 42522506,
            chromosome: '22',
            reference: 'TGAGGCAGCGGGGCCA',
            alternate: 'T',
            rsid: 'rs35742686',
            impact: 'frameshift',
          },
        ],
        notes: 'No function - frameshift',
      },
      {
        gene: 'CYP2D6',
        allele: '*4',
        activity: 0.0,
        variants: [
          {
            position: 42528242,
            chromosome: '22',
            reference: 'G',
            alternate: 'A',
            rsid: 'rs3892097',
            impact: 'splice_defect',
          },
        ],
        notes: 'No function - splicing defect',
      },
      {
        gene: 'CYP2D6',
        allele: '*5',
        activity: 0.0,
        variants: [],
        notes: 'No function - whole gene deletion',
      },
      {
        gene: 'CYP2D6',
        allele: '*10',
        activity: 0.25,
        variants: [
          {
            position: 42522613,
            chromosome: '22',
            reference: 'C',
            alternate: 'T',
            rsid: 'rs1065852',
            impact: 'missense',
          },
        ],
        notes: 'Decreased function',
      },
      {
        gene: 'CYP2D6',
        allele: '*17',
        activity: 0.5,
        variants: [
          {
            position: 42522613,
            chromosome: '22',
            reference: 'C',
            alternate: 'T',
            rsid: 'rs28371706',
            impact: 'missense',
          },
        ],
        notes: 'Decreased function',
      },
      {
        gene: 'CYP2D6',
        allele: '*41',
        activity: 0.5,
        variants: [
          {
            position: 42528242,
            chromosome: '22',
            reference: 'G',
            alternate: 'A',
            rsid: 'rs28371725',
            impact: 'splice_region',
          },
        ],
        notes: 'Decreased function',
      },
    ],
    CYP2C19: [
      {
        gene: 'CYP2C19',
        allele: '*1',
        activity: 1.0,
        variants: [],
        notes: 'Reference allele with normal function',
      },
      {
        gene: 'CYP2C19',
        allele: '*2',
        activity: 0.0,
        variants: [
          {
            position: 94762706,
            chromosome: '10',
            reference: 'G',
            alternate: 'A',
            rsid: 'rs4244285',
            impact: 'splice_defect',
          },
        ],
        notes: 'No function - splicing defect',
      },
      {
        gene: 'CYP2C19',
        allele: '*3',
        activity: 0.0,
        variants: [
          {
            position: 94762712,
            chromosome: '10',
            reference: 'G',
            alternate: 'A',
            rsid: 'rs4986893',
            impact: 'stop_gained',
          },
        ],
        notes: 'No function - premature stop codon',
      },
      {
        gene: 'CYP2C19',
        allele: '*17',
        activity: 1.5,
        variants: [
          {
            position: 94761900,
            chromosome: '10',
            reference: 'C',
            alternate: 'T',
            rsid: 'rs12248560',
            impact: 'promoter',
          },
        ],
        notes: 'Increased function - increased transcription',
      },
    ],
    TPMT: [
      {
        gene: 'TPMT',
        allele: '*1',
        activity: 1.0,
        variants: [],
        notes: 'Reference allele with normal function',
      },
      {
        gene: 'TPMT',
        allele: '*2',
        activity: 0.0,
        variants: [
          {
            position: 18139228,
            chromosome: '6',
            reference: 'G',
            alternate: 'C',
            rsid: 'rs1800462',
            impact: 'missense',
          },
        ],
        notes: 'No function',
      },
      {
        gene: 'TPMT',
        allele: '*3A',
        activity: 0.0,
        variants: [
          {
            position: 18139228,
            chromosome: '6',
            reference: 'G',
            alternate: 'A',
            rsid: 'rs1800460',
            impact: 'missense',
          },
          {
            position: 18143724,
            chromosome: '6',
            reference: 'A',
            alternate: 'G',
            rsid: 'rs1142345',
            impact: 'missense',
          },
        ],
        notes: 'No function - compound variant',
      },
      {
        gene: 'TPMT',
        allele: '*3B',
        activity: 0.0,
        variants: [
          {
            position: 18139228,
            chromosome: '6',
            reference: 'G',
            alternate: 'A',
            rsid: 'rs1800460',
            impact: 'missense',
          },
        ],
        notes: 'No function',
      },
      {
        gene: 'TPMT',
        allele: '*3C',
        activity: 0.0,
        variants: [
          {
            position: 18143724,
            chromosome: '6',
            reference: 'A',
            alternate: 'G',
            rsid: 'rs1142345',
            impact: 'missense',
          },
        ],
        notes: 'No function',
      },
    ],
    SLCO1B1: [
      {
        gene: 'SLCO1B1',
        allele: '*1A',
        activity: 1.0,
        variants: [],
        notes: 'Reference allele - normal function',
      },
      {
        gene: 'SLCO1B1',
        allele: '*5',
        activity: 0.5,
        variants: [
          {
            position: 21176879,
            chromosome: '12',
            reference: 'T',
            alternate: 'C',
            rsid: 'rs4149056',
            impact: 'missense',
          },
        ],
        notes: 'Decreased function',
      },
      {
        gene: 'SLCO1B1',
        allele: '*15',
        activity: 0.3,
        variants: [
          {
            position: 21176804,
            chromosome: '12',
            reference: 'T',
            alternate: 'C',
            rsid: 'rs2306283',
            impact: 'missense',
          },
          {
            position: 21176879,
            chromosome: '12',
            reference: 'T',
            alternate: 'C',
            rsid: 'rs4149056',
            impact: 'missense',
          },
        ],
        notes: 'Decreased function',
      },
    ],
  };

  /**
   * Call star alleles for a gene from VCF variants
   */
  static callStarAllele(gene: string, variants: VCFVariant[], sampleName: string): StarAlleleCall | null {
    const geneDefinitions = this.STAR_ALLELE_DEFINITIONS[gene];
    if (!geneDefinitions) {
      console.warn(`No star allele definitions found for gene: ${gene}`);
      return null;
    }

    // Extract relevant variants for this gene
    const geneVariants = this.extractGeneVariants(variants, gene, sampleName);

    // Call alleles for each haplotype
    const allele1 = this.determineAllele(geneDefinitions, geneVariants, 0);
    const allele2 = this.determineAllele(geneDefinitions, geneVariants, 1);

    const diplotype = this.formatDiplotype(allele1.allele, allele2.allele);
    const activityScore = allele1.activity + allele2.activity;
    const metabolizerStatus = this.determineMetabolizerStatus(gene, activityScore);
    const phenotype = this.determinePhenotype(gene, metabolizerStatus);

    return {
      gene,
      diplotype,
      allele1: allele1.allele,
      allele2: allele2.allele,
      metabolizerStatus,
      activityScore,
      confidence: this.determineConfidence(allele1, allele2),
      variants: geneVariants,
      phenotype,
      clinicalImplications: this.getClinicalImplications(gene, metabolizerStatus),
    };
  }

  /**
   * Extract variants for a specific gene
   */
  private static extractGeneVariants(
    variants: VCFVariant[],
    gene: string,
    sampleName: string
  ): StarAlleleVariant[] {
    const geneVariants: StarAlleleVariant[] = [];
    const geneDefinitions = this.STAR_ALLELE_DEFINITIONS[gene];

    // Get all positions for this gene
    const genePositions = new Set<number>();
    for (const def of geneDefinitions) {
      for (const variant of def.variants) {
        genePositions.add(variant.position);
      }
    }

    // Extract matching variants
    for (const variant of variants) {
      if (genePositions.has(variant.position)) {
        const sample = variant.samples[sampleName];
        if (sample?.GT) {
          geneVariants.push({
            position: variant.position,
            chromosome: variant.chromosome,
            reference: variant.reference,
            alternate: variant.alternate.join(','),
            genotype: String(sample.GT),
            rsid: variant.id[0] || undefined,
            impact: 'unknown',
          });
        }
      }
    }

    return geneVariants;
  }

  /**
   * Determine allele for a haplotype
   */
  private static determineAllele(
    definitions: StarAlleleDefinition[],
    variants: StarAlleleVariant[],
    haplotype: 0 | 1
  ): { allele: string; activity: number } {
    // Sort definitions by number of variants (most specific first)
    const sortedDefs = [...definitions].sort((a, b) => b.variants.length - a.variants.length);

    for (const def of sortedDefs) {
      if (def.variants.length === 0) continue; // Skip reference allele initially

      let allMatch = true;
      for (const defVariant of def.variants) {
        const foundVariant = variants.find((v) => v.position === defVariant.position);

        if (!foundVariant) {
          allMatch = false;
          break;
        }

        // Check if haplotype matches
        const genotype = foundVariant.genotype.split(/[/|]/);
        const allele = genotype[haplotype];

        if (allele === '0') {
          // Reference allele
          allMatch = false;
          break;
        } else if (allele !== '1') {
          // Should be alternate allele
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        return { allele: def.allele, activity: def.activity };
      }
    }

    // Default to reference allele (*1)
    const refAllele = definitions.find((d) => d.allele === '*1' || d.variants.length === 0);
    return { allele: refAllele?.allele || '*1', activity: refAllele?.activity || 1.0 };
  }

  /**
   * Format diplotype string
   */
  private static formatDiplotype(allele1: string, allele2: string): string {
    // Sort alleles numerically for consistent formatting
    const num1 = parseInt(allele1.replace('*', '')) || 0;
    const num2 = parseInt(allele2.replace('*', '')) || 0;

    if (num1 <= num2) {
      return `${allele1}/${allele2}`;
    } else {
      return `${allele2}/${allele1}`;
    }
  }

  /**
   * Determine metabolizer status from activity score
   */
  private static determineMetabolizerStatus(
    gene: string,
    activityScore: number
  ): MetabolizerStatus {
    // Gene-specific thresholds based on CPIC/PharmGKB guidelines
    const thresholds: Record<string, { poor: number; intermediate: number; rapid: number }> = {
      CYP2D6: { poor: 0.5, intermediate: 1.5, rapid: 2.5 },
      CYP2C19: { poor: 0.5, intermediate: 1.5, rapid: 2.0 },
      CYP2C9: { poor: 0.5, intermediate: 1.5, rapid: 2.0 },
      TPMT: { poor: 0.5, intermediate: 1.5, rapid: 2.0 },
      SLCO1B1: { poor: 0.5, intermediate: 1.5, rapid: 2.0 },
    };

    const threshold = thresholds[gene] || { poor: 0.5, intermediate: 1.5, rapid: 2.5 };

    if (activityScore === 0) return 'poor';
    if (activityScore < threshold.poor) return 'poor';
    if (activityScore < threshold.intermediate) return 'intermediate';
    if (activityScore >= threshold.rapid) return gene.startsWith('CYP') ? 'ultrarapid' : 'rapid';

    return 'normal';
  }

  /**
   * Determine phenotype description
   */
  private static determinePhenotype(gene: string, status: MetabolizerStatus): string {
    const phenotypes: Record<string, Record<MetabolizerStatus, string>> = {
      CYP2D6: {
        ultrarapid: 'Ultrarapid metabolizer',
        rapid: 'Rapid metabolizer',
        normal: 'Normal metabolizer',
        intermediate: 'Intermediate metabolizer',
        poor: 'Poor metabolizer',
        indeterminate: 'Indeterminate metabolizer',
      },
      CYP2C19: {
        ultrarapid: 'Ultrarapid metabolizer',
        rapid: 'Rapid metabolizer',
        normal: 'Normal metabolizer',
        intermediate: 'Intermediate metabolizer',
        poor: 'Poor metabolizer',
        indeterminate: 'Indeterminate metabolizer',
      },
      TPMT: {
        ultrarapid: 'Normal activity',
        rapid: 'Normal activity',
        normal: 'Normal activity',
        intermediate: 'Intermediate activity',
        poor: 'Low or deficient activity',
        indeterminate: 'Indeterminate activity',
      },
      SLCO1B1: {
        ultrarapid: 'Normal function',
        rapid: 'Normal function',
        normal: 'Normal function',
        intermediate: 'Decreased function',
        poor: 'Poor function',
        indeterminate: 'Indeterminate function',
      },
    };

    return phenotypes[gene]?.[status] || `${status} metabolizer`;
  }

  /**
   * Determine confidence level
   */
  private static determineConfidence(
    allele1: { allele: string; activity: number },
    allele2: { allele: string; activity: number }
  ): 'high' | 'medium' | 'low' {
    // High confidence if both alleles are clearly defined
    if (allele1.allele !== '*1' || allele2.allele !== '*1') {
      return 'high';
    }

    // Medium confidence for reference alleles
    return 'medium';
  }

  /**
   * Get clinical implications for metabolizer status
   */
  private static getClinicalImplications(gene: string, status: MetabolizerStatus): string[] {
    const implications: Record<string, Record<MetabolizerStatus, string[]>> = {
      CYP2D6: {
        ultrarapid: [
          'May require higher doses of CYP2D6 substrates (e.g., codeine, tramadol)',
          'Increased risk of toxicity with prodrugs converted by CYP2D6',
          'Consider alternative medications or therapeutic drug monitoring',
        ],
        rapid: [
          'May metabolize some drugs faster than normal',
          'May require dose adjustments for some medications',
        ],
        normal: ['Standard dosing for most medications'],
        intermediate: [
          'May require dose adjustments for some CYP2D6 substrates',
          'Consider therapeutic drug monitoring for narrow therapeutic index drugs',
        ],
        poor: [
          'Significantly reduced metabolism of CYP2D6 substrates',
          'Increased risk of adverse effects with standard doses',
          'Consider dose reduction (25-50%) or alternative medications',
          'Avoid prodrugs that require CYP2D6 activation (e.g., codeine)',
        ],
        indeterminate: ['Unable to determine metabolizer status - consider genetic counseling'],
      },
      CYP2C19: {
        ultrarapid: [
          'Increased metabolism of CYP2C19 substrates',
          'May require higher doses of some antidepressants and PPIs',
          'Consider alternative antiplatelet therapy to clopidogrel',
        ],
        rapid: [
          'Faster metabolism of some medications',
          'May require dose adjustments',
        ],
        normal: ['Standard dosing for most medications'],
        intermediate: [
          'Reduced metabolism of CYP2C19 substrates',
          'Consider dose reduction for some medications',
        ],
        poor: [
          'Significantly reduced CYP2C19 activity',
          'Increased exposure to CYP2C19 substrates',
          'Consider dose reduction or alternative medications',
          'Alternative antiplatelet therapy recommended over clopidogrel',
        ],
        indeterminate: ['Unable to determine metabolizer status'],
      },
      TPMT: {
        ultrarapid: ['Standard dosing of thiopurines'],
        rapid: ['Standard dosing of thiopurines'],
        normal: ['Standard dosing of thiopurines (e.g., azathioprine, mercaptopurine)'],
        intermediate: [
          'Reduced TPMT activity',
          'Increase risk of myelosuppression with standard thiopurine doses',
          'Reduce thiopurine dose by 30-70%',
          'Monitor blood counts closely',
        ],
        poor: [
          'Very low or absent TPMT activity',
          'High risk of severe myelosuppression with standard doses',
          'Reduce thiopurine dose by 90% or consider alternative medications',
          'Frequent blood count monitoring required',
        ],
        indeterminate: ['Unable to determine TPMT activity - consider phenotyping'],
      },
      SLCO1B1: {
        ultrarapid: ['Standard statin dosing'],
        rapid: ['Standard statin dosing'],
        normal: ['Standard statin dosing'],
        intermediate: [
          'Decreased SLCO1B1 function',
          'Increased risk of statin-induced myopathy',
          'Consider lower simvastatin dose (≤20mg) or alternative statin',
        ],
        poor: [
          'Poor SLCO1B1 function',
          'Significantly increased risk of myopathy with simvastatin',
          'Avoid high-dose simvastatin (>20mg)',
          'Consider alternative statin (pravastatin, rosuvastatin)',
        ],
        indeterminate: ['Unable to determine SLCO1B1 function'],
      },
    };

    return implications[gene]?.[status] || ['No specific guidance available'];
  }

  /**
   * Call star alleles for all pharmacogenes
   */
  static callAllGenes(variants: VCFVariant[], sampleName: string): StarAlleleCall[] {
    const results: StarAlleleCall[] = [];

    for (const gene of Object.keys(this.STAR_ALLELE_DEFINITIONS)) {
      const call = this.callStarAllele(gene, variants, sampleName);
      if (call) {
        results.push(call);
      }
    }

    return results;
  }

  /**
   * Get supported genes
   */
  static getSupportedGenes(): string[] {
    return Object.keys(this.STAR_ALLELE_DEFINITIONS);
  }

  /**
   * Get allele definitions for a gene
   */
  static getAlleleDefinitions(gene: string): StarAlleleDefinition[] {
    return this.STAR_ALLELE_DEFINITIONS[gene] || [];
  }
}
