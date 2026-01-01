/**
 * Specimen Service
 * Manages laboratory specimen tracking and lifecycle
 */

export interface Specimen {
  id: string;
  specimenNumber: string;
  barcode: string;
  orderId: string;
  patientId: string;
  specimenType: SpecimenType;
  collectionDateTime: Date;
  collectedBy: string;
  receivedDateTime?: Date;
  receivedBy?: string;
  status: SpecimenStatus;
  containerType: string;
  volume?: number;
  volumeUnit?: string;
  collectionSite?: string;
  collectionMethod?: string;
  additives?: string[];
  temperature?: number;
  qualityIssues?: QualityIssue[];
  storageLocation?: string;
  processingNotes?: string;
  rejectionReason?: string;
  disposalDateTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SpecimenType =
  | 'blood-serum'
  | 'blood-plasma'
  | 'blood-whole'
  | 'urine'
  | 'stool'
  | 'csf'
  | 'sputum'
  | 'swab-throat'
  | 'swab-nasal'
  | 'swab-wound'
  | 'tissue'
  | 'bone-marrow'
  | 'synovial-fluid'
  | 'pleural-fluid'
  | 'peritoneal-fluid'
  | 'amniotic-fluid'
  | 'saliva'
  | 'other';

export type SpecimenStatus =
  | 'collected'
  | 'in-transit'
  | 'received'
  | 'processing'
  | 'tested'
  | 'stored'
  | 'rejected'
  | 'disposed';

export interface QualityIssue {
  type: 'hemolysis' | 'lipemia' | 'icterus' | 'clotted' | 'insufficient-volume' | 'contamination' | 'mislabeled' | 'expired' | 'damaged' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  detectedBy: string;
  detectedAt: Date;
}

export interface SpecimenTrackingEvent {
  id: string;
  specimenId: string;
  eventType: 'collected' | 'received' | 'processing-started' | 'testing-started' | 'testing-completed' | 'stored' | 'rejected' | 'disposed';
  timestamp: Date;
  performedBy: string;
  location: string;
  notes?: string;
}

export class SpecimenService {
  private specimens: Map<string, Specimen> = new Map();
  private trackingEvents: Map<string, SpecimenTrackingEvent[]> = new Map();

  /**
   * Generate unique specimen barcode
   */
  generateBarcode(specimenType: SpecimenType): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const typePrefix = this.getSpecimenTypePrefix(specimenType);

    return `${typePrefix}${timestamp}${random}`;
  }

  /**
   * Get specimen type prefix for barcode
   */
  private getSpecimenTypePrefix(specimenType: SpecimenType): string {
    const prefixes: Record<SpecimenType, string> = {
      'blood-serum': 'BS',
      'blood-plasma': 'BP',
      'blood-whole': 'BW',
      'urine': 'UR',
      'stool': 'ST',
      'csf': 'CF',
      'sputum': 'SP',
      'swab-throat': 'TH',
      'swab-nasal': 'NS',
      'swab-wound': 'WD',
      'tissue': 'TS',
      'bone-marrow': 'BM',
      'synovial-fluid': 'SF',
      'pleural-fluid': 'PF',
      'peritoneal-fluid': 'PT',
      'amniotic-fluid': 'AF',
      'saliva': 'SL',
      'other': 'OT'
    };

    return prefixes[specimenType] || 'XX';
  }

  /**
   * Create new specimen
   */
  async createSpecimen(data: Omit<Specimen, 'id' | 'specimenNumber' | 'barcode' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Specimen> {
    const id = `SPEC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const specimenNumber = `SN${Date.now()}`;
    const barcode = this.generateBarcode(data.specimenType);

    const specimen: Specimen = {
      ...data,
      id,
      specimenNumber,
      barcode,
      status: 'collected',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.specimens.set(id, specimen);

    // Add tracking event
    await this.addTrackingEvent({
      specimenId: id,
      eventType: 'collected',
      performedBy: data.collectedBy,
      location: data.collectionSite || 'Unknown',
      timestamp: data.collectionDateTime
    });

    return specimen;
  }

  /**
   * Receive specimen in laboratory
   */
  async receiveSpecimen(specimenId: string, receivedBy: string): Promise<Specimen> {
    const specimen = this.specimens.get(specimenId);
    if (!specimen) {
      throw new Error('Specimen not found');
    }

    specimen.receivedDateTime = new Date();
    specimen.receivedBy = receivedBy;
    specimen.status = 'received';
    specimen.updatedAt = new Date();

    this.specimens.set(specimenId, specimen);

    await this.addTrackingEvent({
      specimenId,
      eventType: 'received',
      performedBy: receivedBy,
      location: 'Laboratory Reception',
      timestamp: new Date()
    });

    return specimen;
  }

  /**
   * Update specimen status
   */
  async updateStatus(specimenId: string, status: SpecimenStatus, performedBy: string, notes?: string): Promise<Specimen> {
    const specimen = this.specimens.get(specimenId);
    if (!specimen) {
      throw new Error('Specimen not found');
    }

    specimen.status = status;
    specimen.updatedAt = new Date();

    this.specimens.set(specimenId, specimen);

    const eventTypeMap: Record<SpecimenStatus, SpecimenTrackingEvent['eventType']> = {
      'collected': 'collected',
      'in-transit': 'collected',
      'received': 'received',
      'processing': 'processing-started',
      'tested': 'testing-completed',
      'stored': 'stored',
      'rejected': 'rejected',
      'disposed': 'disposed'
    };

    await this.addTrackingEvent({
      specimenId,
      eventType: eventTypeMap[status],
      performedBy,
      location: 'Laboratory',
      timestamp: new Date(),
      notes
    });

    return specimen;
  }

  /**
   * Add quality issue to specimen
   */
  async addQualityIssue(specimenId: string, issue: Omit<QualityIssue, 'detectedAt'>): Promise<Specimen> {
    const specimen = this.specimens.get(specimenId);
    if (!specimen) {
      throw new Error('Specimen not found');
    }

    if (!specimen.qualityIssues) {
      specimen.qualityIssues = [];
    }

    specimen.qualityIssues.push({
      ...issue,
      detectedAt: new Date()
    });

    // Auto-reject if severe issue
    if (issue.severity === 'severe') {
      specimen.status = 'rejected';
      specimen.rejectionReason = issue.description;
    }

    specimen.updatedAt = new Date();
    this.specimens.set(specimenId, specimen);

    return specimen;
  }

  /**
   * Reject specimen
   */
  async rejectSpecimen(specimenId: string, reason: string, rejectedBy: string): Promise<Specimen> {
    const specimen = this.specimens.get(specimenId);
    if (!specimen) {
      throw new Error('Specimen not found');
    }

    specimen.status = 'rejected';
    specimen.rejectionReason = reason;
    specimen.updatedAt = new Date();

    this.specimens.set(specimenId, specimen);

    await this.addTrackingEvent({
      specimenId,
      eventType: 'rejected',
      performedBy: rejectedBy,
      location: 'Laboratory',
      timestamp: new Date(),
      notes: reason
    });

    return specimen;
  }

  /**
   * Add tracking event
   */
  private async addTrackingEvent(event: Omit<SpecimenTrackingEvent, 'id'>): Promise<SpecimenTrackingEvent> {
    const id = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const trackingEvent: SpecimenTrackingEvent = {
      ...event,
      id
    };

    const events = this.trackingEvents.get(event.specimenId) || [];
    events.push(trackingEvent);
    this.trackingEvents.set(event.specimenId, events);

    return trackingEvent;
  }

  /**
   * Get specimen by ID
   */
  async getSpecimen(specimenId: string): Promise<Specimen | undefined> {
    return this.specimens.get(specimenId);
  }

  /**
   * Get specimen by barcode
   */
  async getSpecimenByBarcode(barcode: string): Promise<Specimen | undefined> {
    return Array.from(this.specimens.values()).find(s => s.barcode === barcode);
  }

  /**
   * Get specimens for order
   */
  async getSpecimensForOrder(orderId: string): Promise<Specimen[]> {
    return Array.from(this.specimens.values()).filter(s => s.orderId === orderId);
  }

  /**
   * Get specimens for patient
   */
  async getSpecimensForPatient(patientId: string): Promise<Specimen[]> {
    return Array.from(this.specimens.values()).filter(s => s.patientId === patientId);
  }

  /**
   * Get tracking history
   */
  async getTrackingHistory(specimenId: string): Promise<SpecimenTrackingEvent[]> {
    return this.trackingEvents.get(specimenId) || [];
  }

  /**
   * Get specimens by status
   */
  async getSpecimensByStatus(status: SpecimenStatus): Promise<Specimen[]> {
    return Array.from(this.specimens.values()).filter(s => s.status === status);
  }

  /**
   * Validate specimen for testing
   */
  validateForTesting(specimen: Specimen): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (specimen.status === 'rejected') {
      errors.push('Specimen has been rejected');
    }

    if (specimen.status === 'disposed') {
      errors.push('Specimen has been disposed');
    }

    if (specimen.qualityIssues && specimen.qualityIssues.length > 0) {
      const severeIssues = specimen.qualityIssues.filter(i => i.severity === 'severe');
      if (severeIssues.length > 0) {
        errors.push(`Severe quality issues: ${severeIssues.map(i => i.type).join(', ')}`);
      }
    }

    if (!specimen.receivedDateTime) {
      errors.push('Specimen not yet received');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
