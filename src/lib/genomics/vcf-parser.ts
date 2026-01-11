/**
 * VCF (Variant Call Format) File Parser
 * Parses VCF 4.2 format files for genetic variant data
 */

import type {
  VCFFile,
  VCFMetadata,
  VCFHeader,
  VCFVariant,
  VCFContig,
  VCFFilter,
  VCFInfo,
  VCFFormat,
} from "@/types/genomics";

/**
 * Parse VCF file content
 */
export function parseVCF(vcfContent: string): VCFFile {
  const lines = vcfContent.split("\n").filter((line) => line.trim());

  const metadata: VCFMetadata = {
    reference: "",
    source: "",
    fileDate: "",
    contigs: [],
    filters: [],
    info: [],
    format: [],
  };

  let header: VCFHeader | null = null;
  const variants: VCFVariant[] = [];

  for (const line of lines) {
    if (line.startsWith("##")) {
      // Parse metadata lines
      parseMetadataLine(line, metadata);
    } else if (line.startsWith("#CHROM")) {
      // Parse header line
      header = parseHeaderLine(line);
    } else if (header) {
      // Parse variant line
      const variant = parseVariantLine(line, header);
      if (variant) {
        variants.push(variant);
      }
    }
  }

  if (!header) {
    throw new Error("Invalid VCF file: missing header line");
  }

  return {
    fileVersion: "VCFv4.2",
    metadata,
    header,
    variants,
  };
}

/**
 * Parse metadata line (starts with ##)
 */
function parseMetadataLine(line: string, metadata: VCFMetadata): void {
  if (line.startsWith("##fileformat=")) {
    // Already handled in main function
  } else if (line.startsWith("##fileDate=")) {
    metadata.fileDate = line.substring("##fileDate=".length);
  } else if (line.startsWith("##source=")) {
    metadata.source = line.substring("##source=".length);
  } else if (line.startsWith("##reference=")) {
    metadata.reference = line.substring("##reference=".length);
  } else if (line.startsWith("##contig=")) {
    const contig = parseContigLine(line);
    if (contig) {
      metadata.contigs.push(contig);
    }
  } else if (line.startsWith("##FILTER=")) {
    const filter = parseFilterLine(line);
    if (filter) {
      metadata.filters.push(filter);
    }
  } else if (line.startsWith("##INFO=")) {
    const info = parseInfoLine(line);
    if (info) {
      metadata.info.push(info);
    }
  } else if (line.startsWith("##FORMAT=")) {
    const format = parseFormatLine(line);
    if (format) {
      metadata.format.push(format);
    }
  }
}

/**
 * Parse contig metadata line
 */
function parseContigLine(line: string): VCFContig | null {
  const match = line.match(/##contig=<ID=([^,>]+)(?:,length=(\d+))?/);
  if (match) {
    return {
      id: match[1],
      length: match[2] ? parseInt(match[2], 10) : null,
      assembly: null,
    };
  }
  return null;
}

/**
 * Parse filter metadata line
 */
function parseFilterLine(line: string): VCFFilter | null {
  const match = line.match(/##FILTER=<ID=([^,>]+),Description="([^"]+)"/);
  if (match) {
    return {
      id: match[1],
      description: match[2],
    };
  }
  return null;
}

/**
 * Parse info metadata line
 */
function parseInfoLine(line: string): VCFInfo | null {
  const match = line.match(
    /##INFO=<ID=([^,>]+),Number=([^,>]+),Type=([^,>]+),Description="([^"]+)"/
  );
  if (match) {
    return {
      id: match[1],
      number: match[2],
      type: match[3],
      description: match[4],
    };
  }
  return null;
}

/**
 * Parse format metadata line
 */
function parseFormatLine(line: string): VCFFormat | null {
  const match = line.match(
    /##FORMAT=<ID=([^,>]+),Number=([^,>]+),Type=([^,>]+),Description="([^"]+)"/
  );
  if (match) {
    return {
      id: match[1],
      number: match[2],
      type: match[3],
      description: match[4],
    };
  }
  return null;
}

/**
 * Parse header line (#CHROM ...)
 */
function parseHeaderLine(line: string): VCFHeader {
  const columns = line.substring(1).split("\t");

  return {
    chrom: columns[0] || "CHROM",
    pos: columns[1] || "POS",
    id: columns[2] || "ID",
    ref: columns[3] || "REF",
    alt: columns[4] || "ALT",
    qual: columns[5] || "QUAL",
    filter: columns[6] || "FILTER",
    info: columns[7] || "INFO",
    format: columns[8] || "FORMAT",
    samples: columns.slice(9),
  };
}

/**
 * Parse variant data line
 */
function parseVariantLine(line: string, header: VCFHeader): VCFVariant | null {
  const columns = line.split("\t");

  if (columns.length < 8) {
    return null;
  }

  const chrom = columns[0];
  const pos = parseInt(columns[1], 10);
  const id = columns[2].split(";").filter((i) => i !== ".");
  const ref = columns[3];
  const alt = columns[4].split(",");
  const qual = columns[5] !== "." ? parseFloat(columns[5]) : null;
  const filter = columns[6].split(";");
  const info = parseInfoField(columns[7]);
  const format = columns[8] ? columns[8].split(":") : [];

  const samples: Record<string, Record<string, any>> = {};
  for (let i = 9; i < columns.length; i++) {
    const sampleName = header.samples[i - 9];
    if (sampleName) {
      samples[sampleName] = parseSampleData(columns[i], format);
    }
  }

  return {
    chrom,
    pos,
    id,
    ref,
    alt,
    qual,
    filter,
    info,
    format,
    samples,
  };
}

/**
 * Parse INFO field
 */
function parseInfoField(infoString: string): Record<string, any> {
  const info: Record<string, any> = {};

  if (infoString === ".") {
    return info;
  }

  const pairs = infoString.split(";");

  for (const pair of pairs) {
    if (pair.includes("=")) {
      const [key, value] = pair.split("=", 2);
      info[key] = parseInfoValue(value);
    } else {
      // Flag
      info[pair] = true;
    }
  }

  return info;
}

/**
 * Parse INFO field value
 */
function parseInfoValue(value: string): any {
  if (value.includes(",")) {
    return value.split(",").map((v) => {
      const num = parseFloat(v);
      return isNaN(num) ? v : num;
    });
  }

  const num = parseFloat(value);
  return isNaN(num) ? value : num;
}

/**
 * Parse sample data field
 */
function parseSampleData(
  sampleString: string,
  format: string[]
): Record<string, any> {
  const sampleData: Record<string, any> = {};

  if (sampleString === ".") {
    return sampleData;
  }

  const values = sampleString.split(":");

  for (let i = 0; i < format.length && i < values.length; i++) {
    const key = format[i];
    const value = values[i];

    if (value !== ".") {
      sampleData[key] = parseSampleValue(value);
    }
  }

  return sampleData;
}

/**
 * Parse sample field value
 */
function parseSampleValue(value: string): any {
  if (value.includes(",")) {
    return value.split(",").map((v) => {
      const num = parseFloat(v);
      return isNaN(num) ? v : num;
    });
  }

  const num = parseFloat(value);
  return isNaN(num) ? value : num;
}

/**
 * Convert VCF variant to HGVS notation
 */
export function toHGVS(variant: VCFVariant, referenceGenome: string = "GRCh38"): {
  genomic: string;
  coding: string | null;
  protein: string | null;
} {
  const chr = variant.chrom.replace("chr", "");
  let genomic = "";

  // Determine reference sequence ID based on chromosome
  const refSeqId = getRefSeqId(chr, referenceGenome);

  if (variant.ref.length === 1 && variant.alt[0].length === 1) {
    // SNV
    genomic = `${refSeqId}:g.${variant.pos}${variant.ref}>${variant.alt[0]}`;
  } else if (variant.ref.length < variant.alt[0].length) {
    // Insertion
    const insSeq = variant.alt[0].substring(variant.ref.length);
    genomic = `${refSeqId}:g.${variant.pos}_${variant.pos + 1}ins${insSeq}`;
  } else if (variant.ref.length > variant.alt[0].length) {
    // Deletion
    const delLength = variant.ref.length - variant.alt[0].length;
    genomic = `${refSeqId}:g.${variant.pos + 1}_${variant.pos + delLength}del`;
  } else {
    // Complex
    genomic = `${refSeqId}:g.${variant.pos}${variant.ref}>${variant.alt[0]}`;
  }

  return {
    genomic,
    coding: null, // Would need transcript information
    protein: null, // Would need protein information
  };
}

/**
 * Get reference sequence ID for chromosome
 */
function getRefSeqId(chromosome: string, referenceGenome: string): string {
  // GRCh38 reference sequences
  const grch38Map: Record<string, string> = {
    "1": "NC_000001.11",
    "2": "NC_000002.12",
    "3": "NC_000003.12",
    "4": "NC_000004.12",
    "5": "NC_000005.10",
    "6": "NC_000006.12",
    "7": "NC_000007.14",
    "8": "NC_000008.11",
    "9": "NC_000009.12",
    "10": "NC_000010.11",
    "11": "NC_000011.10",
    "12": "NC_000012.12",
    "13": "NC_000013.11",
    "14": "NC_000014.9",
    "15": "NC_000015.10",
    "16": "NC_000016.10",
    "17": "NC_000017.11",
    "18": "NC_000018.10",
    "19": "NC_000019.10",
    "20": "NC_000020.11",
    "21": "NC_000021.9",
    "22": "NC_000022.11",
    X: "NC_000023.11",
    Y: "NC_000024.10",
    MT: "NC_012920.1",
  };

  return grch38Map[chromosome] || `NC_${chromosome}`;
}

/**
 * Filter variants by quality metrics
 */
export function filterVariantsByQuality(
  variants: VCFVariant[],
  minQuality: number = 30,
  minDepth: number = 10
): VCFVariant[] {
  return variants.filter((variant) => {
    if (variant.qual !== null && variant.qual < minQuality) {
      return false;
    }

    if (variant.info.DP !== undefined && variant.info.DP < minDepth) {
      return false;
    }

    if (variant.filter.includes("FAIL")) {
      return false;
    }

    return true;
  });
}

/**
 * Extract variant annotations from INFO field
 */
export function extractAnnotations(variant: VCFVariant): {
  gene?: string;
  consequence?: string;
  impact?: string;
  exon?: string;
  transcript?: string;
} {
  const annotations: any = {};

  if (variant.info.ANN) {
    // Parse SnpEff/VEP annotation
    const ann = Array.isArray(variant.info.ANN)
      ? variant.info.ANN[0]
      : variant.info.ANN;
    const fields = ann.split("|");

    annotations.consequence = fields[1];
    annotations.impact = fields[2];
    annotations.gene = fields[3];
    annotations.transcript = fields[6];
    annotations.exon = fields[8];
  }

  if (variant.info.GENE) {
    annotations.gene = variant.info.GENE;
  }

  return annotations;
}

export default {
  parseVCF,
  toHGVS,
  filterVariantsByQuality,
  extractAnnotations,
};
