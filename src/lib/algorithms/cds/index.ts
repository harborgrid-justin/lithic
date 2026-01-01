/**
 * CDS Algorithms - Index
 * Export all Clinical Decision Support algorithms
 */

// Engine
export { AdvancedCDSEngine, advancedCDSEngine } from './engine';
export type { PriorityScore, SuppressionRule, CDSPerformanceMetrics } from './engine';

// Drug Interactions
export { DrugInteractionChecker, drugInteractionChecker, checkDrugInteractions } from './drug-interactions';
export {
  InteractionSeverity,
  InteractionMechanism,
  CYP450Enzyme,
} from './drug-interactions';
export type {
  DrugInteraction,
  AlternativeMedication,
  RenalFunction,
  HepaticFunction,
  Medication,
} from './drug-interactions';

// Sepsis Prediction
export { SepsisPredictionEngine, sepsisPredictionEngine, assessSepsisRisk } from './sepsis-prediction';
export type {
  VitalSigns,
  SepsisLabValues,
  SIRSResult,
  qSOFAResult,
  NEWS2Result,
  MEWSResult,
  SOFAResult,
  SepsisPrediction,
  SepsisAssessment,
  SepsisAlert,
} from './sepsis-prediction';

// Order Sets
export { OrderSetEngine, orderSetEngine } from './order-sets';
export { OrderType, OrderPriority } from './order-sets';
export type {
  ClinicalOrder,
  OrderSetTemplate,
  OrderGroup,
  OrderContext,
  GeneratedOrderSet,
  OrderAdjustment,
  OrderWarning,
} from './order-sets';

// Quality Measures
export { QualityMeasuresEngine, qualityMeasuresEngine } from './quality-measures';
export { MeasureCategory, MeasureStatus } from './quality-measures';
export type {
  QualityMeasure,
  MeasureCriteria,
  MeasureCondition,
  PatientMeasureData,
  MeasureResult,
  QualityGap,
  PopulationQualityReport,
} from './quality-measures';

// Allergy Alerts
export { AllergyAlertSystem, allergyAlertSystem, checkMedicationAllergies } from './allergy-alerts';
export {
  AllergySeverity,
  AllergyReactionType,
  DrugClass,
} from './allergy-alerts';
export type {
  PatientAllergy,
  OrderedMedication,
  AllergyAlert,
} from './allergy-alerts';

// Dosing
export { DosingCalculator, dosingCalculator, calculateMedicationDose } from './dosing';
export { BSAMethod, GFRMethod } from './dosing';
export type {
  PatientDemographics,
  MedicationDosingParams,
  DoseCalculationResult,
  DoseAdjustment,
} from './dosing';
