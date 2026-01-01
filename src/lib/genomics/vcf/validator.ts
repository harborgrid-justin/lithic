/**
 * VCF File Validator
 * Validates VCF files for format compliance, data integrity, and quality
 * Implements VCF 4.2+ specification validation
 */

import { VCFVariant, VCFHeader, ParsedVCF } from './parser';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  type: 'format' | 'data' | 'reference' | 'integrity';
  severity: 'critical' | 'error';
  line?: number;
  field?: string;
  message: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'quality' | 'annotation' | 'best_practice';
  line?: number;
  field?: string;
  message: string;
}

export interface ValidationSummary {
  totalVariants: number;
  validVariants: number;
  invalidVariants: number;
  totalErrors: number;
  totalWarnings: number;
  qualityMetrics: QualityMetrics;
}

export interface QualityMetrics {
  averageQuality: number;
  passRate: number;
  tiTvRatio: number;
  homHetRatio: number;
  missingGenotypes: number;
  duplicatePositions: number;
}

export class VCFValidator {
  private static readonly VALID_CHROMOSOMES = new Set([
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', 'X', 'Y', 'MT', 'M',
    'chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10',
    'chr11', 'chr12', 'chr13', 'chr14', 'chr15', 'chr16', 'chr17', 'chr18', 'chr19', 'chr20',
    'chr21', 'chr22', 'chrX', 'chrY', 'chrM', 'chrMT',
  ]);

  private static readonly VALID_BASES = new Set(['A', 'C', 'G', 'T', 'N']);
  private static readonly REQUIRED_HEADER_FIELDS = ['fileformat'];

  /**
   * Validate complete VCF file
   */
  static validate(vcf: ParsedVCF): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate header
    this.validateHeader(vcf.header, errors, warnings);

    // Validate variants
    const variantErrors = this.validateVariants(vcf.variants, vcf.header);
    errors.push(...variantErrors.errors);
    warnings.push(...variantErrors.warnings);

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(vcf.variants);

    // Generate summary
    const summary: ValidationSummary = {
      totalVariants: vcf.variants.length,
      validVariants: vcf.variants.length - errors.filter((e) => e.type === 'data').length,
      invalidVariants: errors.filter((e) => e.type === 'data').length,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      qualityMetrics,
    };

    return {
      isValid: errors.filter((e) => e.severity === 'critical').length === 0,
      errors,
      warnings,
      summary,
    };
  }

  /**
   * Validate VCF header
   */
  private static validateHeader(
    header: VCFHeader,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check required fields
    if (!header.fileformat) {
      errors.push({
        type: 'format',
        severity: 'critical',
        field: 'fileformat',
        message: 'Missing required ##fileformat header line',
        suggestion: 'Add ##fileformat=VCFv4.2 to the beginning of the file',
      });
    } else {
      // Validate fileformat version
      const versionMatch = header.fileformat.match(/VCFv(\d+)\.(\d+)/);
      if (!versionMatch) {
        errors.push({
          type: 'format',
          severity: 'error',
          field: 'fileformat',
          message: `Invalid fileformat: ${header.fileformat}`,
          suggestion: 'Use format: VCFv4.2 or later',
        });
      } else {
        const [, major, minor] = versionMatch;
        if (parseInt(major) < 4 || (parseInt(major) === 4 && parseInt(minor) < 2)) {
          warnings.push({
            type: 'best_practice',
            field: 'fileformat',
            message: `VCF version ${header.fileformat} is outdated. Recommend VCF 4.2+`,
          });
        }
      }
    }

    // Check reference genome
    if (!header.reference) {
      warnings.push({
        type: 'annotation',
        field: 'reference',
        message: 'Missing ##reference header. Recommended to specify reference genome',
      });
    }

    // Validate INFO field definitions
    this.validateHeaderFields(header.info, 'INFO', errors, warnings);

    // Validate FORMAT field definitions
    this.validateHeaderFields(header.format, 'FORMAT', errors, warnings);

    // Validate FILTER field definitions
    this.validateHeaderFields(header.filter, 'FILTER', errors, warnings);

    // Check for samples
    if (header.samples.length === 0) {
      warnings.push({
        type: 'annotation',
        message: 'No sample columns found. This appears to be a sites-only VCF',
      });
    }

    // Validate contig definitions
    if (header.contig.length === 0) {
      warnings.push({
        type: 'best_practice',
        field: 'contig',
        message: 'No ##contig headers found. Recommended for chromosome validation',
      });
    }
  }

  /**
   * Validate header field definitions
   */
  private static validateHeaderFields(
    fields: Record<string, any>,
    fieldType: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [id, field] of Object.entries(fields)) {
      // Check required subfields
      if (!field.Number && !field.number) {
        warnings.push({
          type: 'format',
          field: `${fieldType}.${id}`,
          message: `${fieldType} field '${id}' missing Number specification`,
        });
      }

      if (!field.Type && !field.type) {
        warnings.push({
          type: 'format',
          field: `${fieldType}.${id}`,
          message: `${fieldType} field '${id}' missing Type specification`,
        });
      }

      if (!field.Description && !field.description) {
        warnings.push({
          type: 'best_practice',
          field: `${fieldType}.${id}`,
          message: `${fieldType} field '${id}' missing Description`,
        });
      }

      // Validate Type values
      const type = field.Type || field.type;
      if (type && !['Integer', 'Float', 'Flag', 'Character', 'String'].includes(type)) {
        errors.push({
          type: 'format',
          severity: 'error',
          field: `${fieldType}.${id}`,
          message: `Invalid Type '${type}' for ${fieldType} field '${id}'`,
          suggestion: 'Use: Integer, Float, Flag, Character, or String',
        });
      }
    }
  }

  /**
   * Validate all variants
   */
  private static validateVariants(
    variants: VCFVariant[],
    header: VCFHeader
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const seenPositions = new Map<string, number>();

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const lineNumber = i + 1; // Approximate line number

      // Validate chromosome
      if (!this.VALID_CHROMOSOMES.has(variant.chromosome)) {
        warnings.push({
          type: 'quality',
          line: lineNumber,
          field: 'CHROM',
          message: `Non-standard chromosome: ${variant.chromosome}`,
        });
      }

      // Validate position
      if (variant.position < 1) {
        errors.push({
          type: 'data',
          severity: 'error',
          line: lineNumber,
          field: 'POS',
          message: `Invalid position: ${variant.position}. Must be >= 1`,
        });
      }

      // Check for duplicate positions
      const posKey = `${variant.chromosome}:${variant.position}`;
      if (seenPositions.has(posKey)) {
        warnings.push({
          type: 'quality',
          line: lineNumber,
          field: 'POS',
          message: `Duplicate position: ${posKey} (also at line ${seenPositions.get(posKey)})`,
        });
      } else {
        seenPositions.set(posKey, lineNumber);
      }

      // Validate reference allele
      if (!this.validateAllele(variant.reference)) {
        errors.push({
          type: 'data',
          severity: 'error',
          line: lineNumber,
          field: 'REF',
          message: `Invalid reference allele: ${variant.reference}`,
          suggestion: 'REF must contain only A, C, G, T, N',
        });
      }

      // Validate alternate alleles
      for (const alt of variant.alternate) {
        if (!alt.startsWith('<') && !this.validateAllele(alt)) {
          errors.push({
            type: 'data',
            severity: 'error',
            line: lineNumber,
            field: 'ALT',
            message: `Invalid alternate allele: ${alt}`,
            suggestion: 'ALT must contain only A, C, G, T, N or be a symbolic allele like <DEL>',
          });
        }
      }

      // Validate quality score
      if (variant.quality !== null && (variant.quality < 0 || isNaN(variant.quality))) {
        errors.push({
          type: 'data',
          severity: 'error',
          line: lineNumber,
          field: 'QUAL',
          message: `Invalid quality score: ${variant.quality}`,
        });
      }

      // Check quality thresholds
      if (variant.quality !== null && variant.quality < 20) {
        warnings.push({
          type: 'quality',
          line: lineNumber,
          field: 'QUAL',
          message: `Low quality score: ${variant.quality}`,
        });
      }

      // Validate FILTER
      for (const filter of variant.filter) {
        if (filter !== 'PASS' && filter !== '.' && !header.filter[filter]) {
          warnings.push({
            type: 'annotation',
            line: lineNumber,
            field: 'FILTER',
            message: `Filter '${filter}' not defined in header`,
          });
        }
      }

      // Validate INFO fields
      for (const [key, value] of Object.entries(variant.info)) {
        if (!header.info[key]) {
          warnings.push({
            type: 'annotation',
            line: lineNumber,
            field: `INFO.${key}`,
            message: `INFO field '${key}' not defined in header`,
          });
        }
      }

      // Validate FORMAT and sample data
      if (variant.format.length > 0) {
        for (const formatKey of variant.format) {
          if (!header.format[formatKey]) {
            warnings.push({
              type: 'annotation',
              line: lineNumber,
              field: `FORMAT.${formatKey}`,
              message: `FORMAT field '${formatKey}' not defined in header`,
            });
          }
        }

        // Validate genotype calls
        for (const [sampleName, sampleData] of Object.entries(variant.samples)) {
          if (sampleData.GT) {
            const gtErrors = this.validateGenotype(sampleData.GT, variant.alternate.length);
            if (gtErrors.length > 0) {
              errors.push({
                type: 'data',
                severity: 'error',
                line: lineNumber,
                field: `${sampleName}.GT`,
                message: gtErrors.join(', '),
              });
            }
          }
        }
      }

      // Validate variant type consistency
      if (variant.variantType === 'UNKNOWN' && variant.alternate[0] !== '.') {
        warnings.push({
          type: 'quality',
          line: lineNumber,
          message: `Could not determine variant type for ${variant.reference} > ${variant.alternate.join(',')}`,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate allele sequence
   */
  private static validateAllele(allele: string): boolean {
    if (!allele || allele === '.') return true;

    for (const base of allele.toUpperCase()) {
      if (!this.VALID_BASES.has(base)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate genotype format
   */
  private static validateGenotype(gt: any, numAlts: number): string[] {
    const errors: string[] = [];

    // Convert to string if array
    const gtString = Array.isArray(gt) ? gt.join('/') : String(gt);

    // Split by / or |
    const alleles = gtString.split(/[\/|]/);

    for (const allele of alleles) {
      if (allele === '.') continue; // Missing allele

      const alleleNum = parseInt(allele);
      if (isNaN(alleleNum)) {
        errors.push(`Invalid genotype allele: ${allele}`);
        continue;
      }

      if (alleleNum < 0 || alleleNum > numAlts) {
        errors.push(`Genotype allele ${alleleNum} out of range (0-${numAlts})`);
      }
    }

    return errors;
  }

  /**
   * Calculate quality metrics
   */
  private static calculateQualityMetrics(variants: VCFVariant[]): QualityMetrics {
    let totalQuality = 0;
    let qualityCount = 0;
    let passCount = 0;
    let transitions = 0;
    let transversions = 0;
    let homozygotes = 0;
    let heterozygotes = 0;
    let missingGenotypes = 0;

    const positionMap = new Map<string, number>();

    for (const variant of variants) {
      // Quality
      if (variant.quality !== null) {
        totalQuality += variant.quality;
        qualityCount++;
      }

      // PASS rate
      if (variant.isPass) passCount++;

      // Ti/Tv for SNVs
      if (variant.variantType === 'SNV') {
        const tiTv = this.determineTiTv(variant.reference, variant.alternate[0]);
        if (tiTv === 'transition') transitions++;
        else if (tiTv === 'transversion') transversions++;
      }

      // Hom/Het ratio
      for (const sampleData of Object.values(variant.samples)) {
        if (sampleData.GT) {
          const gt = String(sampleData.GT);
          if (gt === '.' || gt === './.' || gt === '.|.') {
            missingGenotypes++;
          } else {
            const alleles = gt.split(/[\/|]/);
            if (alleles.length === 2) {
              if (alleles[0] === alleles[1]) homozygotes++;
              else heterozygotes++;
            }
          }
        }
      }

      // Duplicate positions
      const posKey = `${variant.chromosome}:${variant.position}`;
      positionMap.set(posKey, (positionMap.get(posKey) || 0) + 1);
    }

    const duplicatePositions = Array.from(positionMap.values()).filter((count) => count > 1).length;

    return {
      averageQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
      passRate: variants.length > 0 ? passCount / variants.length : 0,
      tiTvRatio: transversions > 0 ? transitions / transversions : 0,
      homHetRatio: heterozygotes > 0 ? homozygotes / heterozygotes : 0,
      missingGenotypes,
      duplicatePositions,
    };
  }

  /**
   * Determine if SNV is transition or transversion
   */
  private static determineTiTv(
    ref: string,
    alt: string
  ): 'transition' | 'transversion' | 'other' {
    if (ref.length !== 1 || alt.length !== 1) return 'other';

    const transitions = new Set(['AG', 'GA', 'CT', 'TC']);
    const pair = ref + alt;

    if (transitions.has(pair)) return 'transition';
    if (['A', 'G', 'C', 'T'].includes(ref) && ['A', 'G', 'C', 'T'].includes(alt)) {
      return 'transversion';
    }

    return 'other';
  }

  /**
   * Validate file format before parsing
   */
  static validateFormat(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = content.split('\n');

    if (lines.length === 0) {
      errors.push('File is empty');
      return { isValid: false, errors };
    }

    // Check for fileformat header
    if (!lines[0].startsWith('##fileformat=VCF')) {
      errors.push('File must start with ##fileformat=VCF header');
    }

    // Check for column header
    const hasColumnHeader = lines.some((line) => line.startsWith('#CHROM'));
    if (!hasColumnHeader) {
      errors.push('Missing required #CHROM column header line');
    }

    // Check for data lines
    const hasDataLines = lines.some(
      (line) => !line.startsWith('#') && line.trim().length > 0
    );
    if (!hasDataLines) {
      errors.push('No variant data lines found');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate validation report
   */
  static generateReport(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('=== VCF Validation Report ===\n');
    lines.push(`Status: ${result.isValid ? 'VALID' : 'INVALID'}\n`);

    // Summary
    lines.push('Summary:');
    lines.push(`  Total Variants: ${result.summary.totalVariants}`);
    lines.push(`  Valid Variants: ${result.summary.validVariants}`);
    lines.push(`  Invalid Variants: ${result.summary.invalidVariants}`);
    lines.push(`  Errors: ${result.summary.totalErrors}`);
    lines.push(`  Warnings: ${result.summary.totalWarnings}\n`);

    // Quality Metrics
    lines.push('Quality Metrics:');
    lines.push(`  Average Quality: ${result.summary.qualityMetrics.averageQuality.toFixed(2)}`);
    lines.push(`  PASS Rate: ${(result.summary.qualityMetrics.passRate * 100).toFixed(2)}%`);
    lines.push(`  Ti/Tv Ratio: ${result.summary.qualityMetrics.tiTvRatio.toFixed(3)}`);
    lines.push(`  Hom/Het Ratio: ${result.summary.qualityMetrics.homHetRatio.toFixed(3)}`);
    lines.push(`  Missing Genotypes: ${result.summary.qualityMetrics.missingGenotypes}`);
    lines.push(`  Duplicate Positions: ${result.summary.qualityMetrics.duplicatePositions}\n`);

    // Errors
    if (result.errors.length > 0) {
      lines.push('Errors:');
      for (const error of result.errors.slice(0, 50)) {
        const location = error.line ? `Line ${error.line}` : 'Header';
        const field = error.field ? ` [${error.field}]` : '';
        lines.push(`  ${error.severity.toUpperCase()}: ${location}${field} - ${error.message}`);
        if (error.suggestion) {
          lines.push(`    Suggestion: ${error.suggestion}`);
        }
      }
      if (result.errors.length > 50) {
        lines.push(`  ... and ${result.errors.length - 50} more errors`);
      }
      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('Warnings:');
      for (const warning of result.warnings.slice(0, 30)) {
        const location = warning.line ? `Line ${warning.line}` : 'Header';
        const field = warning.field ? ` [${field}]` : '';
        lines.push(`  ${location}${field} - ${warning.message}`);
      }
      if (result.warnings.length > 30) {
        lines.push(`  ... and ${result.warnings.length - 30} more warnings`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
