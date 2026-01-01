/**
 * VCF File Parser
 * Parses Variant Call Format (VCF) files for genomic variant analysis
 * Implements VCF 4.2+ specification
 */

export interface VCFHeader {
  fileformat: string;
  reference: string;
  contig: Array<{ id: string; length?: number }>;
  info: Record<string, VCFHeaderField>;
  format: Record<string, VCFHeaderField>;
  filter: Record<string, VCFHeaderField>;
  samples: string[];
  metadata: Record<string, string>;
}

export interface VCFHeaderField {
  id: string;
  number: string;
  type: string;
  description: string;
}

export interface VCFVariant {
  chromosome: string;
  position: number;
  id: string[];
  reference: string;
  alternate: string[];
  quality: number | null;
  filter: string[];
  info: Record<string, any>;
  format: string[];
  samples: Record<string, Record<string, any>>;
  // Computed fields
  variantType: 'SNV' | 'INDEL' | 'CNV' | 'SV' | 'UNKNOWN';
  isMultiAllelic: boolean;
  isPass: boolean;
}

export interface ParsedVCF {
  header: VCFHeader;
  variants: VCFVariant[];
  stats: VCFStats;
}

export interface VCFStats {
  totalVariants: number;
  passVariants: number;
  snvCount: number;
  indelCount: number;
  cnvCount: number;
  svCount: number;
  tiTvRatio: number;
  qualityDistribution: {
    q10: number;
    q20: number;
    q30: number;
    q40: number;
    q50plus: number;
  };
}

export class VCFParser {
  private static readonly VCF_HEADER_PREFIX = '##';
  private static readonly VCF_COLUMN_HEADER = '#CHROM';
  private static readonly REQUIRED_COLUMNS = [
    'CHROM',
    'POS',
    'ID',
    'REF',
    'ALT',
    'QUAL',
    'FILTER',
    'INFO',
  ];

  /**
   * Parse VCF file content
   */
  static parse(content: string): ParsedVCF {
    const lines = content.split('\n').filter((line) => line.trim());
    const header = this.parseHeader(lines);
    const variants = this.parseVariants(lines, header);
    const stats = this.calculateStats(variants);

    return { header, variants, stats };
  }

  /**
   * Parse VCF header lines
   */
  private static parseHeader(lines: string[]): VCFHeader {
    const header: VCFHeader = {
      fileformat: '',
      reference: '',
      contig: [],
      info: {},
      format: {},
      filter: {},
      samples: [],
      metadata: {},
    };

    for (const line of lines) {
      if (!line.startsWith(this.VCF_HEADER_PREFIX)) {
        if (line.startsWith(this.VCF_COLUMN_HEADER)) {
          const columns = line.substring(1).split('\t');
          if (columns.length > 9) {
            header.samples = columns.slice(9);
          }
        }
        break;
      }

      const headerLine = line.substring(2);

      // Parse fileformat
      if (headerLine.startsWith('fileformat=')) {
        header.fileformat = headerLine.split('=')[1];
        continue;
      }

      // Parse reference
      if (headerLine.startsWith('reference=')) {
        header.reference = headerLine.split('=')[1];
        continue;
      }

      // Parse structured fields (INFO, FORMAT, FILTER, contig)
      const structuredMatch = headerLine.match(/^(\w+)=<(.+)>$/);
      if (structuredMatch) {
        const [, type, content] = structuredMatch;
        const fields = this.parseStructuredField(content);

        switch (type) {
          case 'INFO':
            if (fields.ID) header.info[fields.ID] = fields as VCFHeaderField;
            break;
          case 'FORMAT':
            if (fields.ID) header.format[fields.ID] = fields as VCFHeaderField;
            break;
          case 'FILTER':
            if (fields.ID) header.filter[fields.ID] = fields as VCFHeaderField;
            break;
          case 'contig':
            header.contig.push({
              id: fields.ID,
              length: fields.length ? parseInt(fields.length) : undefined,
            });
            break;
          default:
            header.metadata[type] = content;
        }
      } else {
        // Simple key=value metadata
        const [key, ...valueParts] = headerLine.split('=');
        header.metadata[key] = valueParts.join('=');
      }
    }

    return header;
  }

  /**
   * Parse structured field from header
   */
  private static parseStructuredField(content: string): Record<string, string> {
    const fields: Record<string, string> = {};
    let current = '';
    let key = '';
    let inQuotes = false;
    let depth = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === '"' && content[i - 1] !== '\\') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === '<' && !inQuotes) depth++;
      if (char === '>' && !inQuotes) depth--;

      if (char === '=' && !inQuotes && depth === 0 && !key) {
        key = current;
        current = '';
        continue;
      }

      if (char === ',' && !inQuotes && depth === 0) {
        if (key) {
          fields[key] = current;
          key = '';
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (key && current) {
      fields[key] = current;
    }

    return fields;
  }

  /**
   * Parse variant lines
   */
  private static parseVariants(
    lines: string[],
    header: VCFHeader
  ): VCFVariant[] {
    const variants: VCFVariant[] = [];
    let inDataSection = false;

    for (const line of lines) {
      if (line.startsWith(this.VCF_COLUMN_HEADER)) {
        inDataSection = true;
        continue;
      }

      if (!inDataSection || line.startsWith('#')) continue;

      const variant = this.parseVariantLine(line, header);
      if (variant) variants.push(variant);
    }

    return variants;
  }

  /**
   * Parse individual variant line
   */
  private static parseVariantLine(
    line: string,
    header: VCFHeader
  ): VCFVariant | null {
    const columns = line.split('\t');
    if (columns.length < 8) return null;

    const [chrom, pos, id, ref, alt, qual, filter, info, ...rest] = columns;

    const variant: VCFVariant = {
      chromosome: chrom,
      position: parseInt(pos),
      id: id === '.' ? [] : id.split(';'),
      reference: ref,
      alternate: alt.split(','),
      quality: qual === '.' ? null : parseFloat(qual),
      filter: filter === '.' ? [] : filter.split(';'),
      info: this.parseInfo(info, header.info),
      format: [],
      samples: {},
      variantType: this.determineVariantType(ref, alt.split(',')),
      isMultiAllelic: alt.includes(','),
      isPass: filter === 'PASS' || filter === '.',
    };

    // Parse FORMAT and sample data
    if (rest.length > 0 && rest[0]) {
      variant.format = rest[0].split(':');
      for (let i = 1; i < rest.length; i++) {
        const sampleName = header.samples[i - 1] || `SAMPLE_${i}`;
        variant.samples[sampleName] = this.parseSample(
          rest[i],
          variant.format,
          header.format
        );
      }
    }

    return variant;
  }

  /**
   * Parse INFO field
   */
  private static parseInfo(
    info: string,
    infoFields: Record<string, VCFHeaderField>
  ): Record<string, any> {
    const result: Record<string, any> = {};
    if (info === '.') return result;

    const entries = info.split(';');
    for (const entry of entries) {
      const [key, ...valueParts] = entry.split('=');
      const value = valueParts.join('=');

      if (!value) {
        // Flag field
        result[key] = true;
        continue;
      }

      const field = infoFields[key];
      if (!field) {
        result[key] = value;
        continue;
      }

      // Parse based on type and number
      if (field.number === '1') {
        result[key] = this.parseValue(value, field.type);
      } else {
        result[key] = value.split(',').map((v) => this.parseValue(v, field.type));
      }
    }

    return result;
  }

  /**
   * Parse sample data
   */
  private static parseSample(
    sample: string,
    format: string[],
    formatFields: Record<string, VCFHeaderField>
  ): Record<string, any> {
    const result: Record<string, any> = {};
    const values = sample.split(':');

    for (let i = 0; i < format.length; i++) {
      const key = format[i];
      const value = values[i] || '.';

      if (value === '.') {
        result[key] = null;
        continue;
      }

      const field = formatFields[key];
      if (!field) {
        result[key] = value;
        continue;
      }

      if (field.number === '1') {
        result[key] = this.parseValue(value, field.type);
      } else {
        result[key] = value.split(',').map((v) => this.parseValue(v, field.type));
      }
    }

    return result;
  }

  /**
   * Parse value based on type
   */
  private static parseValue(value: string, type: string): any {
    if (value === '.') return null;

    switch (type) {
      case 'Integer':
        return parseInt(value);
      case 'Float':
        return parseFloat(value);
      case 'Flag':
        return true;
      case 'String':
      default:
        return value;
    }
  }

  /**
   * Determine variant type
   */
  private static determineVariantType(
    ref: string,
    alts: string[]
  ): VCFVariant['variantType'] {
    // SNV: single nucleotide variant
    if (ref.length === 1 && alts.every((alt) => alt.length === 1 && alt !== '.')) {
      return 'SNV';
    }

    // INDEL: insertion or deletion
    if (alts.some((alt) => alt.length !== ref.length && !alt.startsWith('<'))) {
      return 'INDEL';
    }

    // Structural variant or CNV
    if (alts.some((alt) => alt.startsWith('<'))) {
      if (alts.some((alt) => alt.includes('CN') || alt.includes('DUP') || alt.includes('DEL'))) {
        return 'CNV';
      }
      return 'SV';
    }

    return 'UNKNOWN';
  }

  /**
   * Calculate VCF statistics
   */
  private static calculateStats(variants: VCFVariant[]): VCFStats {
    const stats: VCFStats = {
      totalVariants: variants.length,
      passVariants: 0,
      snvCount: 0,
      indelCount: 0,
      cnvCount: 0,
      svCount: 0,
      tiTvRatio: 0,
      qualityDistribution: {
        q10: 0,
        q20: 0,
        q30: 0,
        q40: 0,
        q50plus: 0,
      },
    };

    let transitions = 0;
    let transversions = 0;

    for (const variant of variants) {
      // Count by type
      switch (variant.variantType) {
        case 'SNV':
          stats.snvCount++;
          // Calculate Ti/Tv for SNVs
          const tiTv = this.isTransition(variant.reference, variant.alternate[0]);
          if (tiTv === 'transition') transitions++;
          else if (tiTv === 'transversion') transversions++;
          break;
        case 'INDEL':
          stats.indelCount++;
          break;
        case 'CNV':
          stats.cnvCount++;
          break;
        case 'SV':
          stats.svCount++;
          break;
      }

      // Count PASS variants
      if (variant.isPass) stats.passVariants++;

      // Quality distribution
      if (variant.quality !== null) {
        if (variant.quality >= 50) stats.qualityDistribution.q50plus++;
        else if (variant.quality >= 40) stats.qualityDistribution.q40++;
        else if (variant.quality >= 30) stats.qualityDistribution.q30++;
        else if (variant.quality >= 20) stats.qualityDistribution.q20++;
        else if (variant.quality >= 10) stats.qualityDistribution.q10++;
      }
    }

    stats.tiTvRatio = transversions > 0 ? transitions / transversions : 0;

    return stats;
  }

  /**
   * Determine if SNV is transition or transversion
   */
  private static isTransition(
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
   * Extract variants by chromosome region
   */
  static extractRegion(
    variants: VCFVariant[],
    chromosome: string,
    start: number,
    end: number
  ): VCFVariant[] {
    return variants.filter(
      (v) =>
        v.chromosome === chromosome &&
        v.position >= start &&
        v.position <= end
    );
  }

  /**
   * Extract variants by gene (requires position information)
   */
  static extractByGene(
    variants: VCFVariant[],
    geneRegions: Array<{ chromosome: string; start: number; end: number }>
  ): VCFVariant[] {
    const result: VCFVariant[] = [];
    for (const region of geneRegions) {
      result.push(...this.extractRegion(variants, region.chromosome, region.start, region.end));
    }
    return result;
  }
}
