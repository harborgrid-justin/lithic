/**
 * FHIR R4 Resource Type Definitions
 * Complete FHIR R4 type definitions for Lithic Enterprise Healthcare Platform
 * Based on HL7 FHIR R4 Specification
 */

// Base FHIR Types
export type FHIRVersion = "4.0.1";
export type ResourceType =
  | "Patient"
  | "Observation"
  | "Condition"
  | "MedicationRequest"
  | "MedicationAdministration"
  | "Encounter"
  | "Procedure"
  | "AllergyIntolerance"
  | "Immunization"
  | "DiagnosticReport"
  | "DocumentReference"
  | "CarePlan"
  | "Goal"
  | "Appointment"
  | "Schedule"
  | "Slot"
  | "Practitioner"
  | "PractitionerRole"
  | "Organization"
  | "Location"
  | "Device"
  | "Medication"
  | "Substance"
  | "ServiceRequest"
  | "Task"
  | "Communication"
  | "Coverage"
  | "Claim"
  | "ExplanationOfBenefit"
  | "Bundle"
  | "OperationOutcome"
  | "CapabilityStatement";

export type NarrativeStatus = "generated" | "extensions" | "additional" | "empty";

export type PublicationStatus = "draft" | "active" | "retired" | "unknown";

export type AdministrativeGender = "male" | "female" | "other" | "unknown";

export type ObservationStatus =
  | "registered"
  | "preliminary"
  | "final"
  | "amended"
  | "corrected"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export type EncounterStatus =
  | "planned"
  | "arrived"
  | "triaged"
  | "in-progress"
  | "onleave"
  | "finished"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export type MedicationRequestStatus =
  | "active"
  | "on-hold"
  | "cancelled"
  | "completed"
  | "entered-in-error"
  | "stopped"
  | "draft"
  | "unknown";

export type AllergyIntoleranceCategory = "food" | "medication" | "environment" | "biologic";

export type AllergyIntoleranceCriticality = "low" | "high" | "unable-to-assess";

export type AllergyIntoleranceType = "allergy" | "intolerance";

// Base Resource Interface
export interface Resource {
  resourceType: ResourceType;
  id?: string;
  meta?: Meta;
  implicitRules?: string;
  language?: string;
}

export interface DomainResource extends Resource {
  text?: Narrative;
  contained?: Resource[];
  extension?: Extension[];
  modifierExtension?: Extension[];
}

// Core Data Types
export interface Meta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: Coding[];
  tag?: Coding[];
}

export interface Narrative {
  status: NarrativeStatus;
  div: string;
}

export interface Extension {
  url: string;
  valueString?: string;
  valueInteger?: number;
  valueBoolean?: boolean;
  valueDate?: string;
  valueDateTime?: string;
  valueCode?: string;
  valueCoding?: Coding;
  valueCodeableConcept?: CodeableConcept;
  valueReference?: Reference;
  valueQuantity?: Quantity;
}

export interface Identifier {
  use?: "usual" | "official" | "temp" | "secondary" | "old";
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface Reference {
  reference?: string;
  type?: ResourceType;
  identifier?: Identifier;
  display?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Quantity {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
}

export interface Range {
  low?: Quantity;
  high?: Quantity;
}

export interface Ratio {
  numerator?: Quantity;
  denominator?: Quantity;
}

export interface HumanName {
  use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

export interface Address {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
}

export interface ContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
  period?: Period;
}

export interface Attachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text: string;
}

export interface Dosage {
  sequence?: number;
  text?: string;
  additionalInstruction?: CodeableConcept[];
  patientInstruction?: string;
  timing?: Timing;
  asNeededBoolean?: boolean;
  asNeededCodeableConcept?: CodeableConcept;
  site?: CodeableConcept;
  route?: CodeableConcept;
  method?: CodeableConcept;
  doseAndRate?: DoseAndRate[];
  maxDosePerPeriod?: Ratio;
  maxDosePerAdministration?: Quantity;
  maxDosePerLifetime?: Quantity;
}

export interface DoseAndRate {
  type?: CodeableConcept;
  doseRange?: Range;
  doseQuantity?: Quantity;
  rateRatio?: Ratio;
  rateRange?: Range;
  rateQuantity?: Quantity;
}

export interface Timing {
  event?: string[];
  repeat?: TimingRepeat;
  code?: CodeableConcept;
}

export interface TimingRepeat {
  boundsDuration?: Duration;
  boundsRange?: Range;
  boundsPeriod?: Period;
  count?: number;
  countMax?: number;
  duration?: number;
  durationMax?: number;
  durationUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  frequency?: number;
  frequencyMax?: number;
  period?: number;
  periodMax?: number;
  periodUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  dayOfWeek?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  timeOfDay?: string[];
  when?: string[];
  offset?: number;
}

export interface Duration extends Quantity {}

export interface SampledData {
  origin: Quantity;
  period: number;
  factor?: number;
  lowerLimit?: number;
  upperLimit?: number;
  dimensions: number;
  data?: string;
}

// Resource Definitions

export interface Patient extends DomainResource {
  resourceType: "Patient";
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: AdministrativeGender;
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  photo?: Attachment[];
  contact?: PatientContact[];
  communication?: PatientCommunication[];
  generalPractitioner?: Reference[];
  managingOrganization?: Reference;
  link?: PatientLink[];
}

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
  gender?: AdministrativeGender;
  organization?: Reference;
  period?: Period;
}

export interface PatientCommunication {
  language: CodeableConcept;
  preferred?: boolean;
}

export interface PatientLink {
  other: Reference;
  type: "replaced-by" | "replaces" | "refer" | "seealso";
}

export interface Observation extends DomainResource {
  resourceType: "Observation";
  identifier?: Identifier[];
  basedOn?: Reference[];
  partOf?: Reference[];
  status: ObservationStatus;
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  focus?: Reference[];
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  effectiveTiming?: Timing;
  effectiveInstant?: string;
  issued?: string;
  performer?: Reference[];
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: Range;
  valueRatio?: Ratio;
  valueSampledData?: SampledData;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  note?: Annotation[];
  bodySite?: CodeableConcept;
  method?: CodeableConcept;
  specimen?: Reference;
  device?: Reference;
  referenceRange?: ObservationReferenceRange[];
  hasMember?: Reference[];
  derivedFrom?: Reference[];
  component?: ObservationComponent[];
}

export interface ObservationReferenceRange {
  low?: Quantity;
  high?: Quantity;
  type?: CodeableConcept;
  appliesTo?: CodeableConcept[];
  age?: Range;
  text?: string;
}

export interface ObservationComponent {
  code: CodeableConcept;
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: Range;
  valueRatio?: Ratio;
  valueSampledData?: SampledData;
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: Period;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  referenceRange?: ObservationReferenceRange[];
}

export interface Condition extends DomainResource {
  resourceType: "Condition";
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: Quantity;
  onsetPeriod?: Period;
  onsetRange?: Range;
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: Quantity;
  abatementPeriod?: Period;
  abatementRange?: Range;
  abatementString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  stage?: ConditionStage[];
  evidence?: ConditionEvidence[];
  note?: Annotation[];
}

export interface ConditionStage {
  summary?: CodeableConcept;
  assessment?: Reference[];
  type?: CodeableConcept;
}

export interface ConditionEvidence {
  code?: CodeableConcept[];
  detail?: Reference[];
}

export interface MedicationRequest extends DomainResource {
  resourceType: "MedicationRequest";
  identifier?: Identifier[];
  status: MedicationRequestStatus;
  statusReason?: CodeableConcept;
  intent: "proposal" | "plan" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
  category?: CodeableConcept[];
  priority?: "routine" | "urgent" | "asap" | "stat";
  doNotPerform?: boolean;
  reportedBoolean?: boolean;
  reportedReference?: Reference;
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject: Reference;
  encounter?: Reference;
  supportingInformation?: Reference[];
  authoredOn?: string;
  requester?: Reference;
  performer?: Reference;
  performerType?: CodeableConcept;
  recorder?: Reference;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  instantiatesCanonical?: string[];
  instantiatesUri?: string[];
  basedOn?: Reference[];
  groupIdentifier?: Identifier;
  courseOfTherapyType?: CodeableConcept;
  insurance?: Reference[];
  note?: Annotation[];
  dosageInstruction?: Dosage[];
  dispenseRequest?: MedicationRequestDispenseRequest;
  substitution?: MedicationRequestSubstitution;
  priorPrescription?: Reference;
  detectedIssue?: Reference[];
  eventHistory?: Reference[];
}

export interface MedicationRequestDispenseRequest {
  initialFill?: {
    quantity?: Quantity;
    duration?: Duration;
  };
  dispenseInterval?: Duration;
  validityPeriod?: Period;
  numberOfRepeatsAllowed?: number;
  quantity?: Quantity;
  expectedSupplyDuration?: Duration;
  performer?: Reference;
}

export interface MedicationRequestSubstitution {
  allowedBoolean?: boolean;
  allowedCodeableConcept?: CodeableConcept;
  reason?: CodeableConcept;
}

export interface AllergyIntolerance extends DomainResource {
  resourceType: "AllergyIntolerance";
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: AllergyIntoleranceType;
  category?: AllergyIntoleranceCategory[];
  criticality?: AllergyIntoleranceCriticality;
  code?: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: Quantity;
  onsetPeriod?: Period;
  onsetRange?: Range;
  onsetString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  lastOccurrence?: string;
  note?: Annotation[];
  reaction?: AllergyIntoleranceReaction[];
}

export interface AllergyIntoleranceReaction {
  substance?: CodeableConcept;
  manifestation: CodeableConcept[];
  description?: string;
  onset?: string;
  severity?: "mild" | "moderate" | "severe";
  exposureRoute?: CodeableConcept;
  note?: Annotation[];
}

export interface Encounter extends DomainResource {
  resourceType: "Encounter";
  identifier?: Identifier[];
  status: EncounterStatus;
  statusHistory?: EncounterStatusHistory[];
  class: Coding;
  classHistory?: EncounterClassHistory[];
  type?: CodeableConcept[];
  serviceType?: CodeableConcept;
  priority?: CodeableConcept;
  subject?: Reference;
  episodeOfCare?: Reference[];
  basedOn?: Reference[];
  participant?: EncounterParticipant[];
  appointment?: Reference[];
  period?: Period;
  length?: Duration;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  diagnosis?: EncounterDiagnosis[];
  account?: Reference[];
  hospitalization?: EncounterHospitalization;
  location?: EncounterLocation[];
  serviceProvider?: Reference;
  partOf?: Reference;
}

export interface EncounterStatusHistory {
  status: EncounterStatus;
  period: Period;
}

export interface EncounterClassHistory {
  class: Coding;
  period: Period;
}

export interface EncounterParticipant {
  type?: CodeableConcept[];
  period?: Period;
  individual?: Reference;
}

export interface EncounterDiagnosis {
  condition: Reference;
  use?: CodeableConcept;
  rank?: number;
}

export interface EncounterHospitalization {
  preAdmissionIdentifier?: Identifier;
  origin?: Reference;
  admitSource?: CodeableConcept;
  reAdmission?: CodeableConcept;
  dietPreference?: CodeableConcept[];
  specialCourtesy?: CodeableConcept[];
  specialArrangement?: CodeableConcept[];
  destination?: Reference;
  dischargeDisposition?: CodeableConcept;
}

export interface EncounterLocation {
  location: Reference;
  status?: "planned" | "active" | "reserved" | "completed";
  physicalType?: CodeableConcept;
  period?: Period;
}

export interface Procedure extends DomainResource {
  resourceType: "Procedure";
  identifier?: Identifier[];
  instantiatesCanonical?: string[];
  instantiatesUri?: string[];
  basedOn?: Reference[];
  partOf?: Reference[];
  status: "preparation" | "in-progress" | "not-done" | "on-hold" | "stopped" | "completed" | "entered-in-error" | "unknown";
  statusReason?: CodeableConcept;
  category?: CodeableConcept;
  code?: CodeableConcept;
  subject: Reference;
  encounter?: Reference;
  performedDateTime?: string;
  performedPeriod?: Period;
  performedString?: string;
  performedAge?: Quantity;
  performedRange?: Range;
  recorder?: Reference;
  asserter?: Reference;
  performer?: ProcedurePerformer[];
  location?: Reference;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  bodySite?: CodeableConcept[];
  outcome?: CodeableConcept;
  report?: Reference[];
  complication?: CodeableConcept[];
  complicationDetail?: Reference[];
  followUp?: CodeableConcept[];
  note?: Annotation[];
  focalDevice?: ProcedureFocalDevice[];
  usedReference?: Reference[];
  usedCode?: CodeableConcept[];
}

export interface ProcedurePerformer {
  function?: CodeableConcept;
  actor: Reference;
  onBehalfOf?: Reference;
}

export interface ProcedureFocalDevice {
  action?: CodeableConcept;
  manipulated: Reference;
}

export interface DiagnosticReport extends DomainResource {
  resourceType: "DiagnosticReport";
  identifier?: Identifier[];
  basedOn?: Reference[];
  status: "registered" | "partial" | "preliminary" | "final" | "amended" | "corrected" | "appended" | "cancelled" | "entered-in-error" | "unknown";
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  performer?: Reference[];
  resultsInterpreter?: Reference[];
  specimen?: Reference[];
  result?: Reference[];
  imagingStudy?: Reference[];
  media?: DiagnosticReportMedia[];
  conclusion?: string;
  conclusionCode?: CodeableConcept[];
  presentedForm?: Attachment[];
}

export interface DiagnosticReportMedia {
  comment?: string;
  link: Reference;
}

export interface Bundle extends Resource {
  resourceType: "Bundle";
  identifier?: Identifier;
  type: "document" | "message" | "transaction" | "transaction-response" | "batch" | "batch-response" | "history" | "searchset" | "collection";
  timestamp?: string;
  total?: number;
  link?: BundleLink[];
  entry?: BundleEntry[];
  signature?: Signature;
}

export interface BundleLink {
  relation: string;
  url: string;
}

export interface BundleEntry {
  link?: BundleLink[];
  fullUrl?: string;
  resource?: Resource;
  search?: BundleEntrySearch;
  request?: BundleEntryRequest;
  response?: BundleEntryResponse;
}

export interface BundleEntrySearch {
  mode?: "match" | "include" | "outcome";
  score?: number;
}

export interface BundleEntryRequest {
  method: "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifMatch?: string;
  ifNoneExist?: string;
}

export interface BundleEntryResponse {
  status: string;
  location?: string;
  etag?: string;
  lastModified?: string;
  outcome?: Resource;
}

export interface Signature {
  type: Coding[];
  when: string;
  who: Reference;
  onBehalfOf?: Reference;
  targetFormat?: string;
  sigFormat?: string;
  data?: string;
}

export interface OperationOutcome extends DomainResource {
  resourceType: "OperationOutcome";
  issue: OperationOutcomeIssue[];
}

export interface OperationOutcomeIssue {
  severity: "fatal" | "error" | "warning" | "information";
  code: string;
  details?: CodeableConcept;
  diagnostics?: string;
  location?: string[];
  expression?: string[];
}

export interface CapabilityStatement extends DomainResource {
  resourceType: "CapabilityStatement";
  url?: string;
  version?: string;
  name?: string;
  title?: string;
  status: PublicationStatus;
  experimental?: boolean;
  date: string;
  publisher?: string;
  contact?: ContactDetail[];
  description?: string;
  useContext?: UsageContext[];
  jurisdiction?: CodeableConcept[];
  purpose?: string;
  copyright?: string;
  kind: "instance" | "capability" | "requirements";
  instantiates?: string[];
  imports?: string[];
  software?: CapabilityStatementSoftware;
  implementation?: CapabilityStatementImplementation;
  fhirVersion: FHIRVersion;
  format: string[];
  patchFormat?: string[];
  implementationGuide?: string[];
  rest?: CapabilityStatementRest[];
  messaging?: CapabilityStatementMessaging[];
  document?: CapabilityStatementDocument[];
}

export interface ContactDetail {
  name?: string;
  telecom?: ContactPoint[];
}

export interface UsageContext {
  code: Coding;
  valueCodeableConcept?: CodeableConcept;
  valueQuantity?: Quantity;
  valueRange?: Range;
  valueReference?: Reference;
}

export interface CapabilityStatementSoftware {
  name: string;
  version?: string;
  releaseDate?: string;
}

export interface CapabilityStatementImplementation {
  description: string;
  url?: string;
  custodian?: Reference;
}

export interface CapabilityStatementRest {
  mode: "client" | "server";
  documentation?: string;
  security?: CapabilityStatementRestSecurity;
  resource?: CapabilityStatementRestResource[];
  interaction?: CapabilityStatementRestInteraction[];
  searchParam?: CapabilityStatementRestResourceSearchParam[];
  operation?: CapabilityStatementRestResourceOperation[];
  compartment?: string[];
}

export interface CapabilityStatementRestSecurity {
  cors?: boolean;
  service?: CodeableConcept[];
  description?: string;
}

export interface CapabilityStatementRestResource {
  type: ResourceType;
  profile?: string;
  supportedProfile?: string[];
  documentation?: string;
  interaction?: CapabilityStatementRestResourceInteraction[];
  versioning?: "no-version" | "versioned" | "versioned-update";
  readHistory?: boolean;
  updateCreate?: boolean;
  conditionalCreate?: boolean;
  conditionalRead?: "not-supported" | "modified-since" | "not-match" | "full-support";
  conditionalUpdate?: boolean;
  conditionalDelete?: "not-supported" | "single" | "multiple";
  referencePolicy?: ("literal" | "logical" | "resolves" | "enforced" | "local")[];
  searchInclude?: string[];
  searchRevInclude?: string[];
  searchParam?: CapabilityStatementRestResourceSearchParam[];
  operation?: CapabilityStatementRestResourceOperation[];
}

export interface CapabilityStatementRestResourceInteraction {
  code: "read" | "vread" | "update" | "patch" | "delete" | "history-instance" | "history-type" | "create" | "search-type";
  documentation?: string;
}

export interface CapabilityStatementRestResourceSearchParam {
  name: string;
  definition?: string;
  type: "number" | "date" | "string" | "token" | "reference" | "composite" | "quantity" | "uri" | "special";
  documentation?: string;
}

export interface CapabilityStatementRestResourceOperation {
  name: string;
  definition: string;
  documentation?: string;
}

export interface CapabilityStatementRestInteraction {
  code: "transaction" | "batch" | "search-system" | "history-system";
  documentation?: string;
}

export interface CapabilityStatementMessaging {
  endpoint?: CapabilityStatementMessagingEndpoint[];
  reliableCache?: number;
  documentation?: string;
  supportedMessage?: CapabilityStatementMessagingSupportedMessage[];
}

export interface CapabilityStatementMessagingEndpoint {
  protocol: Coding;
  address: string;
}

export interface CapabilityStatementMessagingSupportedMessage {
  mode: "sender" | "receiver";
  definition: string;
}

export interface CapabilityStatementDocument {
  mode: "producer" | "consumer";
  documentation?: string;
  profile: string;
}

// Search Parameters
export interface FHIRSearchParams {
  _id?: string;
  _lastUpdated?: string;
  _tag?: string;
  _profile?: string;
  _security?: string;
  _text?: string;
  _content?: string;
  _list?: string;
  _has?: string;
  _type?: string;
  _sort?: string;
  _count?: number;
  _include?: string[];
  _revinclude?: string[];
  _summary?: "true" | "text" | "data" | "count" | "false";
  _total?: "none" | "estimate" | "accurate";
  _elements?: string[];
  _contained?: "true" | "false" | "both";
  _containedType?: "container" | "contained";
  [key: string]: any;
}

// Subscription Resource
export interface Subscription extends DomainResource {
  resourceType: "Subscription";
  status: "requested" | "active" | "error" | "off";
  contact?: ContactPoint[];
  end?: string;
  reason: string;
  criteria: string;
  error?: string;
  channel: SubscriptionChannel;
}

export interface SubscriptionChannel {
  type: "rest-hook" | "websocket" | "email" | "sms" | "message";
  endpoint?: string;
  payload?: string;
  header?: string[];
}
