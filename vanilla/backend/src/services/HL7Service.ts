/**
 * HL7 v2.5 Message Generation Service
 * Generates HL7 messages for laboratory orders and results
 */

interface HL7Segment {
  segmentType: string;
  fields: string[];
}

export interface HL7OrderMessage {
  msh: HL7Segment;
  pid: HL7Segment;
  pv1: HL7Segment;
  orc: HL7Segment;
  obr: HL7Segment;
  obx?: HL7Segment[];
}

export class HL7Service {
  private static readonly FIELD_SEPARATOR = '|';
  private static readonly COMPONENT_SEPARATOR = '^';
  private static readonly REPETITION_SEPARATOR = '~';
  private static readonly ESCAPE_CHARACTER = '\\';
  private static readonly SUBCOMPONENT_SEPARATOR = '&';

  /**
   * Generate MSH (Message Header) segment
   */
  private static generateMSH(messageType: string, messageControlId: string): HL7Segment {
    const now = new Date();
    const timestamp = this.formatHL7DateTime(now);

    return {
      segmentType: 'MSH',
      fields: [
        this.FIELD_SEPARATOR,
        `${this.COMPONENT_SEPARATOR}${this.REPETITION_SEPARATOR}${this.ESCAPE_CHARACTER}${this.SUBCOMPONENT_SEPARATOR}`,
        'LITHIC_LIS^LITHIC^L',
        'HOSPITAL_LAB^HOSPITAL^L',
        timestamp,
        '',
        messageType,
        messageControlId,
        'P',
        '2.5',
        '',
        '',
        'AL',
        'NE',
        '',
        'ASCII'
      ]
    };
  }

  /**
   * Generate PID (Patient Identification) segment
   */
  private static generatePID(patientData: any): HL7Segment {
    return {
      segmentType: 'PID',
      fields: [
        '',
        '1',
        patientData.mrn || '',
        '',
        `${patientData.lastName || ''}^${patientData.firstName || ''}^${patientData.middleName || ''}`,
        '',
        this.formatHL7Date(patientData.dateOfBirth),
        patientData.gender || 'U',
        '',
        `${patientData.race || ''}`,
        `${patientData.address?.street || ''}^^${patientData.address?.city || ''}^${patientData.address?.state || ''}^${patientData.address?.zip || ''}`,
        '',
        `${patientData.phone || ''}`,
        '',
        '',
        '',
        '',
        patientData.ssn || ''
      ]
    };
  }

  /**
   * Generate PV1 (Patient Visit) segment
   */
  private static generatePV1(visitData: any): HL7Segment {
    return {
      segmentType: 'PV1',
      fields: [
        '',
        '1',
        visitData.patientClass || 'O',
        visitData.location || '',
        '',
        '',
        '',
        `${visitData.attendingDoctor?.id || ''}^${visitData.attendingDoctor?.lastName || ''}^${visitData.attendingDoctor?.firstName || ''}`,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        visitData.visitNumber || '',
        '',
        this.formatHL7DateTime(visitData.admitDateTime || new Date())
      ]
    };
  }

  /**
   * Generate ORC (Common Order) segment
   */
  private static generateORC(orderData: any): HL7Segment {
    return {
      segmentType: 'ORC',
      fields: [
        '',
        orderData.status || 'NW',
        orderData.placerOrderNumber || '',
        orderData.fillerOrderNumber || '',
        '',
        '',
        '',
        '',
        this.formatHL7DateTime(orderData.orderDateTime || new Date()),
        '',
        `${orderData.orderingProvider?.id || ''}^${orderData.orderingProvider?.lastName || ''}^${orderData.orderingProvider?.firstName || ''}`,
        '',
        '',
        this.formatHL7DateTime(orderData.orderDateTime || new Date()),
        '',
        orderData.orderType || 'LAB'
      ]
    };
  }

  /**
   * Generate OBR (Observation Request) segment
   */
  private static generateOBR(observationData: any): HL7Segment {
    return {
      segmentType: 'OBR',
      fields: [
        '',
        '1',
        observationData.placerOrderNumber || '',
        observationData.fillerOrderNumber || '',
        `${observationData.testCode || ''}^${observationData.testName || ''}^LN`,
        '',
        this.formatHL7DateTime(observationData.observationDateTime || new Date()),
        this.formatHL7DateTime(observationData.collectionDateTime || new Date()),
        '',
        '',
        '',
        observationData.specimenSource || '',
        `${observationData.orderingProvider?.id || ''}^${observationData.orderingProvider?.lastName || ''}^${observationData.orderingProvider?.firstName || ''}`,
        '',
        observationData.specimenReceivedDateTime ? this.formatHL7DateTime(observationData.specimenReceivedDateTime) : '',
        observationData.specimenSource || '',
        '',
        '',
        '',
        '',
        '',
        '',
        this.formatHL7DateTime(observationData.resultsDateTime || new Date()),
        '',
        observationData.resultStatus || 'F'
      ]
    };
  }

  /**
   * Generate OBX (Observation/Result) segment
   */
  private static generateOBX(resultData: any, setId: number): HL7Segment {
    const abnormalFlag = resultData.abnormalFlag || '';
    const referenceRange = resultData.referenceRange ? `${resultData.referenceRange.min}-${resultData.referenceRange.max}` : '';

    return {
      segmentType: 'OBX',
      fields: [
        '',
        setId.toString(),
        resultData.valueType || 'NM',
        `${resultData.testCode || ''}^${resultData.testName || ''}^LN`,
        '',
        resultData.value?.toString() || '',
        resultData.unit || '',
        referenceRange,
        abnormalFlag,
        resultData.probability || '',
        resultData.natureOfAbnormality || '',
        resultData.observationResultStatus || 'F',
        this.formatHL7DateTime(resultData.observationDateTime || new Date()),
        '',
        this.formatHL7DateTime(resultData.analysisDateTime || new Date()),
        `${resultData.performingOrganization || 'LITHIC_LAB'}`
      ]
    };
  }

  /**
   * Format date for HL7 (YYYYMMDD)
   */
  private static formatHL7Date(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  /**
   * Format datetime for HL7 (YYYYMMDDHHmmss)
   */
  private static formatHL7DateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Convert segment to HL7 string
   */
  private static segmentToString(segment: HL7Segment): string {
    return segment.segmentType + this.FIELD_SEPARATOR + segment.fields.join(this.FIELD_SEPARATOR);
  }

  /**
   * Generate HL7 ORM (Order) message
   */
  static generateOrderMessage(orderData: {
    patient: any;
    visit: any;
    order: any;
    tests: any[];
  }): string {
    const messageControlId = `MSG${Date.now()}`;
    const segments: string[] = [];

    // MSH
    segments.push(this.segmentToString(this.generateMSH('ORM^O01', messageControlId)));

    // PID
    segments.push(this.segmentToString(this.generatePID(orderData.patient)));

    // PV1
    segments.push(this.segmentToString(this.generatePV1(orderData.visit)));

    // ORC
    segments.push(this.segmentToString(this.generateORC(orderData.order)));

    // OBR for each test
    orderData.tests.forEach((test, index) => {
      segments.push(this.segmentToString(this.generateOBR({
        ...test,
        placerOrderNumber: orderData.order.placerOrderNumber,
        fillerOrderNumber: `${orderData.order.fillerOrderNumber}-${index + 1}`,
        orderingProvider: orderData.order.orderingProvider
      })));
    });

    return segments.join('\r') + '\r';
  }

  /**
   * Generate HL7 ORU (Result) message
   */
  static generateResultMessage(resultData: {
    patient: any;
    visit: any;
    order: any;
    results: any[];
  }): string {
    const messageControlId = `MSG${Date.now()}`;
    const segments: string[] = [];

    // MSH
    segments.push(this.segmentToString(this.generateMSH('ORU^R01', messageControlId)));

    // PID
    segments.push(this.segmentToString(this.generatePID(resultData.patient)));

    // PV1
    segments.push(this.segmentToString(this.generatePV1(resultData.visit)));

    // OBR
    segments.push(this.segmentToString(this.generateOBR({
      ...resultData.order,
      resultStatus: 'F'
    })));

    // OBX for each result
    resultData.results.forEach((result, index) => {
      segments.push(this.segmentToString(this.generateOBX(result, index + 1)));
    });

    return segments.join('\r') + '\r';
  }

  /**
   * Parse HL7 message
   */
  static parseHL7Message(message: string): any {
    const segments = message.split(/\r?\n/).filter(s => s.trim());
    const parsed: any = {
      segments: []
    };

    segments.forEach(segmentString => {
      const fields = segmentString.split(this.FIELD_SEPARATOR);
      const segmentType = fields[0];

      parsed.segments.push({
        type: segmentType,
        fields: fields.slice(1)
      });

      if (segmentType === 'MSH') {
        parsed.messageType = fields[9];
        parsed.messageControlId = fields[10];
      }
    });

    return parsed;
  }

  /**
   * Validate HL7 message
   */
  static validateHL7Message(message: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message || message.trim().length === 0) {
      errors.push('Message is empty');
      return { valid: false, errors };
    }

    const segments = message.split(/\r?\n/).filter(s => s.trim());

    if (segments.length === 0) {
      errors.push('No segments found');
      return { valid: false, errors };
    }

    if (!segments[0].startsWith('MSH')) {
      errors.push('First segment must be MSH');
    }

    const mshFields = segments[0].split(this.FIELD_SEPARATOR);
    if (mshFields.length < 12) {
      errors.push('MSH segment has insufficient fields');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate ACK (Acknowledgment) message
   */
  static generateACK(originalMessageId: string, ackCode: 'AA' | 'AE' | 'AR'): string {
    const messageControlId = `ACK${Date.now()}`;
    const segments: string[] = [];

    segments.push(this.segmentToString(this.generateMSH('ACK', messageControlId)));

    // MSA segment
    segments.push(`MSA${this.FIELD_SEPARATOR}${ackCode}${this.FIELD_SEPARATOR}${originalMessageId}`);

    return segments.join('\r') + '\r';
  }
}
