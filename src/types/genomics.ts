/**
 * Genomics & Precision Medicine Types
 * Agent 14: Genomics & Precision Medicine Module
 *
 * Comprehensive type definitions for genomics, pharmacogenomics,
 * variant interpretation, genetic testing, and precision medicine
 */

import type { BaseEntity } from "./index";
import type { Reference, CodeableConcept, Coding, Annotation } from "./fhir-resources";

// ============================================================================
// Core Genomics Types
// ============================================================================

export interface GenomicData extends BaseEntity {
  patientId: string;
  testId: string;
  testType: GeneticTestType;
  status: GenomicDataStatus;
  performedDate: Date;
  reportedDate: Date | null;
  laboratory: string;
  labOrderId: string | null;
  specimen: SpecimenInfo;
  variants: Variant[];
  interpretations: VariantInterpretation[];
  pgxRecommendations: PGxRecommendation[];
  riskAssessments: GeneticRiskAssessment[];
  rawDataUrl: string | null;
  vcfFileUrl: string | null;
  reportPdfUrl: string | null;
}

export enum GeneticTestType {
  WHOLE_GENOME = "WHOLE_GENOME",
  WHOLE_EXOME = "WHOLE_EXOME",
  TARGETED_PANEL = "TARGETED_PANEL",
  SINGLE_GENE = "SINGLE_GENE",
  PHARMACOGENOMIC = "PHARMACOGENOMIC",
  CARRIER_SCREENING = "CARRIER_SCREENING",
  PRENATAL = "PRENATAL",
  ONCOLOGY = "ONCOLOGY",
  LIQUID_BIOPSY = "LIQUID_BIOPSY",
  RNA_SEQ = "RNA_SEQ",
  MICROARRAY = "MICROARRAY",
}

export enum GenomicDataStatus {
  ORDERED = "ORDERED",
  SPECIMEN_COLLECTED = "SPECIMEN_COLLECTED",
  IN_PROGRESS = "IN_PROGRESS",
  PRELIMINARY = "PRELIMINARY",
  FINAL = "FINAL",
  AMENDED = "AMENDED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export interface SpecimenInfo {
  specimenId: string;
  specimenType: SpecimenType;
  collectionDate: Date;
  collectionMethod: string;
  bodysite: string | null;
  quality: SpecimenQuality;
  notes: string | null;
}

export enum SpecimenType {
  BLOOD = "BLOOD",
  SALIVA = "SALIVA",
  TISSUE = "TISSUE",
  BUCCAL_SWAB = "BUCCAL_SWAB",
  BONE_MARROW = "BONE_MARROW",
  AMNIOTIC_FLUID = "AMNIOTIC_FLUID",
  CSF = "CSF",
  TUMOR = "TUMOR",
}

export enum SpecimenQuality {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  ADEQUATE = "ADEQUATE",
  POOR = "POOR",
  INADEQUATE = "INADEQUATE",
}

// ============================================================================
// Variant Types
// ============================================================================

export interface Variant {
  id: string;
  gene: string;
  geneId: string | null; // HGNC or Entrez Gene ID
  transcript: string | null;
  hgvsGenomic: string; // HGVS genomic notation (e.g., NC_000007.14:g.117559590G>A)
  hgvsCoding: string | null; // HGVS coding notation (e.g., NM_000492.3:c.1521_1523delCTT)
  hgvsProtein: string | null; // HGVS protein notation (e.g., NP_000483.3:p.Phe508del)
  chromosome: string;
  position: number;
  referenceAllele: string;
  alternateAllele: string;
  variantType: VariantType;
  zygosity: Zygosity;
  alleleFrequency: number | null;
  readDepth: number | null;
  genotypeQuality: number | null;
  dbSnpId: string | null; // rs number
  clinvarId: string | null;
  cosmicId: string | null;
  gnomadFrequency: number | null;
  interpretation: VariantInterpretation | null;
}

export enum VariantType {
  SNV = "SNV", // Single Nucleotide Variant
  INSERTION = "INSERTION",
  DELETION = "DELETION",
  INDEL = "INDEL",
  CNV = "CNV", // Copy Number Variant
  DUPLICATION = "DUPLICATION",
  INVERSION = "INVERSION",
  TRANSLOCATION = "TRANSLOCATION",
  COMPLEX = "COMPLEX",
}

export enum Zygosity {
  HETEROZYGOUS = "HETEROZYGOUS",
  HOMOZYGOUS = "HOMOZYGOUS",
  HEMIZYGOUS = "HEMIZYGOUS",
  COMPOUND_HETEROZYGOUS = "COMPOUND_HETEROZYGOUS",
}

// ============================================================================
// Variant Interpretation Types
// ============================================================================

export interface VariantInterpretation extends BaseEntity {
  variantId: string;
  patientId: string;
  classification: VariantClassification;
  acmgClassification: ACMGClassification;
  clinicalSignificance: ClinicalSignificance;
  evidence: Evidence[];
  phenotypes: string[];
  diseases: DiseaseAssociation[];
  functionalImpact: FunctionalImpact | null;
  populationFrequency: PopulationFrequency | null;
  computationalPredictions: ComputationalPrediction[];
  literatureReferences: LiteratureReference[];
  interpretation: string;
  interpretedBy: string;
  interpretedDate: Date;
  reviewStatus: ReviewStatus;
  reviewedBy: string | null;
  reviewedDate: Date | null;
  reviewNotes: string | null;
}

export enum VariantClassification {
  PATHOGENIC = "PATHOGENIC",
  LIKELY_PATHOGENIC = "LIKELY_PATHOGENIC",
  UNCERTAIN_SIGNIFICANCE = "UNCERTAIN_SIGNIFICANCE",
  LIKELY_BENIGN = "LIKELY_BENIGN",
  BENIGN = "BENIGN",
}

export enum ACMGClassification {
  CLASS_1 = "CLASS_1", // Benign
  CLASS_2 = "CLASS_2", // Likely Benign
  CLASS_3 = "CLASS_3", // VUS
  CLASS_4 = "CLASS_4", // Likely Pathogenic
  CLASS_5 = "CLASS_5", // Pathogenic
}

export enum ClinicalSignificance {
  PATHOGENIC = "PATHOGENIC",
  LIKELY_PATHOGENIC = "LIKELY_PATHOGENIC",
  UNCERTAIN = "UNCERTAIN",
  LIKELY_BENIGN = "LIKELY_BENIGN",
  BENIGN = "BENIGN",
  DRUG_RESPONSE = "DRUG_RESPONSE",
  RISK_FACTOR = "RISK_FACTOR",
  PROTECTIVE = "PROTECTIVE",
  ASSOCIATION = "ASSOCIATION",
  NOT_PROVIDED = "NOT_PROVIDED",
  CONFLICTING = "CONFLICTING",
}

export interface Evidence {
  type: EvidenceType;
  acmgCriterion: string | null; // e.g., "PM2", "PP3", "BS1"
  strength: EvidenceStrength;
  description: string;
  source: string | null;
}

export enum EvidenceType {
  POPULATION_DATA = "POPULATION_DATA",
  COMPUTATIONAL = "COMPUTATIONAL",
  FUNCTIONAL = "FUNCTIONAL",
  SEGREGATION = "SEGREGATION",
  ALLELIC_DATA = "ALLELIC_DATA",
  DE_NOVO = "DE_NOVO",
  LITERATURE = "LITERATURE",
  CLINICAL = "CLINICAL",
}

export enum EvidenceStrength {
  VERY_STRONG = "VERY_STRONG",
  STRONG = "STRONG",
  MODERATE = "MODERATE",
  SUPPORTING = "SUPPORTING",
  STAND_ALONE = "STAND_ALONE",
}

export interface DiseaseAssociation {
  disease: string;
  diseaseId: string; // OMIM, Orphanet, etc.
  inheritancePattern: InheritancePattern;
  penetrance: Penetrance;
  evidence: string;
}

export enum InheritancePattern {
  AUTOSOMAL_DOMINANT = "AUTOSOMAL_DOMINANT",
  AUTOSOMAL_RECESSIVE = "AUTOSOMAL_RECESSIVE",
  X_LINKED_DOMINANT = "X_LINKED_DOMINANT",
  X_LINKED_RECESSIVE = "X_LINKED_RECESSIVE",
  Y_LINKED = "Y_LINKED",
  MITOCHONDRIAL = "MITOCHONDRIAL",
  MULTIFACTORIAL = "MULTIFACTORIAL",
  SOMATIC = "SOMATIC",
}

export enum Penetrance {
  COMPLETE = "COMPLETE",
  HIGH = "HIGH",
  MODERATE = "MODERATE",
  LOW = "LOW",
  VARIABLE = "VARIABLE",
  UNKNOWN = "UNKNOWN",
}

export interface FunctionalImpact {
  prediction: string;
  score: number | null;
  impact: "HIGH" | "MODERATE" | "LOW" | "MODIFIER";
  tool: string;
}

export interface PopulationFrequency {
  gnomadOverall: number | null;
  gnomadAFR: number | null;
  gnomadAMR: number | null;
  gnomadEAS: number | null;
  gnomadSAS: number | null;
  gnomadNFE: number | null;
  exacOverall: number | null;
  thousandGenomes: number | null;
}

export interface ComputationalPrediction {
  tool: string; // SIFT, PolyPhen-2, MutationTaster, CADD, etc.
  prediction: string;
  score: number | null;
  interpretation: "DAMAGING" | "TOLERATED" | "DISEASE_CAUSING" | "POLYMORPHISM" | "UNKNOWN";
}

export interface LiteratureReference {
  pmid: string | null;
  doi: string | null;
  title: string;
  authors: string;
  journal: string | null;
  year: number | null;
  relevance: string;
}

export enum ReviewStatus {
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  REVIEWED = "REVIEWED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ============================================================================
// Pharmacogenomics (PGx) Types
// ============================================================================

export interface PGxRecommendation extends BaseEntity {
  patientId: string;
  gene: string;
  diplotype: string; // e.g., "*1/*2"
  phenotype: PGxPhenotype;
  activityScore: number | null;
  drugs: PGxDrugRecommendation[];
  guideline: string; // CPIC, PharmGKB, etc.
  guidelineVersion: string;
  evidence: PGxEvidence;
  recommendations: string;
  alternatives: string | null;
  monitoring: string | null;
  clinicalContext: string | null;
  dateIssued: Date;
  issuedBy: string;
  status: "ACTIVE" | "SUPERSEDED" | "INACTIVE";
}

export interface PGxPhenotype {
  metabolizer: MetabolizerStatus;
  function: FunctionStatus;
  description: string;
}

export enum MetabolizerStatus {
  ULTRARAPID = "ULTRARAPID",
  RAPID = "RAPID",
  NORMAL = "NORMAL",
  INTERMEDIATE = "INTERMEDIATE",
  POOR = "POOR",
  INDETERMINATE = "INDETERMINATE",
}

export enum FunctionStatus {
  NORMAL = "NORMAL",
  INCREASED = "INCREASED",
  DECREASED = "DECREASED",
  NO_FUNCTION = "NO_FUNCTION",
  UNCERTAIN = "UNCERTAIN",
}

export interface PGxDrugRecommendation {
  drug: string;
  rxnormCode: string | null;
  atcCode: string | null;
  recommendation: DrugRecommendation;
  recommendationText: string;
  strength: "STRONG" | "MODERATE" | "OPTIONAL" | "NO_RECOMMENDATION";
  alternatives: string[];
  dosageGuidance: string | null;
  monitoring: string | null;
}

export enum DrugRecommendation {
  USE_AS_DIRECTED = "USE_AS_DIRECTED",
  INCREASE_DOSE = "INCREASE_DOSE",
  DECREASE_DOSE = "DECREASE_DOSE",
  USE_ALTERNATIVE = "USE_ALTERNATIVE",
  AVOID = "AVOID",
  INTENSIVE_MONITORING = "INTENSIVE_MONITORING",
  STANDARD_MONITORING = "STANDARD_MONITORING",
}

export interface PGxEvidence {
  level: EvidenceLevel;
  source: string[];
  studies: number | null;
  quality: "HIGH" | "MODERATE" | "LOW" | "VERY_LOW";
}

export enum EvidenceLevel {
  LEVEL_1A = "LEVEL_1A", // High-quality evidence
  LEVEL_1B = "LEVEL_1B",
  LEVEL_2A = "LEVEL_2A",
  LEVEL_2B = "LEVEL_2B",
  LEVEL_3 = "LEVEL_3",
  LEVEL_4 = "LEVEL_4", // Expert opinion
}

// ============================================================================
// Genetic Risk Assessment Types
// ============================================================================

export interface GeneticRiskAssessment extends BaseEntity {
  patientId: string;
  condition: string;
  conditionCode: string | null; // ICD-10, SNOMED, etc.
  riskCategory: RiskCategory;
  relativeRisk: number | null;
  absoluteRisk: number | null;
  lifetimeRisk: number | null;
  ageSpecificRisk: AgeSpecificRisk[] | null;
  riskFactors: RiskFactor[];
  protectiveFactors: ProtectiveFactor[];
  modelUsed: string;
  modelVersion: string | null;
  confidenceInterval: ConfidenceInterval | null;
  interpretation: string;
  recommendations: string;
  screeningGuidelines: string | null;
  preventiveActions: string | null;
  assessedBy: string;
  assessedDate: Date;
}

export enum RiskCategory {
  LOW = "LOW",
  AVERAGE = "AVERAGE",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

export interface AgeSpecificRisk {
  ageRange: string;
  risk: number;
  unit: "PERCENTAGE" | "RATIO";
}

export interface RiskFactor {
  type: RiskFactorType;
  factor: string;
  contribution: number | null; // Percentage contribution to overall risk
  modifiable: boolean;
}

export enum RiskFactorType {
  GENETIC = "GENETIC",
  FAMILY_HISTORY = "FAMILY_HISTORY",
  LIFESTYLE = "LIFESTYLE",
  ENVIRONMENTAL = "ENVIRONMENTAL",
  CLINICAL = "CLINICAL",
}

export interface ProtectiveFactor {
  factor: string;
  effect: number | null; // Percentage reduction in risk
  evidence: string;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g., 95
}

// ============================================================================
// Family Pedigree Types
// ============================================================================

export interface FamilyPedigree extends BaseEntity {
  patientId: string; // Proband
  title: string;
  description: string | null;
  generations: number;
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  conditions: FamilyCondition[];
  notes: string | null;
  lastUpdatedBy: string;
  isComplete: boolean;
}

export interface FamilyMember {
  id: string;
  patientId: string | null; // Link to patient record if available
  generation: number;
  position: number; // Position within generation
  relationship: string;
  firstName: string | null;
  lastName: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNKNOWN";
  dateOfBirth: Date | null;
  ageAtDiagnosis: number | null;
  isDeceased: boolean;
  ageAtDeath: number | null;
  causeOfDeath: string | null;
  isProband: boolean;
  isAffected: boolean;
  affectedConditions: string[];
  carrierStatus: CarrierStatus[];
  geneticTestResults: string[];
  notes: string | null;
}

export interface CarrierStatus {
  gene: string;
  variant: string | null;
  status: "CARRIER" | "NON_CARRIER" | "AFFECTED" | "UNKNOWN";
}

export interface FamilyRelationship {
  id: string;
  member1Id: string;
  member2Id: string;
  relationshipType: RelationshipType;
  isConsanguineous: boolean;
}

export enum RelationshipType {
  PARENT_CHILD = "PARENT_CHILD",
  SIBLINGS = "SIBLINGS",
  SPOUSES = "SPOUSES",
  TWINS_IDENTICAL = "TWINS_IDENTICAL",
  TWINS_FRATERNAL = "TWINS_FRATERNAL",
  HALF_SIBLINGS = "HALF_SIBLINGS",
}

export interface FamilyCondition {
  condition: string;
  icdCode: string | null;
  affectedMembers: string[]; // Array of family member IDs
  inheritancePattern: InheritancePattern | null;
  notes: string | null;
}

// ============================================================================
// Genetic Counseling Types
// ============================================================================

export interface GeneticCounselingSession extends BaseEntity {
  patientId: string;
  counselorId: string;
  sessionType: CounselingType;
  sessionDate: Date;
  duration: number; // minutes
  indication: string;
  preTestCounseling: PreTestCounseling | null;
  postTestCounseling: PostTestCounseling | null;
  riskAssessment: string | null;
  educationProvided: string[];
  materialsProvided: string[];
  informedConsentObtained: boolean;
  consentFormUrl: string | null;
  patientQuestions: string | null;
  patientConcerns: string | null;
  psychosocialAssessment: string | null;
  referrals: CounselingReferral[];
  followUpPlan: string | null;
  nextSessionDate: Date | null;
  sessionNotes: string;
  status: CounselingStatus;
}

export enum CounselingType {
  PRE_TEST = "PRE_TEST",
  POST_TEST = "POST_TEST",
  DIAGNOSTIC = "DIAGNOSTIC",
  CARRIER_SCREENING = "CARRIER_SCREENING",
  PRENATAL = "PRENATAL",
  CANCER_RISK = "CANCER_RISK",
  CARDIOVASCULAR_RISK = "CARDIOVASCULAR_RISK",
  PHARMACOGENOMICS = "PHARMACOGENOMICS",
  FOLLOW_UP = "FOLLOW_UP",
}

export interface PreTestCounseling {
  familyHistoryReviewed: boolean;
  testOptionsDiscussed: string[];
  testRecommendation: string;
  riskBenefitDiscussion: string;
  limitationsDiscussed: boolean;
  costDiscussed: boolean;
  insuranceCoverageReviewed: boolean;
  psychologicalImpactDiscussed: boolean;
  discriminationRisksDiscussed: boolean; // GINA, etc.
}

export interface PostTestCounseling {
  resultsExplained: boolean;
  clinicalSignificanceDiscussed: boolean;
  medicalManagementOptions: string[];
  screeningRecommendations: string | null;
  familyImplications: string | null;
  cascadeTestingRecommended: boolean;
  psychologicalSupport: string | null;
  patientUnderstanding: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
}

export interface CounselingReferral {
  specialty: string;
  provider: string | null;
  reason: string;
  urgency: "ROUTINE" | "URGENT" | "STAT";
  referralDate: Date | null;
}

export enum CounselingStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED",
}

// ============================================================================
// Precision Medicine Types
// ============================================================================

export interface PrecisionMedicineProfile extends BaseEntity {
  patientId: string;
  genomicData: GenomicDataSummary;
  pgxProfile: PGxProfile;
  diseaseRisks: GeneticRiskSummary[];
  activeRecommendations: PrecisionMedicineRecommendation[];
  clinicalTrials: ClinicalTrialMatch[];
  targetedTherapies: TargetedTherapy[];
  biomarkers: Biomarker[];
  lastUpdated: Date;
  updatedBy: string;
}

export interface GenomicDataSummary {
  totalVariants: number;
  pathogenicVariants: number;
  likelyPathogenicVariants: number;
  vusVariants: number;
  actionableVariants: number;
  incidentalFindings: number;
  lastTestDate: Date | null;
}

export interface PGxProfile {
  genes: PGxGeneStatus[];
  drugInteractions: number;
  activeAlerts: number;
  lastUpdated: Date;
}

export interface PGxGeneStatus {
  gene: string;
  diplotype: string;
  phenotype: string;
  affectedDrugClasses: string[];
}

export interface GeneticRiskSummary {
  condition: string;
  riskLevel: RiskCategory;
  riskScore: number | null;
  requiresAction: boolean;
}

export interface PrecisionMedicineRecommendation extends BaseEntity {
  patientId: string;
  type: RecommendationType;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  rationale: string;
  evidence: string;
  actionItems: ActionItem[];
  targetDate: Date | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DISMISSED";
  assignedTo: string | null;
  completedDate: Date | null;
  outcome: string | null;
}

export enum RecommendationType {
  MEDICATION_CHANGE = "MEDICATION_CHANGE",
  SCREENING = "SCREENING",
  GENETIC_TESTING = "GENETIC_TESTING",
  LIFESTYLE = "LIFESTYLE",
  SPECIALIST_REFERRAL = "SPECIALIST_REFERRAL",
  CLINICAL_TRIAL = "CLINICAL_TRIAL",
  PREVENTIVE_INTERVENTION = "PREVENTIVE_INTERVENTION",
  CASCADE_TESTING = "CASCADE_TESTING",
}

export interface ActionItem {
  description: string;
  completed: boolean;
  completedDate: Date | null;
}

export interface ClinicalTrialMatch {
  trialId: string; // NCT number
  title: string;
  phase: string;
  status: string;
  sponsor: string;
  condition: string;
  intervention: string;
  eligibilityCriteria: string;
  matchReason: string;
  matchScore: number;
  locations: string[];
  contactInfo: string | null;
  url: string;
}

export interface TargetedTherapy {
  drug: string;
  drugClass: string;
  target: string;
  indication: string;
  biomarkerRequired: string;
  biomarkerStatus: "POSITIVE" | "NEGATIVE" | "UNKNOWN";
  evidence: string;
  fdaApproved: boolean;
  guidelineRecommended: boolean;
}

export interface Biomarker {
  name: string;
  type: BiomarkerType;
  value: string;
  unit: string | null;
  status: "POSITIVE" | "NEGATIVE" | "INDETERMINATE";
  clinicalSignificance: string;
  testDate: Date;
  testMethod: string | null;
}

export enum BiomarkerType {
  GENETIC = "GENETIC",
  PROTEIN = "PROTEIN",
  METABOLITE = "METABOLITE",
  RNA = "RNA",
  EPIGENETIC = "EPIGENETIC",
}

// ============================================================================
// FHIR Genomics Resources
// ============================================================================

export interface MolecularSequence {
  resourceType: "MolecularSequence";
  id?: string;
  meta?: any;
  identifier?: any[];
  type: "aa" | "dna" | "rna";
  coordinateSystem: number;
  patient?: Reference;
  specimen?: Reference;
  device?: Reference;
  performer?: Reference;
  quantity?: any;
  referenceSeq?: ReferenceSequence;
  variant?: SequenceVariant[];
  observedSeq?: string;
  quality?: SequenceQuality[];
  readCoverage?: number;
  repository?: SequenceRepository[];
  pointer?: Reference[];
  structureVariant?: StructureVariant[];
}

export interface ReferenceSequence {
  chromosome?: CodeableConcept;
  genomeBuild?: string;
  orientation?: "sense" | "antisense";
  referenceSeqId?: CodeableConcept;
  referenceSeqPointer?: Reference;
  referenceSeqString?: string;
  strand?: "watson" | "crick";
  windowStart?: number;
  windowEnd?: number;
}

export interface SequenceVariant {
  start?: number;
  end?: number;
  observedAllele?: string;
  referenceAllele?: string;
  cigar?: string;
  variantPointer?: Reference;
}

export interface SequenceQuality {
  type: "indel" | "snp" | "unknown";
  standardSequence?: CodeableConcept;
  start?: number;
  end?: number;
  score?: any;
  method?: CodeableConcept;
  truthTP?: number;
  queryTP?: number;
  truthFN?: number;
  queryFP?: number;
  gtFP?: number;
  precision?: number;
  recall?: number;
  fScore?: number;
}

export interface SequenceRepository {
  type: "directlink" | "openapi" | "login" | "oauth" | "other";
  url?: string;
  name?: string;
  datasetId?: string;
  variantsetId?: string;
  readsetId?: string;
}

export interface StructureVariant {
  variantType?: CodeableConcept;
  exact?: boolean;
  length?: number;
  outer?: StructureVariantOuter;
  inner?: StructureVariantInner;
}

export interface StructureVariantOuter {
  start?: number;
  end?: number;
}

export interface StructureVariantInner {
  start?: number;
  end?: number;
}

export interface DiagnosticImplication {
  resourceType: "Observation";
  id?: string;
  status: string;
  category?: CodeableConcept[];
  code: CodeableConcept; // Should indicate diagnostic implication
  subject?: Reference;
  effectiveDateTime?: string;
  performer?: Reference[];
  interpretation?: CodeableConcept[];
  note?: Annotation[];
  derivedFrom?: Reference[]; // Links to MolecularSequence or other observations
  component?: ObservationComponent[];
}

export interface ObservationComponent {
  code: CodeableConcept;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueQuantity?: any;
  interpretation?: CodeableConcept[];
}

// ============================================================================
// VCF Parsing Types
// ============================================================================

export interface VCFFile {
  fileVersion: string;
  metadata: VCFMetadata;
  header: VCFHeader;
  variants: VCFVariant[];
}

export interface VCFMetadata {
  reference: string;
  source: string;
  fileDate: string;
  contigs: VCFContig[];
  filters: VCFFilter[];
  info: VCFInfo[];
  format: VCFFormat[];
}

export interface VCFContig {
  id: string;
  length: number | null;
  assembly: string | null;
}

export interface VCFFilter {
  id: string;
  description: string;
}

export interface VCFInfo {
  id: string;
  number: string;
  type: string;
  description: string;
}

export interface VCFFormat {
  id: string;
  number: string;
  type: string;
  description: string;
}

export interface VCFHeader {
  chrom: string;
  pos: string;
  id: string;
  ref: string;
  alt: string;
  qual: string;
  filter: string;
  info: string;
  format: string;
  samples: string[];
}

export interface VCFVariant {
  chrom: string;
  pos: number;
  id: string[];
  ref: string;
  alt: string[];
  qual: number | null;
  filter: string[];
  info: Record<string, any>;
  format: string[];
  samples: Record<string, Record<string, any>>;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateGeneticTestDto {
  patientId: string;
  testType: GeneticTestType;
  indication: string;
  orderingProviderId: string;
  laboratory: string;
  specimenType: SpecimenType;
  urgency: "ROUTINE" | "URGENT" | "STAT";
  icdCodes: string[];
  clinicalHistory: string | null;
  familyHistory: string | null;
  consentObtained: boolean;
  consentFormUrl: string | null;
}

export interface UpdateVariantInterpretationDto {
  variantId: string;
  classification: VariantClassification;
  acmgClassification: ACMGClassification;
  clinicalSignificance: ClinicalSignificance;
  interpretation: string;
  evidence: Evidence[];
}

export interface CreateCounselingSessionDto {
  patientId: string;
  sessionType: CounselingType;
  sessionDate: Date;
  indication: string;
  duration: number;
}

export interface SearchVariantParams {
  gene?: string;
  chromosome?: string;
  position?: number;
  variantType?: VariantType;
  classification?: VariantClassification;
  hgvs?: string;
  dbSnpId?: string;
}

export interface GenomicsSearchParams {
  patientId?: string;
  testType?: GeneticTestType;
  status?: GenomicDataStatus;
  dateFrom?: Date;
  dateTo?: Date;
  laboratory?: string;
  hasPathogenicVariants?: boolean;
}

// ============================================================================
// Analytics & Reporting Types
// ============================================================================

export interface GenomicsAnalytics {
  totalTests: number;
  testsByType: Record<GeneticTestType, number>;
  positiveFindings: number;
  positiveRate: number;
  averageTurnaroundTime: number;
  pathogenicVariantsFound: number;
  pgxRecommendationsIssued: number;
  counselingSessionsCompleted: number;
  clinicalTrialMatches: number;
}

export interface GenomicsTrends {
  period: string;
  testsOrdered: number;
  testsCompleted: number;
  incidentalFindings: number;
  actionableVariants: number;
}
