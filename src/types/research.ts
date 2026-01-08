/**
 * Clinical Research & Trials Management Types
 * Lithic Healthcare Platform v0.5
 *
 * Supports 21 CFR Part 11, CDISC standards (CDASH, SDTM)
 */

import { BaseEntity, AuditFields } from "./index";

// ============================================================================
// Clinical Trial Types
// ============================================================================

export interface ClinicalTrial extends BaseEntity {
  trialId: string; // NCT number or internal ID
  title: string;
  shortTitle: string;
  acronym: string | null;
  sponsorName: string;
  sponsorProtocolId: string;
  phase: TrialPhase;
  status: TrialStatus;
  type: TrialType;
  indication: string;
  objectives: TrialObjectives;
  design: TrialDesign;
  eligibilityCriteria: EligibilityCriteria;
  enrollment: EnrollmentInfo;
  timeline: TrialTimeline;
  locations: StudySite[];
  contacts: TrialContact[];
  documents: TrialDocument[];
  regulatoryInfo: RegulatoryInfo;
  budgetInfo: BudgetInfo;
  metadata: Record<string, any>;
  version: number;
  versionHistory: ProtocolVersion[];
}

export enum TrialPhase {
  PHASE_0 = "PHASE_0",
  PHASE_I = "PHASE_I",
  PHASE_II = "PHASE_II",
  PHASE_III = "PHASE_III",
  PHASE_IV = "PHASE_IV",
  PHASE_I_II = "PHASE_I_II",
  PHASE_II_III = "PHASE_II_III",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export enum TrialStatus {
  PLANNING = "PLANNING",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVED = "APPROVED",
  RECRUITING = "RECRUITING",
  ACTIVE = "ACTIVE",
  ENROLLING_BY_INVITATION = "ENROLLING_BY_INVITATION",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED",
  COMPLETED = "COMPLETED",
  WITHDRAWN = "WITHDRAWN",
}

export enum TrialType {
  INTERVENTIONAL = "INTERVENTIONAL",
  OBSERVATIONAL = "OBSERVATIONAL",
  EXPANDED_ACCESS = "EXPANDED_ACCESS",
}

export interface TrialObjectives {
  primary: string[];
  secondary: string[];
  exploratory: string[];
}

export interface TrialDesign {
  allocation: AllocationMethod;
  interventionModel: InterventionModel;
  masking: MaskingType;
  primaryPurpose: string;
  studyArms: StudyArm[];
  numberOfArms: number;
  isBlinded: boolean;
  blindingScheme: BlindingScheme | null;
}

export enum AllocationMethod {
  RANDOMIZED = "RANDOMIZED",
  NON_RANDOMIZED = "NON_RANDOMIZED",
  NA = "NA",
}

export enum InterventionModel {
  SINGLE_GROUP = "SINGLE_GROUP",
  PARALLEL = "PARALLEL",
  CROSSOVER = "CROSSOVER",
  FACTORIAL = "FACTORIAL",
  SEQUENTIAL = "SEQUENTIAL",
}

export enum MaskingType {
  NONE = "NONE",
  SINGLE = "SINGLE",
  DOUBLE = "DOUBLE",
  TRIPLE = "TRIPLE",
  QUADRUPLE = "QUADRUPLE",
}

export interface BlindingScheme {
  participant: boolean;
  careProvider: boolean;
  investigator: boolean;
  outcomesAssessor: boolean;
  dataAnalyst: boolean;
  emergencyUnblindingProcedure: string;
}

export interface StudyArm {
  id: string;
  name: string;
  type: ArmType;
  description: string;
  interventions: string[];
  targetEnrollment: number;
  actualEnrollment: number;
}

export enum ArmType {
  EXPERIMENTAL = "EXPERIMENTAL",
  ACTIVE_COMPARATOR = "ACTIVE_COMPARATOR",
  PLACEBO_COMPARATOR = "PLACEBO_COMPARATOR",
  SHAM_COMPARATOR = "SHAM_COMPARATOR",
  NO_INTERVENTION = "NO_INTERVENTION",
}

// ============================================================================
// Eligibility Types
// ============================================================================

export interface EligibilityCriteria {
  inclusionCriteria: Criterion[];
  exclusionCriteria: Criterion[];
  minAge: number | null;
  maxAge: number | null;
  ageUnit: AgeUnit;
  acceptsHealthyVolunteers: boolean;
  sex: EligibleSex;
  additionalRequirements: string[];
}

export interface Criterion {
  id: string;
  code: string;
  description: string;
  category: string;
  dataType: CriterionDataType;
  comparisonOperator: ComparisonOperator | null;
  value: any;
  unit: string | null;
  isRequired: boolean;
  automatable: boolean;
  fhirPath: string | null;
  loincCode: string | null;
}

export enum CriterionDataType {
  BOOLEAN = "BOOLEAN",
  NUMERIC = "NUMERIC",
  TEXT = "TEXT",
  DATE = "DATE",
  CODE = "CODE",
  OBSERVATION = "OBSERVATION",
  CONDITION = "CONDITION",
  MEDICATION = "MEDICATION",
  PROCEDURE = "PROCEDURE",
}

export enum ComparisonOperator {
  EQUAL = "EQUAL",
  NOT_EQUAL = "NOT_EQUAL",
  GREATER_THAN = "GREATER_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN = "LESS_THAN",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  IN = "IN",
  NOT_IN = "NOT_IN",
}

export enum AgeUnit {
  YEARS = "YEARS",
  MONTHS = "MONTHS",
  WEEKS = "WEEKS",
  DAYS = "DAYS",
}

export enum EligibleSex {
  ALL = "ALL",
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export interface EligibilityAssessment {
  id: string;
  patientId: string;
  trialId: string;
  assessedAt: Date;
  assessedBy: string;
  overallEligible: boolean;
  score: number;
  results: CriterionResult[];
  notes: string | null;
  recommendedAction: EligibilityAction;
}

export interface CriterionResult {
  criterionId: string;
  met: boolean;
  value: any;
  automatedCheck: boolean;
  manualOverride: boolean;
  overrideReason: string | null;
  notes: string | null;
}

export enum EligibilityAction {
  PROCEED_TO_ENROLLMENT = "PROCEED_TO_ENROLLMENT",
  REQUIRES_REVIEW = "REQUIRES_REVIEW",
  NOT_ELIGIBLE = "NOT_ELIGIBLE",
  SCREEN_FAILURE = "SCREEN_FAILURE",
}

// ============================================================================
// Subject Enrollment Types
// ============================================================================

export interface StudySubject extends BaseEntity {
  subjectId: string; // De-identified study ID
  patientId: string; // Link to actual patient record
  trialId: string;
  siteId: string;
  armId: string | null;
  randomizationNumber: string | null;
  enrollmentDate: Date;
  status: SubjectStatus;
  consentStatus: ConsentStatus;
  consentDate: Date | null;
  consentVersion: string | null;
  consentForm: string | null;
  screeningDate: Date | null;
  screeningNumber: string | null;
  withdrawalDate: Date | null;
  withdrawalReason: string | null;
  completionDate: Date | null;
  visits: SubjectVisit[];
  adherence: AdherenceInfo;
  blinded: boolean;
  unblindingLog: UnblindingEvent[];
}

export enum SubjectStatus {
  SCREENING = "SCREENING",
  ENROLLED = "ENROLLED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  WITHDRAWN = "WITHDRAWN",
  LOST_TO_FOLLOWUP = "LOST_TO_FOLLOWUP",
  DISCONTINUED = "DISCONTINUED",
  SCREEN_FAILURE = "SCREEN_FAILURE",
}

export enum ConsentStatus {
  NOT_OBTAINED = "NOT_OBTAINED",
  OBTAINED = "OBTAINED",
  WITHDRAWN = "WITHDRAWN",
  RECONSENTED = "RECONSENTED",
}

export interface SubjectVisit {
  id: string;
  visitNumber: number;
  visitName: string;
  visitType: VisitType;
  scheduledDate: Date;
  actualDate: Date | null;
  visitWindow: VisitWindow;
  status: VisitStatus;
  proceduresCompleted: string[];
  proceduresPending: string[];
  assessmentsCompleted: string[];
  forms: DataCaptureFormInstance[];
  notes: string | null;
}

export enum VisitType {
  SCREENING = "SCREENING",
  BASELINE = "BASELINE",
  TREATMENT = "TREATMENT",
  FOLLOW_UP = "FOLLOW_UP",
  EARLY_TERMINATION = "EARLY_TERMINATION",
  UNSCHEDULED = "UNSCHEDULED",
  SAFETY = "SAFETY",
}

export interface VisitWindow {
  targetDay: number;
  minDay: number;
  maxDay: number;
  unit: "DAY" | "WEEK" | "MONTH";
}

export enum VisitStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  MISSED = "MISSED",
  CANCELLED = "CANCELLED",
}

export interface AdherenceInfo {
  overallRate: number;
  missedVisits: number;
  protocolDeviations: number;
  dosageAdherence: number;
  lastAssessed: Date;
}

export interface UnblindingEvent {
  id: string;
  unblindedAt: Date;
  unblindedBy: string;
  reason: UnblindingReason;
  emergencyUnblinding: boolean;
  approvedBy: string | null;
  details: string;
}

export enum UnblindingReason {
  ADVERSE_EVENT = "ADVERSE_EVENT",
  MEDICAL_EMERGENCY = "MEDICAL_EMERGENCY",
  PREGNANCY = "PREGNANCY",
  PROTOCOL_DEVIATION = "PROTOCOL_DEVIATION",
  STUDY_COMPLETION = "STUDY_COMPLETION",
  OTHER = "OTHER",
}

// ============================================================================
// Data Capture Types (REDCap-like)
// ============================================================================

export interface DataCaptureForm extends BaseEntity {
  formId: string;
  trialId: string;
  name: string;
  description: string;
  version: string;
  category: FormCategory;
  cdiscDomain: string | null; // SDTM domain
  isRepeating: boolean;
  maxRepeat: number | null;
  fields: FormField[];
  logic: FormLogic[];
  validations: FormValidation[];
  status: FormStatus;
  template: boolean;
}

export enum FormCategory {
  DEMOGRAPHICS = "DEMOGRAPHICS",
  MEDICAL_HISTORY = "MEDICAL_HISTORY",
  VITAL_SIGNS = "VITAL_SIGNS",
  LAB_RESULTS = "LAB_RESULTS",
  ADVERSE_EVENTS = "ADVERSE_EVENTS",
  CONCOMITANT_MEDICATIONS = "CONCOMITANT_MEDICATIONS",
  EFFICACY = "EFFICACY",
  QUESTIONNAIRE = "QUESTIONNAIRE",
  IMAGING = "IMAGING",
  OTHER = "OTHER",
}

export enum FormStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  LOCKED = "LOCKED",
  ARCHIVED = "ARCHIVED",
}

export interface FormField {
  id: string;
  fieldName: string;
  label: string;
  description: string | null;
  fieldType: FieldType;
  dataType: FieldDataType;
  required: boolean;
  options: FieldOption[] | null;
  validation: FieldValidation | null;
  units: string | null;
  cdiscVariable: string | null;
  loincCode: string | null;
  snomedCode: string | null;
  section: string | null;
  order: number;
  conditional: boolean;
  conditionalLogic: string | null;
  helpText: string | null;
}

export enum FieldType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
  DATETIME = "DATETIME",
  TIME = "TIME",
  DROPDOWN = "DROPDOWN",
  RADIO = "RADIO",
  CHECKBOX = "CHECKBOX",
  TEXTAREA = "TEXTAREA",
  SLIDER = "SLIDER",
  FILE_UPLOAD = "FILE_UPLOAD",
  SIGNATURE = "SIGNATURE",
  CALCULATED = "CALCULATED",
}

export enum FieldDataType {
  STRING = "STRING",
  INTEGER = "INTEGER",
  DECIMAL = "DECIMAL",
  DATE = "DATE",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  FILE = "FILE",
}

export interface FieldOption {
  value: string;
  label: string;
  code: string | null;
}

export interface FieldValidation {
  min: number | null;
  max: number | null;
  pattern: string | null;
  customValidation: string | null;
  errorMessage: string | null;
}

export interface FormLogic {
  id: string;
  condition: string;
  action: LogicAction;
  targetFields: string[];
  value: any;
}

export enum LogicAction {
  SHOW = "SHOW",
  HIDE = "HIDE",
  ENABLE = "ENABLE",
  DISABLE = "DISABLE",
  REQUIRE = "REQUIRE",
  SET_VALUE = "SET_VALUE",
}

export interface FormValidation {
  id: string;
  type: ValidationType;
  fields: string[];
  rule: string;
  message: string;
}

export enum ValidationType {
  REQUIRED = "REQUIRED",
  RANGE = "RANGE",
  CROSS_FIELD = "CROSS_FIELD",
  CUSTOM = "CUSTOM",
}

export interface DataCaptureFormInstance extends BaseEntity {
  instanceId: string;
  formId: string;
  subjectId: string;
  visitId: string | null;
  repeatInstance: number | null;
  data: Record<string, any>;
  status: FormInstanceStatus;
  completedAt: Date | null;
  completedBy: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  lockedAt: Date | null;
  lockedBy: string | null;
  queries: DataQuery[];
  signatures: ElectronicSignature[];
  auditTrail: FormAuditEntry[];
}

export enum FormInstanceStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  VERIFIED = "VERIFIED",
  LOCKED = "LOCKED",
  QUERY_OPEN = "QUERY_OPEN",
}

export interface DataQuery {
  id: string;
  fieldName: string;
  queryType: QueryType;
  question: string;
  raisedBy: string;
  raisedAt: Date;
  status: QueryStatus;
  response: string | null;
  respondedBy: string | null;
  respondedAt: Date | null;
  closedBy: string | null;
  closedAt: Date | null;
}

export enum QueryType {
  CLARIFICATION = "CLARIFICATION",
  MISSING_DATA = "MISSING_DATA",
  INCONSISTENCY = "INCONSISTENCY",
  PROTOCOL_DEVIATION = "PROTOCOL_DEVIATION",
}

export enum QueryStatus {
  OPEN = "OPEN",
  ANSWERED = "ANSWERED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export interface ElectronicSignature {
  id: string;
  userId: string;
  userName: string;
  role: string;
  meaning: SignatureMeaning;
  signedAt: Date;
  ipAddress: string;
  biometricHash: string | null;
  reason: string | null;
}

export enum SignatureMeaning {
  AUTHORED = "AUTHORED",
  REVIEWED = "REVIEWED",
  VERIFIED = "VERIFIED",
  APPROVED = "APPROVED",
  WITNESSED = "WITNESSED",
}

export interface FormAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: AuditAction;
  fieldName: string | null;
  oldValue: any;
  newValue: any;
  reason: string | null;
}

export enum AuditAction {
  CREATED = "CREATED",
  MODIFIED = "MODIFIED",
  DELETED = "DELETED",
  QUERIED = "QUERIED",
  QUERY_RESOLVED = "QUERY_RESOLVED",
  VERIFIED = "VERIFIED",
  LOCKED = "LOCKED",
  UNLOCKED = "UNLOCKED",
  SIGNED = "SIGNED",
  EXPORTED = "EXPORTED",
}

// ============================================================================
// Adverse Events Types
// ============================================================================

export interface AdverseEvent extends BaseEntity {
  aeNumber: string;
  trialId: string;
  subjectId: string;
  siteId: string;
  term: string;
  verbatimTerm: string;
  meddraCode: string | null;
  meddraVersion: string | null;
  category: AECategory;
  severity: AESeverity;
  seriousness: AESeriousness;
  seriousnessCriteria: SeriousnessCriteria[];
  causality: Causality;
  expectedness: Expectedness;
  outcome: AEOutcome;
  onsetDate: Date;
  resolutionDate: Date | null;
  duration: number | null; // days
  actionTaken: ActionTaken;
  treatmentRequired: boolean;
  treatment: string | null;
  narrativeSummary: string;
  reportedBy: string;
  reportedDate: Date;
  reportingRequired: boolean;
  reportedToAuthorities: boolean;
  reportDate: Date | null;
  followUpRequired: boolean;
  followUps: AEFollowUp[];
  attachments: string[];
}

export enum AECategory {
  ADVERSE_EVENT = "ADVERSE_EVENT",
  SERIOUS_ADVERSE_EVENT = "SERIOUS_ADVERSE_EVENT",
  SUSPECTED_UNEXPECTED_SERIOUS_ADVERSE_REACTION = "SUSPECTED_UNEXPECTED_SERIOUS_ADVERSE_REACTION",
  DEVICE_DEFICIENCY = "DEVICE_DEFICIENCY",
}

export enum AESeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  LIFE_THREATENING = "LIFE_THREATENING",
  FATAL = "FATAL",
}

export enum AESeriousness {
  NON_SERIOUS = "NON_SERIOUS",
  SERIOUS = "SERIOUS",
}

export enum SeriousnessCriteria {
  DEATH = "DEATH",
  LIFE_THREATENING = "LIFE_THREATENING",
  HOSPITALIZATION = "HOSPITALIZATION",
  PROLONGED_HOSPITALIZATION = "PROLONGED_HOSPITALIZATION",
  DISABILITY = "DISABILITY",
  CONGENITAL_ANOMALY = "CONGENITAL_ANOMALY",
  MEDICALLY_IMPORTANT = "MEDICALLY_IMPORTANT",
  OTHER = "OTHER",
}

export enum Causality {
  UNRELATED = "UNRELATED",
  UNLIKELY = "UNLIKELY",
  POSSIBLE = "POSSIBLE",
  PROBABLE = "PROBABLE",
  DEFINITE = "DEFINITE",
  NOT_ASSESSABLE = "NOT_ASSESSABLE",
}

export enum Expectedness {
  EXPECTED = "EXPECTED",
  UNEXPECTED = "UNEXPECTED",
}

export enum AEOutcome {
  RECOVERED = "RECOVERED",
  RECOVERING = "RECOVERING",
  NOT_RECOVERED = "NOT_RECOVERED",
  RECOVERED_WITH_SEQUELAE = "RECOVERED_WITH_SEQUELAE",
  FATAL = "FATAL",
  UNKNOWN = "UNKNOWN",
}

export enum ActionTaken {
  NONE = "NONE",
  DOSE_REDUCED = "DOSE_REDUCED",
  DOSE_INCREASED = "DOSE_INCREASED",
  DRUG_INTERRUPTED = "DRUG_INTERRUPTED",
  DRUG_WITHDRAWN = "DRUG_WITHDRAWN",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export interface AEFollowUp {
  id: string;
  followUpDate: Date;
  status: AEOutcome;
  notes: string;
  reportedBy: string;
}

// ============================================================================
// Protocol Management Types
// ============================================================================

export interface ProtocolVersion extends BaseEntity {
  versionNumber: string;
  versionDate: Date;
  effectiveDate: Date;
  expiryDate: Date | null;
  amendments: Amendment[];
  changesSummary: string;
  documentUrl: string;
  status: ProtocolStatus;
  approvals: ProtocolApproval[];
}

export enum ProtocolStatus {
  DRAFT = "DRAFT",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  SUPERSEDED = "SUPERSEDED",
  WITHDRAWN = "WITHDRAWN",
}

export interface Amendment {
  id: string;
  amendmentNumber: string;
  type: AmendmentType;
  date: Date;
  description: string;
  rationale: string;
  impactAssessment: string;
  subjectsAffected: number;
  reconsentRequired: boolean;
}

export enum AmendmentType {
  ADMINISTRATIVE = "ADMINISTRATIVE",
  SUBSTANTIAL = "SUBSTANTIAL",
  NON_SUBSTANTIAL = "NON_SUBSTANTIAL",
}

export interface ProtocolApproval {
  id: string;
  approverType: ApproverType;
  approverName: string;
  approvalDate: Date;
  expiryDate: Date | null;
  approvalNumber: string | null;
  comments: string | null;
}

export enum ApproverType {
  IRB = "IRB",
  IEC = "IEC",
  FDA = "FDA",
  EMA = "EMA",
  SPONSOR = "SPONSOR",
  MEDICAL_MONITOR = "MEDICAL_MONITOR",
}

// ============================================================================
// Randomization Types
// ============================================================================

export interface RandomizationScheme extends BaseEntity {
  trialId: string;
  method: RandomizationMethod;
  blockSize: number | null;
  allocationRatio: number[];
  stratificationFactors: StratificationFactor[];
  totalAllocations: number;
  usedAllocations: number;
  seed: string; // Encrypted
  isLocked: boolean;
  generatedBy: string;
  generatedAt: Date;
}

export enum RandomizationMethod {
  SIMPLE = "SIMPLE",
  BLOCK = "BLOCK",
  STRATIFIED = "STRATIFIED",
  ADAPTIVE = "ADAPTIVE",
  MINIMIZATION = "MINIMIZATION",
}

export interface StratificationFactor {
  name: string;
  levels: string[];
}

export interface RandomizationAssignment {
  id: string;
  subjectId: string;
  trialId: string;
  armId: string;
  assignmentNumber: string;
  assignedAt: Date;
  assignedBy: string;
  stratificationValues: Record<string, string>;
}

// ============================================================================
// Study Site Types
// ============================================================================

export interface StudySite extends BaseEntity {
  siteNumber: string;
  siteName: string;
  principalInvestigator: Investigator;
  subInvestigators: Investigator[];
  studyCoordinators: StudyCoordinator[];
  address: Address;
  contactInfo: ContactInfo;
  status: SiteStatus;
  activationDate: Date | null;
  closeoutDate: Date | null;
  targetEnrollment: number;
  actualEnrollment: number;
  regulatory: SiteRegulatory;
  performance: SitePerformance;
}

export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ContactInfo {
  phone: string;
  fax: string | null;
  email: string;
}

export enum SiteStatus {
  IDENTIFIED = "IDENTIFIED",
  FEASIBILITY = "FEASIBILITY",
  SELECTED = "SELECTED",
  INITIATED = "INITIATED",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  CLOSED = "CLOSED",
}

export interface Investigator {
  userId: string;
  name: string;
  credentials: string;
  npi: string | null;
  licenseNumber: string;
  cvOnFile: boolean;
  trainingComplete: boolean;
  gcp13Certified: boolean;
  gcp1572Signed: boolean;
}

export interface StudyCoordinator {
  userId: string;
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  trainingComplete: boolean;
}

export interface SiteRegulatory {
  irbApprovalDate: Date | null;
  irbExpiryDate: Date | null;
  irbNumber: string | null;
  contractExecuted: boolean;
  contractDate: Date | null;
  budgetApproved: boolean;
}

export interface SitePerformance {
  enrollmentRate: number;
  screenFailureRate: number;
  protocolDeviations: number;
  queryRate: number;
  dropoutRate: number;
  lastMonitoringVisit: Date | null;
}

// ============================================================================
// Regulatory & Compliance Types
// ============================================================================

export interface RegulatoryInfo {
  indNumber: string | null;
  fdaApprovalDate: Date | null;
  emaApprovalDate: Date | null;
  localApprovals: LocalApproval[];
  regulatoryDocuments: RegulatoryDocument[];
  complianceStatus: ComplianceStatus;
  inspections: RegulatoryInspection[];
}

export interface LocalApproval {
  country: string;
  authority: string;
  approvalNumber: string;
  approvalDate: Date;
  expiryDate: Date | null;
}

export interface RegulatoryDocument {
  id: string;
  type: DocumentType;
  name: string;
  version: string;
  uploadDate: Date;
  uploadedBy: string;
  url: string;
  expiryDate: Date | null;
}

export enum DocumentType {
  PROTOCOL = "PROTOCOL",
  INFORMED_CONSENT = "INFORMED_CONSENT",
  INVESTIGATORS_BROCHURE = "INVESTIGATORS_BROCHURE",
  IND = "IND",
  IRB_APPROVAL = "IRB_APPROVAL",
  CONTRACT = "CONTRACT",
  BUDGET = "BUDGET",
  CV = "CV",
  LICENSE = "LICENSE",
  GCP_CERTIFICATE = "GCP_CERTIFICATE",
  FORM_1572 = "FORM_1572",
  OTHER = "OTHER",
}

export interface ComplianceStatus {
  gcp13Compliant: boolean;
  cfr21Part11Compliant: boolean;
  hipaaCompliant: boolean;
  lastAuditDate: Date | null;
  openFindings: number;
  criticalFindings: number;
}

export interface RegulatoryInspection {
  id: string;
  authority: string;
  inspectionDate: Date;
  inspectionType: InspectionType;
  outcome: InspectionOutcome;
  findings: InspectionFinding[];
  reportUrl: string | null;
}

export enum InspectionType {
  ROUTINE = "ROUTINE",
  FOR_CAUSE = "FOR_CAUSE",
  PRE_APPROVAL = "PRE_APPROVAL",
}

export enum InspectionOutcome {
  NO_FINDINGS = "NO_FINDINGS",
  VOLUNTARY_ACTION_INDICATED = "VOLUNTARY_ACTION_INDICATED",
  OFFICIAL_ACTION_INDICATED = "OFFICIAL_ACTION_INDICATED",
}

export interface InspectionFinding {
  id: string;
  severity: FindingSeverity;
  category: string;
  description: string;
  correctiveAction: string | null;
  dueDate: Date | null;
  resolvedDate: Date | null;
}

export enum FindingSeverity {
  CRITICAL = "CRITICAL",
  MAJOR = "MAJOR",
  MINOR = "MINOR",
}

// ============================================================================
// Budget & Billing Types
// ============================================================================

export interface BudgetInfo {
  totalBudget: number;
  perSubjectCost: number;
  currency: string;
  paymentSchedule: PaymentMilestone[];
  coverage: CoverageAnalysis;
}

export interface PaymentMilestone {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  paid: boolean;
  paidDate: Date | null;
}

export interface CoverageAnalysis {
  id: string;
  trialId: string;
  procedures: ProcedureCoverage[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ProcedureCoverage {
  procedureCode: string;
  procedureName: string;
  visitType: VisitType;
  standardOfCare: boolean;
  researchOnly: boolean;
  billableToInsurance: boolean;
  billableToSponsor: boolean;
  cost: number | null;
  frequency: number;
}

// ============================================================================
// Reporting & Analytics Types
// ============================================================================

export interface TrialMetrics {
  trialId: string;
  enrollmentMetrics: EnrollmentMetrics;
  retentionMetrics: RetentionMetrics;
  safetyMetrics: SafetyMetrics;
  qualityMetrics: QualityMetrics;
  siteMetrics: SiteMetrics[];
  generatedAt: Date;
}

export interface EnrollmentMetrics {
  target: number;
  enrolled: number;
  screening: number;
  screenFailures: number;
  enrollmentRate: number;
  projectedCompletion: Date | null;
}

export interface RetentionMetrics {
  activeSubjects: number;
  completedSubjects: number;
  withdrawnSubjects: number;
  lostToFollowUp: number;
  retentionRate: number;
}

export interface SafetyMetrics {
  totalAEs: number;
  totalSAEs: number;
  totalSUSARs: number;
  deathCount: number;
  aeRate: number;
  saeRate: number;
}

export interface QualityMetrics {
  protocolDeviations: number;
  openQueries: number;
  resolvedQueries: number;
  queryRate: number;
  dataCompleteness: number;
  verificationRate: number;
}

export interface SiteMetrics {
  siteId: string;
  siteName: string;
  enrollment: number;
  screenFailures: number;
  dropouts: number;
  protocolDeviations: number;
  queryRate: number;
}

// ============================================================================
// Trial Contact & Document Types
// ============================================================================

export interface TrialContact {
  id: string;
  role: ContactRole;
  name: string;
  organization: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export enum ContactRole {
  SPONSOR = "SPONSOR",
  MEDICAL_MONITOR = "MEDICAL_MONITOR",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  DATA_MANAGER = "DATA_MANAGER",
  SAFETY_OFFICER = "SAFETY_OFFICER",
  REGULATORY_AFFAIRS = "REGULATORY_AFFAIRS",
  BIOSTATISTICIAN = "BIOSTATISTICIAN",
}

export interface TrialDocument {
  id: string;
  type: DocumentType;
  name: string;
  version: string;
  uploadDate: Date;
  uploadedBy: string;
  url: string;
  size: number;
  expiryDate: Date | null;
}

export interface EnrollmentInfo {
  targetEnrollment: number;
  currentEnrollment: number;
  screeningCount: number;
  enrollmentStart: Date | null;
  enrollmentEnd: Date | null;
  lastEnrollmentDate: Date | null;
}

export interface TrialTimeline {
  plannedStart: Date;
  actualStart: Date | null;
  plannedEnd: Date;
  actualEnd: Date | null;
  milestones: TrialMilestone[];
}

export interface TrialMilestone {
  id: string;
  name: string;
  description: string;
  plannedDate: Date;
  actualDate: Date | null;
  status: MilestoneStatus;
}

export enum MilestoneStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DELAYED = "DELAYED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// CDISC Standards Support
// ============================================================================

export interface CDISCMapping {
  domain: SDTMDomain;
  variable: string;
  fieldId: string;
  transformation: string | null;
}

export enum SDTMDomain {
  DM = "DM", // Demographics
  AE = "AE", // Adverse Events
  CM = "CM", // Concomitant Medications
  DS = "DS", // Disposition
  EX = "EX", // Exposure
  LB = "LB", // Laboratory
  MH = "MH", // Medical History
  PE = "PE", // Physical Exam
  VS = "VS", // Vital Signs
  QS = "QS", // Questionnaires
  SV = "SV", // Subject Visits
  SE = "SE", // Subject Elements
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface TrialSearchParams {
  query?: string;
  phase?: TrialPhase[];
  status?: TrialStatus[];
  type?: TrialType[];
  indication?: string;
  sponsorName?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SubjectSearchParams {
  trialId?: string;
  siteId?: string;
  status?: SubjectStatus[];
  armId?: string;
  enrollmentDateFrom?: Date;
  enrollmentDateTo?: Date;
  page?: number;
  limit?: number;
}
