/**
 * FHIR Genomics Resources
 * Handles conversion between internal genomics data and FHIR R4 genomics resources
 * Supports MolecularSequence, Observation (genomics), DiagnosticReport (genomics)
 */

import type {
  GenomicData,
  Variant,
  VariantInterpretation,
  MolecularSequence,
  DiagnosticImplication,
} from "@/types/genomics";
import type {
  Reference,
  CodeableConcept,
  Observation,
  DiagnosticReport,
} from "@/types/fhir-resources";

/**
 * Convert variant to FHIR MolecularSequence resource
 */
export function variantToMolecularSequence(
  variant: Variant,
  patientId: string
): MolecularSequence {
  const sequence: MolecularSequence = {
    resourceType: "MolecularSequence",
    id: variant.id,
    type: "dna",
    coordinateSystem: 0, // 0-based
    patient: {
      reference: `Patient/${patientId}`,
      type: "Patient",
    },
    referenceSeq: {
      chromosome: {
        coding: [
          {
            system: "http://hl7.org/fhir/chromosome-human",
            code: variant.chromosome.replace("chr", ""),
            display: `Chromosome ${variant.chromosome.replace("chr", "")}`,
          },
        ],
      },
      genomeBuild: "GRCh38",
      referenceSeqId: {
        coding: [
          {
            system: "http://www.ncbi.nlm.nih.gov/nuccore",
            code: variant.hgvsGenomic?.split(":")[0] || "",
          },
        ],
      },
      strand: "watson",
      windowStart: variant.position - 1,
      windowEnd: variant.position + variant.referenceAllele.length - 1,
    },
    variant: [
      {
        start: variant.position - 1,
        end: variant.position + variant.referenceAllele.length - 1,
        observedAllele: variant.alternateAllele,
        referenceAllele: variant.referenceAllele,
      },
    ],
    quality: variant.genotypeQuality
      ? [
          {
            type: "snp",
            score: {
              value: variant.genotypeQuality,
            },
          },
        ]
      : undefined,
    readCoverage: variant.readDepth || undefined,
  };

  return sequence;
}

/**
 * Convert variant interpretation to FHIR Observation (Diagnostic Implication)
 */
export function interpretationToObservation(
  interpretation: VariantInterpretation,
  variant: Variant,
  patientId: string
): Observation {
  const observation: Observation = {
    resourceType: "Observation",
    id: interpretation.id,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "51968-6",
          display: "Genetic analysis master panel",
        },
      ],
      text: "Variant Interpretation",
    },
    subject: {
      reference: `Patient/${patientId}`,
      type: "Patient",
    },
    effectiveDateTime: interpretation.interpretedDate.toISOString(),
    performer: [
      {
        display: interpretation.interpretedBy,
      },
    ],
    valueCodeableConcept: {
      coding: [
        {
          system: "http://loinc.org",
          code: mapClassificationToLOINC(interpretation.classification),
          display: interpretation.classification.replace(/_/g, " "),
        },
      ],
      text: interpretation.interpretation,
    },
    interpretation: [
      {
        coding: [
          {
            system:
              "http://hl7.org/fhir/ValueSet/clinvar-clinical-significance",
            code: interpretation.clinicalSignificance,
            display: interpretation.clinicalSignificance.replace(/_/g, " "),
          },
        ],
      },
    ],
    note: [
      {
        text: interpretation.interpretation,
      },
    ],
    component: [
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "48018-6",
              display: "Gene studied",
            },
          ],
        },
        valueCodeableConcept: {
          coding: [
            {
              system: "http://www.genenames.org",
              code: variant.geneId || "",
              display: variant.gene,
            },
          ],
        },
      },
      {
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "81252-9",
              display: "DNA change (c.HGVS)",
            },
          ],
        },
        valueCodeableConcept: {
          text: variant.hgvsCoding || variant.hgvsGenomic,
        },
      },
    ],
  };

  if (variant.hgvsProtein) {
    observation.component?.push({
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "48005-3",
            display: "Amino acid change (p.HGVS)",
          },
        ],
      },
      valueCodeableConcept: {
        text: variant.hgvsProtein,
      },
    });
  }

  if (variant.dbSnpId) {
    observation.component?.push({
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "81255-2",
            display: "dbSNP ID",
          },
        ],
      },
      valueCodeableConcept: {
        coding: [
          {
            system: "http://www.ncbi.nlm.nih.gov/projects/SNP",
            code: variant.dbSnpId,
            display: variant.dbSnpId,
          },
        ],
      },
    });
  }

  return observation;
}

/**
 * Convert genomic test to FHIR DiagnosticReport
 */
export function genomicDataToDiagnosticReport(
  genomicData: GenomicData,
  patientId: string
): DiagnosticReport {
  const report: DiagnosticReport = {
    resourceType: "DiagnosticReport",
    id: genomicData.id,
    status: mapStatusToFHIR(genomicData.status),
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0074",
            code: "GE",
            display: "Genetics",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "81247-9",
          display: "Master HL7 genetic variant reporting panel",
        },
      ],
      text: mapTestTypeToDisplay(genomicData.testType),
    },
    subject: {
      reference: `Patient/${patientId}`,
      type: "Patient",
    },
    effectiveDateTime: genomicData.performedDate.toISOString(),
    issued: genomicData.reportedDate?.toISOString(),
    performer: [
      {
        display: genomicData.laboratory,
      },
    ],
    result: genomicData.variants.map((variant) => ({
      reference: `Observation/${variant.id}`,
      type: "Observation",
    })),
    conclusion: generateConclusion(genomicData),
    presentedForm: genomicData.reportPdfUrl
      ? [
          {
            contentType: "application/pdf",
            url: genomicData.reportPdfUrl,
            title: "Genetic Test Report",
          },
        ]
      : undefined,
  };

  return report;
}

/**
 * Convert FHIR MolecularSequence to internal Variant
 */
export function molecularSequenceToVariant(
  sequence: MolecularSequence
): Partial<Variant> {
  const variant = sequence.variant?.[0];

  if (!variant) {
    throw new Error("No variant data in MolecularSequence");
  }

  const chromosome =
    sequence.referenceSeq?.chromosome?.coding?.[0]?.code || "unknown";
  const position = (variant.start || 0) + 1; // Convert to 1-based

  return {
    chromosome,
    position,
    referenceAllele: variant.referenceAllele || "",
    alternateAllele: variant.observedAllele || "",
    readDepth: sequence.readCoverage || null,
    genotypeQuality: sequence.quality?.[0]?.score?.value || null,
  };
}

/**
 * Create FHIR Bundle for genomic report
 */
export function createGenomicBundle(
  genomicData: GenomicData,
  patientId: string
): any {
  const entries: any[] = [];

  // DiagnosticReport entry
  const diagnosticReport = genomicDataToDiagnosticReport(
    genomicData,
    patientId
  );
  entries.push({
    fullUrl: `DiagnosticReport/${genomicData.id}`,
    resource: diagnosticReport,
  });

  // MolecularSequence entries for each variant
  for (const variant of genomicData.variants) {
    const sequence = variantToMolecularSequence(variant, patientId);
    entries.push({
      fullUrl: `MolecularSequence/${variant.id}`,
      resource: sequence,
    });

    // Observation entry for interpretation
    if (variant.interpretation) {
      const observation = interpretationToObservation(
        variant.interpretation,
        variant,
        patientId
      );
      entries.push({
        fullUrl: `Observation/${variant.interpretation.id}`,
        resource: observation,
      });
    }
  }

  return {
    resourceType: "Bundle",
    type: "collection",
    total: entries.length,
    entry: entries,
  };
}

/**
 * Map classification to LOINC code
 */
function mapClassificationToLOINC(
  classification: string
): string {
  const mapping: Record<string, string> = {
    PATHOGENIC: "LA6668-3",
    LIKELY_PATHOGENIC: "LA26332-9",
    UNCERTAIN_SIGNIFICANCE: "LA26333-7",
    LIKELY_BENIGN: "LA26334-5",
    BENIGN: "LA6675-8",
  };

  return mapping[classification] || "LA26333-7";
}

/**
 * Map internal status to FHIR status
 */
function mapStatusToFHIR(
  status: string
): "registered" | "partial" | "preliminary" | "final" | "amended" | "corrected" | "appended" | "cancelled" | "entered-in-error" | "unknown" {
  const mapping: Record<string, any> = {
    ORDERED: "registered",
    IN_PROGRESS: "partial",
    PRELIMINARY: "preliminary",
    FINAL: "final",
    AMENDED: "amended",
    CANCELLED: "cancelled",
    FAILED: "entered-in-error",
  };

  return mapping[status] || "unknown";
}

/**
 * Map test type to display text
 */
function mapTestTypeToDisplay(testType: string): string {
  const mapping: Record<string, string> = {
    WHOLE_GENOME: "Whole Genome Sequencing",
    WHOLE_EXOME: "Whole Exome Sequencing",
    TARGETED_PANEL: "Targeted Gene Panel",
    SINGLE_GENE: "Single Gene Test",
    PHARMACOGENOMIC: "Pharmacogenomic Panel",
    CARRIER_SCREENING: "Carrier Screening",
    PRENATAL: "Prenatal Genetic Testing",
    ONCOLOGY: "Oncology Panel",
    LIQUID_BIOPSY: "Liquid Biopsy",
  };

  return mapping[testType] || testType;
}

/**
 * Generate report conclusion
 */
function generateConclusion(genomicData: GenomicData): string {
  const pathogenic = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "PATHOGENIC"
  ).length;

  const likelyPathogenic = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "LIKELY_PATHOGENIC"
  ).length;

  const vus = genomicData.variants.filter(
    (v) => v.interpretation?.classification === "UNCERTAIN_SIGNIFICANCE"
  ).length;

  let conclusion = `Genetic testing (${mapTestTypeToDisplay(genomicData.testType)}) was performed. `;

  if (pathogenic > 0) {
    conclusion += `${pathogenic} pathogenic variant(s) identified. `;
  }

  if (likelyPathogenic > 0) {
    conclusion += `${likelyPathogenic} likely pathogenic variant(s) identified. `;
  }

  if (vus > 0) {
    conclusion += `${vus} variant(s) of uncertain significance identified. `;
  }

  if (pathogenic === 0 && likelyPathogenic === 0) {
    conclusion += "No pathogenic or likely pathogenic variants detected. ";
  }

  conclusion += "See detailed report for variant-specific interpretations and recommendations.";

  return conclusion;
}

/**
 * Validate FHIR genomics resource
 */
export function validateGenomicsResource(
  resource: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (resource.resourceType === "MolecularSequence") {
    if (!resource.type) {
      errors.push("MolecularSequence must have type (aa, dna, or rna)");
    }

    if (resource.coordinateSystem === undefined) {
      errors.push("MolecularSequence must have coordinateSystem");
    }

    if (!resource.referenceSeq) {
      errors.push("MolecularSequence must have referenceSeq");
    }
  }

  if (resource.resourceType === "Observation" && resource.category) {
    const hasGeneticsCategory = resource.category.some((cat: any) =>
      cat.coding?.some(
        (c: any) => c.code === "laboratory" || c.code === "genetics"
      )
    );

    if (!hasGeneticsCategory) {
      errors.push(
        "Genetic Observation should have laboratory or genetics category"
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  variantToMolecularSequence,
  interpretationToObservation,
  genomicDataToDiagnosticReport,
  molecularSequenceToVariant,
  createGenomicBundle,
  validateGenomicsResource,
};
