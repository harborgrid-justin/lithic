/**
 * EDIService - Handles Electronic Data Interchange for healthcare
 * Supports EDI 837 (Claims) and EDI 835 (ERA/Remittance Advice)
 */

interface EDI837Data {
  isaHeader: any;
  gsHeader: any;
  st837Header: any;
  submitter: any;
  receiver: any;
  billing_provider: any;
  subscriber: any;
  patient: any;
  claims: any[];
}

interface EDI835Data {
  payerName: string;
  payerAddress: string;
  payeeNPI: string;
  checkNumber: string;
  checkDate: string;
  checkAmount: number;
  claims: any[];
}

export class EDIService {
  constructor() {
    // Initialize EDI parser/generator libraries
  }

  // ==================== EDI 837 (CLAIMS) ====================

  /**
   * Generate EDI 837 file from claim data
   */
  async generate837(claim: any): Promise<string> {
    const edi837: EDI837Data = {
      isaHeader: this.buildISAHeader(),
      gsHeader: this.buildGSHeader(),
      st837Header: this.buildSTHeader(),
      submitter: this.buildSubmitter(),
      receiver: this.buildReceiver(claim.payerId),
      billing_provider: this.buildBillingProvider(claim),
      subscriber: this.buildSubscriber(claim),
      patient: this.buildPatient(claim),
      claims: [this.buildClaimSegment(claim)]
    };

    // Convert to EDI X12 format
    const ediContent = this.formatEDI837(edi837);

    return ediContent;
  }

  /**
   * Batch generate EDI 837 for multiple claims
   */
  async generateBatch837(claims: any[]): Promise<string> {
    const batchEDI = {
      isaHeader: this.buildISAHeader(),
      gsHeader: this.buildGSHeader(),
      claims: claims.map(claim => this.buildClaimSegment(claim))
    };

    return this.formatEDI837Batch(batchEDI);
  }

  /**
   * Validate EDI 837 format
   */
  async validate837(ediContent: string): Promise<any> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse and validate segments
    const segments = ediContent.split('~');

    // Check required segments
    if (!segments.some(s => s.startsWith('ISA'))) {
      errors.push('Missing ISA segment');
    }
    if (!segments.some(s => s.startsWith('GS'))) {
      errors.push('Missing GS segment');
    }
    if (!segments.some(s => s.startsWith('ST'))) {
      errors.push('Missing ST segment');
    }

    // Validate segment structure
    segments.forEach((segment, index) => {
      if (segment && segment.length > 0) {
        const elements = segment.split('*');
        if (elements[0] === 'ISA' && elements.length !== 17) {
          errors.push(`ISA segment invalid: expected 17 elements, got ${elements.length}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      segmentCount: segments.length
    };
  }

  // ==================== EDI 835 (ERA) ====================

  /**
   * Parse EDI 835 ERA file
   */
  async parseERA835(ediContent: string, userId: string): Promise<any> {
    const segments = ediContent.split('~').filter(s => s.trim());

    const eraData: any = {
      id: `ERA${Date.now()}`,
      rawContent: ediContent,
      parsedAt: new Date().toISOString(),
      parsedBy: userId,
      status: 'parsed',
      payer: {},
      payee: {},
      checkInfo: {},
      claims: [],
      totalAmount: 0,
      claimCount: 0
    };

    let currentClaim: any = null;
    let currentService: any = null;

    segments.forEach(segment => {
      const elements = segment.split('*');
      const segmentId = elements[0];

      switch (segmentId) {
        case 'ISA':
          // Interchange control header
          break;

        case 'GS':
          // Functional group header
          break;

        case 'ST':
          // Transaction set header
          eraData.transactionSetControlNumber = elements[2];
          break;

        case 'BPR':
          // Financial Information
          eraData.checkInfo = {
            transactionHandlingCode: elements[1],
            monetaryAmount: parseFloat(elements[2]),
            creditDebit: elements[3],
            paymentMethod: elements[4],
            paymentFormat: elements[5],
            checkNumber: elements[7] || '',
            date: this.parseEDIDate(elements[16])
          };
          eraData.totalAmount = parseFloat(elements[2]);
          break;

        case 'TRN':
          // Trace number
          eraData.traceNumber = elements[2];
          eraData.originatingCompanyId = elements[3];
          break;

        case 'N1':
          // Name - Payer/Payee
          const entityCode = elements[1];
          const name = elements[2];
          const idQualifier = elements[3];
          const id = elements[4];

          if (entityCode === 'PR') {
            // Payer
            eraData.payer = { name, idQualifier, id };
          } else if (entityCode === 'PE') {
            // Payee
            eraData.payee = { name, idQualifier, id };
          }
          break;

        case 'N3':
          // Address
          // Store address for current entity
          break;

        case 'N4':
          // Geographic location
          break;

        case 'LX':
          // Header number - starts new claim
          if (currentClaim) {
            eraData.claims.push(currentClaim);
          }
          currentClaim = {
            headerNumber: elements[1],
            services: [],
            claimPayment: 0,
            patientResponsibility: 0
          };
          eraData.claimCount++;
          break;

        case 'CLP':
          // Claim payment information
          if (currentClaim) {
            currentClaim.claimId = elements[1];
            currentClaim.status = elements[2];
            currentClaim.totalCharge = parseFloat(elements[3]);
            currentClaim.claimPayment = parseFloat(elements[4]);
            currentClaim.patientResponsibility = parseFloat(elements[5]);
            currentClaim.claimFilingIndicator = elements[6];
            currentClaim.payerClaimControlNumber = elements[7];
          }
          break;

        case 'NM1':
          // Individual or organizational name
          const entityTypeCode = elements[1];
          if (currentClaim) {
            if (entityTypeCode === 'QC') {
              // Patient
              currentClaim.patient = {
                lastName: elements[3],
                firstName: elements[4],
                middleName: elements[5],
                memberId: elements[9]
              };
            } else if (entityTypeCode === 'IL') {
              // Insured
              currentClaim.insured = {
                lastName: elements[3],
                firstName: elements[4],
                memberId: elements[9]
              };
            }
          }
          break;

        case 'SVC':
          // Service payment information
          currentService = {
            procedureCode: this.parseProcedureCode(elements[1]),
            charge: parseFloat(elements[2]),
            payment: parseFloat(elements[3]),
            units: parseFloat(elements[5]) || 1,
            adjustments: []
          };
          if (currentClaim) {
            currentClaim.services.push(currentService);
          }
          break;

        case 'CAS':
          // Claim/Service adjustment
          const adjustment = {
            groupCode: elements[1],
            reasonCode: elements[2],
            amount: parseFloat(elements[3]),
            quantity: elements[4] ? parseFloat(elements[4]) : null
          };

          // Additional adjustments in same segment
          for (let i = 5; i < elements.length; i += 3) {
            if (elements[i]) {
              adjustment.reasonCode += `, ${elements[i]}`;
              adjustment.amount += parseFloat(elements[i + 1] || '0');
            }
          }

          if (currentService) {
            currentService.adjustments.push(adjustment);
          } else if (currentClaim) {
            if (!currentClaim.adjustments) currentClaim.adjustments = [];
            currentClaim.adjustments.push(adjustment);
          }
          break;

        case 'DTM':
          // Date/time reference
          const dateQualifier = elements[1];
          const date = this.parseEDIDate(elements[2]);

          if (currentClaim) {
            if (dateQualifier === '232') {
              currentClaim.serviceDate = date;
            } else if (dateQualifier === '050') {
              currentClaim.receivedDate = date;
            }
          }
          break;

        case 'AMT':
          // Monetary amount
          const amtQualifier = elements[1];
          const amount = parseFloat(elements[2]);

          if (currentClaim) {
            if (amtQualifier === 'AU') {
              currentClaim.coverageAmount = amount;
            } else if (amtQualifier === 'D') {
              currentClaim.discountAmount = amount;
            }
          }
          break;

        case 'SE':
          // Transaction set trailer
          if (currentClaim) {
            eraData.claims.push(currentClaim);
            currentClaim = null;
          }
          break;
      }
    });

    // Save ERA to database
    console.log('Parsed ERA:', eraData);

    return eraData;
  }

  /**
   * Process ERA and create payment records
   */
  async processERA(eraId: string, userId: string): Promise<any> {
    const era = await this.getERAById(eraId);

    const results = {
      eraId,
      processedAt: new Date().toISOString(),
      processedBy: userId,
      paymentsCreated: 0,
      adjustmentsCreated: 0,
      denialsIdentified: 0,
      errors: [] as string[]
    };

    // Process each claim in ERA
    for (const claim of era.claims || []) {
      try {
        // Match claim to database
        // Create payment record
        // Post adjustments
        // Handle denials

        if (claim.status === '1') {
          // Processed as primary
          results.paymentsCreated++;
        } else if (claim.status === '4') {
          // Denied
          results.denialsIdentified++;
        }

        results.adjustmentsCreated += claim.adjustments?.length || 0;
      } catch (error) {
        results.errors.push(`Claim ${claim.claimId}: ${error}`);
      }
    }

    // Update ERA status
    console.log('ERA processing results:', results);

    return results;
  }

  /**
   * Auto-post ERA payments
   */
  async autoPostERA(eraId: string, autoResolveAdjustments: boolean, userId: string): Promise<any> {
    const era = await this.getERAById(eraId);

    const results = {
      eraId,
      autoPosted: 0,
      requiresReview: 0,
      totalPosted: 0,
      errors: [] as string[]
    };

    for (const claim of era.claims || []) {
      try {
        // Auto-match claim
        const matched = await this.matchClaimToERA(claim);

        if (matched && matched.confidence > 0.9) {
          // High confidence match - auto-post
          await this.postERAPayment(claim, matched.claimId, userId);
          results.autoPosted++;
          results.totalPosted += claim.claimPayment;
        } else {
          // Low confidence - flag for review
          results.requiresReview++;
        }
      } catch (error) {
        results.errors.push(`Claim ${claim.claimId}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Get all ERAs
   */
  async getERAs(page: number, limit: number, filters: any) {
    const eras = [
      {
        id: 'ERA001',
        checkNumber: '1234567',
        checkDate: '2025-12-15',
        payerName: 'Blue Cross Blue Shield',
        totalAmount: 5000.00,
        claimCount: 15,
        status: 'processed',
        receivedAt: '2025-12-15T08:00:00Z'
      }
    ];

    return {
      eras,
      pagination: {
        page,
        limit,
        total: eras.length,
        totalPages: Math.ceil(eras.length / limit)
      }
    };
  }

  /**
   * Get ERA by ID
   */
  async getERAById(id: string) {
    return {
      id,
      checkNumber: '1234567',
      checkDate: '2025-12-15',
      checkAmount: 5000.00,
      payer: {
        name: 'Blue Cross Blue Shield',
        id: 'BCBS001',
        address: '456 Insurance Ave'
      },
      payee: {
        name: 'City Medical Center',
        npi: '0987654321'
      },
      claims: [
        {
          claimId: 'CLM001',
          status: '1',
          totalCharge: 200.00,
          claimPayment: 160.00,
          patientResponsibility: 40.00,
          services: [
            {
              procedureCode: '99213',
              charge: 150.00,
              payment: 120.00,
              adjustments: [
                {
                  groupCode: 'CO',
                  reasonCode: '45',
                  amount: 30.00
                }
              ]
            }
          ]
        }
      ],
      status: 'processed',
      receivedAt: '2025-12-15T08:00:00Z',
      processedAt: '2025-12-15T09:00:00Z'
    };
  }

  /**
   * Get payments from ERA
   */
  async getERAPayments(eraId: string) {
    return [
      {
        claimId: 'CLM001',
        claimNumber: 'CLM-2025-001',
        patientName: 'John Doe',
        totalCharge: 200.00,
        payment: 160.00,
        adjustments: 40.00,
        status: 'paid'
      }
    ];
  }

  /**
   * Get adjustments from ERA
   */
  async getERAAdjustments(eraId: string) {
    return [
      {
        claimId: 'CLM001',
        groupCode: 'CO',
        reasonCode: '45',
        description: 'Charge exceeds fee schedule',
        amount: 40.00
      }
    ];
  }

  /**
   * Match ERA to claims
   */
  async matchERAToClaims(eraId: string) {
    const era = await this.getERAById(eraId);

    const matches = [];
    const unmatched = [];

    for (const eraClaim of era.claims || []) {
      const match = await this.matchClaimToERA(eraClaim);

      if (match) {
        matches.push({
          eraClaimId: eraClaim.claimId,
          matchedClaimId: match.claimId,
          confidence: match.confidence,
          matchMethod: match.method
        });
      } else {
        unmatched.push(eraClaim);
      }
    }

    return {
      matched: matches,
      unmatched,
      matchRate: (matches.length / era.claims.length) * 100
    };
  }

  /**
   * Get denials from ERA
   */
  async getERADenials(eraId: string) {
    return [
      {
        claimId: 'CLM002',
        claimNumber: 'CLM-2025-002',
        denialCode: 'CO-16',
        denialReason: 'Claim lacks information',
        amount: 350.00,
        appealDeadline: '2026-04-15'
      }
    ];
  }

  /**
   * Get raw ERA content
   */
  async getRawERA(eraId: string): Promise<string> {
    const era = await this.getERAById(eraId);
    // In real implementation, fetch from storage
    return 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *251215*0800*^*00501*000000001*0*P*:~\n' +
           'GS*HP*SENDER*RECEIVER*20251215*0800*1*X*005010X221A1~\n' +
           'ST*835*0001~\n' +
           'BPR*I*5000.00*C*ACH*CTX***01*123456789*DA*987654321**01*987654321*20251215~\n' +
           'SE*25*0001~\n' +
           'GE*1*1~\n' +
           'IEA*1*000000001~';
  }

  /**
   * Get unprocessed ERAs
   */
  async getUnprocessedERAs() {
    return [
      {
        id: 'ERA002',
        checkNumber: '9876543',
        checkDate: '2025-12-20',
        payerName: 'Aetna',
        totalAmount: 3500.00,
        claimCount: 10,
        status: 'uploaded',
        receivedAt: '2025-12-20T10:00:00Z'
      }
    ];
  }

  /**
   * Reconcile ERA with bank deposit
   */
  async reconcileERA(
    eraId: string,
    depositAmount: number,
    depositDate: string,
    bankAccount: string,
    userId: string
  ) {
    const era = await this.getERAById(eraId);

    const reconciliation = {
      eraId,
      eraAmount: era.checkAmount,
      depositAmount,
      depositDate,
      bankAccount,
      variance: depositAmount - era.checkAmount,
      isReconciled: Math.abs(depositAmount - era.checkAmount) < 0.01,
      reconciledAt: new Date().toISOString(),
      reconciledBy: userId
    };

    console.log('ERA reconciliation:', reconciliation);

    return reconciliation;
  }

  /**
   * Get ERA statistics
   */
  async getERAStats(startDate: string, endDate: string) {
    return {
      totalERAs: 50,
      totalAmount: 150000.00,
      totalClaims: 500,
      processed: 45,
      unprocessed: 5,
      averageAmount: 3000.00,
      averageClaimsPerERA: 10,
      byPayer: [
        {
          payerName: 'Blue Cross Blue Shield',
          count: 20,
          amount: 60000.00
        },
        {
          payerName: 'Aetna',
          count: 15,
          amount: 45000.00
        }
      ],
      processingTime: {
        average: 2.5,
        min: 0.5,
        max: 8.0
      }
    };
  }

  // ==================== HELPER METHODS ====================

  private buildISAHeader() {
    return {
      authorizationInformationQualifier: '00',
      authorizationInformation: '          ',
      securityInformationQualifier: '00',
      securityInformation: '          ',
      interchangeIdQualifierSender: 'ZZ',
      interchangeSenderId: 'SENDER         ',
      interchangeIdQualifierReceiver: 'ZZ',
      interchangeReceiverId: 'RECEIVER       ',
      interchangeDate: this.formatEDIDate(new Date()),
      interchangeTime: this.formatEDITime(new Date()),
      repetitionSeparator: '^',
      interchangeControlVersionNumber: '00501',
      interchangeControlNumber: '000000001',
      acknowledgmentRequested: '0',
      usageIndicator: 'P',
      componentElementSeparator: ':'
    };
  }

  private buildGSHeader() {
    return {
      functionalIdentifierCode: 'HC',
      applicationSenderCode: 'SENDER',
      applicationReceiverCode: 'RECEIVER',
      date: this.formatEDIDate(new Date()),
      time: this.formatEDITime(new Date()),
      groupControlNumber: '1',
      responsibleAgencyCode: 'X',
      versionReleaseIndustryIdentifierCode: '005010X222A1'
    };
  }

  private buildSTHeader() {
    return {
      transactionSetIdentifierCode: '837',
      transactionSetControlNumber: '0001'
    };
  }

  private buildSubmitter() {
    return {
      organizationName: 'City Medical Center',
      npi: '0987654321',
      taxId: '12-3456789'
    };
  }

  private buildReceiver(payerId: string) {
    return {
      organizationName: 'Blue Cross Blue Shield',
      payerId: payerId
    };
  }

  private buildBillingProvider(claim: any) {
    return {
      npi: claim.billingProviderNPI,
      taxId: claim.billingProviderTaxId,
      name: claim.billingProviderName,
      address: claim.billingProviderAddress
    };
  }

  private buildSubscriber(claim: any) {
    return {
      memberId: claim.subscriberId,
      firstName: claim.subscriberFirstName,
      lastName: claim.subscriberLastName,
      dateOfBirth: claim.subscriberDOB,
      gender: claim.subscriberGender
    };
  }

  private buildPatient(claim: any) {
    return {
      firstName: claim.patientName?.split(' ')[0],
      lastName: claim.patientName?.split(' ')[1],
      dateOfBirth: claim.patientDOB,
      gender: claim.patientGender
    };
  }

  private buildClaimSegment(claim: any) {
    return {
      claimId: claim.id,
      totalCharge: claim.totalCharge,
      placeOfService: claim.placeOfService,
      serviceLines: claim.lineItems,
      diagnosisCodes: claim.diagnosisCodes
    };
  }

  private formatEDI837(data: EDI837Data): string {
    // Simplified EDI 837 generation
    // In production, use proper EDI library
    let edi = '';
    edi += `ISA*00*          *00*          *ZZ*${data.submitter}*ZZ*${data.receiver}*${this.formatEDIDate(new Date())}*${this.formatEDITime(new Date())}*^*00501*000000001*0*P*:~\n`;
    edi += `GS*HC*SENDER*RECEIVER*${this.formatEDIDate(new Date())}*${this.formatEDITime(new Date())}*1*X*005010X222A1~\n`;
    edi += `ST*837*0001~\n`;
    // ... additional segments
    edi += `SE*100*0001~\n`;
    edi += `GE*1*1~\n`;
    edi += `IEA*1*000000001~`;

    return edi;
  }

  private formatEDI837Batch(data: any): string {
    return 'BATCH EDI 837 CONTENT';
  }

  private formatEDIDate(date: Date): string {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private formatEDITime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}${minutes}`;
  }

  private parseEDIDate(ediDate: string): string {
    if (!ediDate || ediDate.length !== 8) return '';

    const year = ediDate.substring(0, 4);
    const month = ediDate.substring(4, 6);
    const day = ediDate.substring(6, 8);

    return `${year}-${month}-${day}`;
  }

  private parseProcedureCode(procedureString: string): string {
    // Format: HC:99213 or just 99213
    const parts = procedureString.split(':');
    return parts.length > 1 ? parts[1] : parts[0];
  }

  private async matchClaimToERA(eraClaim: any): Promise<any> {
    // Matching logic based on claim number, patient, dates, amounts
    return {
      claimId: 'CLM001',
      confidence: 0.95,
      method: 'claim_number'
    };
  }

  private async postERAPayment(eraClaim: any, claimId: string, userId: string): Promise<any> {
    console.log(`Posting ERA payment for claim ${claimId}`);
    return { success: true };
  }
}
