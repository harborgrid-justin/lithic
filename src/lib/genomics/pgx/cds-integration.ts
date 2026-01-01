/**
 * Clinical Decision Support (CDS) Integration for Pharmacogenomics
 * Integrates PGx data with EHR for real-time drug alerts and recommendations
 * Implements CDS Hooks and HL7 FHIR standards
 */

import { StarAlleleCall } from './star-allele-caller';
import { CPICRecommendation } from './cpic-engine';
import { PGxDrug } from './drug-database';

export interface CDSAlert {
  id: string;
  summary: string;
  indicator: 'critical' | 'warning' | 'info';
  source: CDSSource;
  card: CDSCard;
  timestamp: string;
  patientId: string;
}

export interface CDSCard {
  uuid: string;
  summary: string;
  detail: string;
  indicator: 'critical' | 'warning' | 'info';
  source: CDSSource;
  suggestions: CDSSuggestion[];
  selectionBehavior?: 'at-most-one' | 'any';
  links?: CDSLink[];
}

export interface CDSSource {
  label: string;
  url?: string;
  icon?: string;
  topic?: {
    system: string;
    code: string;
    display: string;
  };
}

export interface CDSSuggestion {
  label: string;
  uuid: string;
  isRecommended?: boolean;
  actions?: CDSAction[];
}

export interface CDSAction {
  type: 'create' | 'update' | 'delete';
  description: string;
  resource?: any; // FHIR resource
}

export interface CDSLink {
  label: string;
  url: string;
  type: 'absolute' | 'smart';
}

export interface DrugOrderContext {
  patientId: string;
  drugName: string;
  drugCode?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  indication?: string;
  orderId?: string;
}

export interface PGxContext {
  patientId: string;
  starAlleleCalls: StarAlleleCall[];
  lastUpdated: string;
  testingLab?: string;
  reportId?: string;
}

export class CDSIntegration {
  /**
   * Process drug order and generate PGx alerts
   */
  static async processDrugOrder(
    order: DrugOrderContext,
    pgxContext: PGxContext,
    cpicRecommendations: CPICRecommendation[]
  ): Promise<CDSAlert[]> {
    const alerts: CDSAlert[] = [];

    // Find relevant recommendations for this drug
    const relevantRecommendations = cpicRecommendations.filter(
      (rec) => rec.drug.toLowerCase() === order.drugName.toLowerCase()
    );

    if (relevantRecommendations.length === 0) {
      return alerts;
    }

    // Generate alerts for each recommendation
    for (const rec of relevantRecommendations) {
      const alert = this.createAlert(order, pgxContext, rec);
      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Create CDS alert from CPIC recommendation
   */
  private static createAlert(
    order: DrugOrderContext,
    pgxContext: PGxContext,
    recommendation: CPICRecommendation
  ): CDSAlert | null {
    const indicator = this.determineIndicator(recommendation);
    const card = this.createCard(order, pgxContext, recommendation);

    return {
      id: `pgx-alert-${order.patientId}-${Date.now()}`,
      summary: this.generateAlertSummary(recommendation),
      indicator,
      source: {
        label: 'CPIC Pharmacogenomics',
        url: recommendation.references[0],
        topic: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'PGNC',
          display: 'Pharmacogenomics',
        },
      },
      card,
      timestamp: new Date().toISOString(),
      patientId: order.patientId,
    };
  }

  /**
   * Determine alert indicator level
   */
  private static determineIndicator(
    recommendation: CPICRecommendation
  ): 'critical' | 'warning' | 'info' {
    if (recommendation.dosageAdjustment?.type === 'avoid') {
      return 'critical';
    }

    if (recommendation.classification === 'strong') {
      if (
        recommendation.dosageAdjustment?.type === 'alternative' ||
        recommendation.dosageAdjustment?.type === 'decrease'
      ) {
        return 'warning';
      }
    }

    return 'info';
  }

  /**
   * Generate alert summary
   */
  private static generateAlertSummary(recommendation: CPICRecommendation): string {
    const action = recommendation.dosageAdjustment?.type || 'consider';

    switch (action) {
      case 'avoid':
        return `AVOID ${recommendation.drug} - ${recommendation.gene} ${recommendation.phenotype}`;
      case 'alternative':
        return `Consider alternative to ${recommendation.drug} - ${recommendation.gene} ${recommendation.phenotype}`;
      case 'decrease':
        return `Reduce ${recommendation.drug} dose - ${recommendation.gene} ${recommendation.phenotype}`;
      case 'increase':
        return `Increase ${recommendation.drug} dose - ${recommendation.gene} ${recommendation.phenotype}`;
      default:
        return `Pharmacogenomic information available for ${recommendation.drug}`;
    }
  }

  /**
   * Create CDS card with detailed information
   */
  private static createCard(
    order: DrugOrderContext,
    pgxContext: PGxContext,
    recommendation: CPICRecommendation
  ): CDSCard {
    const suggestions = this.generateSuggestions(order, recommendation);
    const links = this.generateLinks(recommendation);

    return {
      uuid: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      summary: this.generateAlertSummary(recommendation),
      detail: this.generateDetailedMessage(order, pgxContext, recommendation),
      indicator: this.determineIndicator(recommendation),
      source: {
        label: 'CPIC Pharmacogenomics',
        url: recommendation.references[0],
      },
      suggestions,
      selectionBehavior: 'at-most-one',
      links,
    };
  }

  /**
   * Generate detailed alert message
   */
  private static generateDetailedMessage(
    order: DrugOrderContext,
    pgxContext: PGxContext,
    recommendation: CPICRecommendation
  ): string {
    const lines: string[] = [];

    lines.push(`**Pharmacogenomic Alert for ${order.drugName}**`);
    lines.push('');
    lines.push(`**Gene:** ${recommendation.gene}`);
    lines.push(`**Phenotype:** ${recommendation.phenotype}`);
    lines.push(`**Classification:** ${recommendation.classification.toUpperCase()}`);
    lines.push(`**Evidence Level:** CPIC Level ${recommendation.evidenceLevel}`);
    lines.push('');

    lines.push('**Clinical Implication:**');
    lines.push(recommendation.implication);
    lines.push('');

    lines.push('**Recommendation:**');
    lines.push(recommendation.recommendation);
    lines.push('');

    if (recommendation.dosageAdjustment) {
      lines.push('**Dosage Guidance:**');

      if (recommendation.dosageAdjustment.specificDose) {
        lines.push(`- Recommended dose: ${recommendation.dosageAdjustment.specificDose}`);
      }

      if (recommendation.dosageAdjustment.percentage) {
        lines.push(
          `- Adjust dose by ${recommendation.dosageAdjustment.percentage}% (${recommendation.dosageAdjustment.type})`
        );
      }

      if (recommendation.dosageAdjustment.monitoringRequired) {
        lines.push('- Enhanced monitoring required');
        if (recommendation.dosageAdjustment.frequency) {
          lines.push(`- Monitoring frequency: ${recommendation.dosageAdjustment.frequency}`);
        }
      }

      lines.push('');
    }

    if (recommendation.alternatives && recommendation.alternatives.length > 0) {
      lines.push('**Alternative Medications:**');
      for (const alt of recommendation.alternatives) {
        lines.push(`- ${alt}`);
      }
      lines.push('');
    }

    lines.push('**Genetic Test Information:**');
    lines.push(`- Last Updated: ${pgxContext.lastUpdated}`);
    if (pgxContext.testingLab) {
      lines.push(`- Testing Lab: ${pgxContext.testingLab}`);
    }
    if (pgxContext.reportId) {
      lines.push(`- Report ID: ${pgxContext.reportId}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate actionable suggestions
   */
  private static generateSuggestions(
    order: DrugOrderContext,
    recommendation: CPICRecommendation
  ): CDSSuggestion[] {
    const suggestions: CDSSuggestion[] = [];

    // Suggestion 1: Cancel current order (for avoid/alternative)
    if (
      recommendation.dosageAdjustment?.type === 'avoid' ||
      recommendation.dosageAdjustment?.type === 'alternative'
    ) {
      suggestions.push({
        label: `Cancel ${order.drugName} order`,
        uuid: `sugg-cancel-${Date.now()}`,
        isRecommended: true,
        actions: [
          {
            type: 'delete',
            description: `Cancel ${order.drugName} order due to pharmacogenomic contraindication`,
          },
        ],
      });
    }

    // Suggestion 2: Order alternative medication
    if (recommendation.alternatives && recommendation.alternatives.length > 0) {
      for (const alternative of recommendation.alternatives.slice(0, 3)) {
        suggestions.push({
          label: `Order ${alternative} instead`,
          uuid: `sugg-alt-${alternative}-${Date.now()}`,
          isRecommended: recommendation.dosageAdjustment?.type === 'alternative',
          actions: [
            {
              type: 'create',
              description: `Create order for ${alternative} as pharmacogenomic alternative`,
            },
          ],
        });
      }
    }

    // Suggestion 3: Adjust dose
    if (
      recommendation.dosageAdjustment?.type === 'decrease' ||
      recommendation.dosageAdjustment?.type === 'increase'
    ) {
      const adjustmentText = recommendation.dosageAdjustment.specificDose ||
        `${recommendation.dosageAdjustment.type} by ${recommendation.dosageAdjustment.percentage}%`;

      suggestions.push({
        label: `Adjust dose: ${adjustmentText}`,
        uuid: `sugg-adjust-${Date.now()}`,
        isRecommended: true,
        actions: [
          {
            type: 'update',
            description: `Adjust ${order.drugName} dose based on pharmacogenomic recommendation`,
          },
        ],
      });
    }

    // Suggestion 4: Proceed with monitoring
    if (
      recommendation.dosageAdjustment?.monitoringRequired &&
      suggestions.length === 0
    ) {
      suggestions.push({
        label: 'Proceed with enhanced monitoring',
        uuid: `sugg-monitor-${Date.now()}`,
        isRecommended: false,
        actions: [
          {
            type: 'create',
            description: `Add monitoring protocol for ${order.drugName}`,
          },
        ],
      });
    }

    // Suggestion 5: Consult pharmacist/clinical pharmacology
    if (recommendation.classification === 'strong') {
      suggestions.push({
        label: 'Consult clinical pharmacology',
        uuid: `sugg-consult-${Date.now()}`,
        isRecommended: false,
        actions: [
          {
            type: 'create',
            description: 'Create pharmacology consultation order',
          },
        ],
      });
    }

    return suggestions;
  }

  /**
   * Generate reference links
   */
  private static generateLinks(recommendation: CPICRecommendation): CDSLink[] {
    const links: CDSLink[] = [];

    // CPIC guideline
    if (recommendation.references[0]) {
      links.push({
        label: 'View CPIC Guideline',
        url: recommendation.references[0],
        type: 'absolute',
      });
    }

    // PharmGKB
    links.push({
      label: 'View PharmGKB Gene-Drug Information',
      url: `https://www.pharmgkb.org/gene/${recommendation.gene}`,
      type: 'absolute',
    });

    // FDA drug label
    links.push({
      label: 'View FDA Drug Label',
      url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${recommendation.drug}`,
      type: 'absolute',
    });

    return links;
  }

  /**
   * Process medication list and generate alerts
   */
  static async processMedicationList(
    medications: DrugOrderContext[],
    pgxContext: PGxContext,
    cpicRecommendations: CPICRecommendation[]
  ): Promise<CDSAlert[]> {
    const allAlerts: CDSAlert[] = [];

    for (const medication of medications) {
      const alerts = await this.processDrugOrder(
        medication,
        pgxContext,
        cpicRecommendations
      );
      allAlerts.push(...alerts);
    }

    // Sort by priority (critical first)
    return this.prioritizeAlerts(allAlerts);
  }

  /**
   * Prioritize alerts by severity and classification
   */
  private static prioritizeAlerts(alerts: CDSAlert[]): CDSAlert[] {
    return [...alerts].sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.indicator] - severityOrder[b.indicator];
    });
  }

  /**
   * Generate CDS Hooks response
   */
  static generateCDSHooksResponse(alerts: CDSAlert[]): {
    cards: CDSCard[];
  } {
    return {
      cards: alerts.map((alert) => alert.card),
    };
  }

  /**
   * Format alert for EHR display
   */
  static formatAlertForEHR(alert: CDSAlert): string {
    const lines: string[] = [];

    lines.push(`[${alert.indicator.toUpperCase()}] ${alert.summary}`);
    lines.push('');
    lines.push(alert.card.detail);
    lines.push('');

    if (alert.card.suggestions.length > 0) {
      lines.push('SUGGESTED ACTIONS:');
      for (const suggestion of alert.card.suggestions) {
        const recommended = suggestion.isRecommended ? '[RECOMMENDED] ' : '';
        lines.push(`- ${recommended}${suggestion.label}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Create passive monitoring alert
   */
  static createMonitoringAlert(
    patientId: string,
    starAlleleCalls: StarAlleleCall[]
  ): CDSAlert {
    const genes = starAlleleCalls.map((call) => call.gene).join(', ');
    const actionable = starAlleleCalls.filter(
      (call) => call.metabolizerStatus !== 'normal'
    );

    const detail = actionable.length > 0
      ? `Patient has actionable pharmacogenomic results for: ${actionable
          .map((call) => `${call.gene} (${call.metabolizerStatus})`)
          .join(', ')}. Review before prescribing medications.`
      : `Pharmacogenomic testing completed for: ${genes}. Results available for clinical decision support.`;

    return {
      id: `pgx-monitoring-${patientId}-${Date.now()}`,
      summary: 'Pharmacogenomic results available',
      indicator: actionable.length > 0 ? 'warning' : 'info',
      source: {
        label: 'Genomics Laboratory',
      },
      card: {
        uuid: `card-monitoring-${Date.now()}`,
        summary: 'Pharmacogenomic results available',
        detail,
        indicator: actionable.length > 0 ? 'warning' : 'info',
        source: {
          label: 'Genomics Laboratory',
        },
        suggestions: [],
        links: [
          {
            label: 'View Complete PGx Report',
            url: `/genomics/pgx?patient=${patientId}`,
            type: 'absolute',
          },
        ],
      },
      timestamp: new Date().toISOString(),
      patientId,
    };
  }

  /**
   * Generate HL7 FHIR observation resource for PGx result
   */
  static generateFHIRObservation(
    patientId: string,
    starAllele: StarAlleleCall
  ): any {
    return {
      resourceType: 'Observation',
      id: `pgx-${starAllele.gene}-${patientId}`,
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '84413-4',
            display: 'Genotype display name',
          },
        ],
        text: `${starAllele.gene} Diplotype`,
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: new Date().toISOString(),
      valueCodeableConcept: {
        coding: [
          {
            system: 'http://www.genenames.org',
            code: starAllele.gene,
            display: starAllele.diplotype,
          },
        ],
        text: starAllele.diplotype,
      },
      interpretation: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: this.mapMetabolizerToInterpretation(starAllele.metabolizerStatus),
              display: starAllele.phenotype,
            },
          ],
          text: starAllele.phenotype,
        },
      ],
      note: [
        {
          text: `Activity Score: ${starAllele.activityScore}. ${starAllele.clinicalImplications.join(' ')}`,
        },
      ],
    };
  }

  /**
   * Map metabolizer status to FHIR interpretation code
   */
  private static mapMetabolizerToInterpretation(status: string): string {
    const map: Record<string, string> = {
      poor: 'L',
      intermediate: 'I',
      normal: 'N',
      rapid: 'H',
      ultrarapid: 'HH',
      indeterminate: 'IND',
    };
    return map[status] || 'N';
  }
}
