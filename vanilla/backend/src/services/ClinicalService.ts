import {
  ClinicalNote,
  VitalSigns,
  Problem,
  Allergy,
  Medication,
  Order,
  ClinicalTemplate,
  ESignature,
  CreateNoteRequest,
  SignDocumentRequest,
  CreateVitalsRequest,
  CreateProblemRequest,
  CreateAllergyRequest,
  CreateMedicationRequest,
  CreateOrderRequest,
  ICD10Code,
  CPTCode,
} from '../models/ClinicalTypes';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class ClinicalService {
  // In-memory storage (replace with database in production)
  private notes: Map<string, ClinicalNote> = new Map();
  private vitals: Map<string, VitalSigns> = new Map();
  private problems: Map<string, Problem> = new Map();
  private allergies: Map<string, Allergy> = new Map();
  private medications: Map<string, Medication> = new Map();
  private orders: Map<string, Order> = new Map();
  private templates: Map<string, ClinicalTemplate> = new Map();

  // ICD-10 Code Reference Data (sample)
  private icd10Codes: ICD10Code[] = [
    { code: 'I10', description: 'Essential (primary) hypertension', category: 'Circulatory' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
    { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified', category: 'Respiratory' },
    { code: 'E78.5', description: 'Hyperlipidemia, unspecified', category: 'Endocrine' },
    { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', category: 'Factors' },
    { code: 'Z79.4', description: 'Long term (current) use of insulin', category: 'Factors' },
    { code: 'R50.9', description: 'Fever, unspecified', category: 'Symptoms' },
    { code: 'R05', description: 'Cough', category: 'Symptoms' },
    { code: 'M25.50', description: 'Pain in unspecified joint', category: 'Musculoskeletal' },
    { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', category: 'Digestive' },
  ];

  // CPT Code Reference Data (sample)
  private cptCodes: CPTCode[] = [
    { code: '99213', description: 'Office visit, established patient, 20-29 minutes', category: 'E&M', rvuWork: 1.3, rvuPracticeExpense: 1.28, rvuMalpractice: 0.11 },
    { code: '99214', description: 'Office visit, established patient, 30-39 minutes', category: 'E&M', rvuWork: 1.92, rvuPracticeExpense: 1.95, rvuMalpractice: 0.17 },
    { code: '99215', description: 'Office visit, established patient, 40-54 minutes', category: 'E&M', rvuWork: 2.8, rvuPracticeExpense: 2.8, rvuMalpractice: 0.24 },
    { code: '99203', description: 'Office visit, new patient, 30-44 minutes', category: 'E&M', rvuWork: 1.6, rvuPracticeExpense: 2.11, rvuMalpractice: 0.14 },
    { code: '99204', description: 'Office visit, new patient, 45-59 minutes', category: 'E&M', rvuWork: 2.6, rvuPracticeExpense: 3.05, rvuMalpractice: 0.22 },
    { code: '80053', description: 'Comprehensive metabolic panel', category: 'Laboratory', rvuWork: 0, rvuPracticeExpense: 9.34, rvuMalpractice: 0.11 },
    { code: '85025', description: 'Complete blood count with differential', category: 'Laboratory', rvuWork: 0, rvuPracticeExpense: 4.45, rvuMalpractice: 0.05 },
    { code: '71046', description: 'Chest X-ray, 2 views', category: 'Radiology', rvuWork: 0.22, rvuPracticeExpense: 15.23, rvuMalpractice: 1.45 },
    { code: '93000', description: 'Electrocardiogram, complete', category: 'Diagnostic', rvuWork: 0.17, rvuPracticeExpense: 7.92, rvuMalpractice: 0.12 },
    { code: '36415', description: 'Venipuncture', category: 'Procedure', rvuWork: 0.17, rvuPracticeExpense: 1.86, rvuMalpractice: 0.02 },
  ];

  constructor() {
    this.initializeTemplates();
  }

  // ============ Clinical Notes ============

  async createNote(request: CreateNoteRequest, userId: string): Promise<ClinicalNote> {
    const note: ClinicalNote = {
      id: uuidv4(),
      encounterId: request.encounterId,
      patientId: request.patientId,
      providerId: request.providerId,
      noteType: request.noteType,
      template: request.template,
      subjective: request.subjective,
      objective: request.objective,
      assessment: request.assessment,
      plan: request.plan,
      content: request.content,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notes.set(note.id, note);
    return note;
  }

  async getNoteById(noteId: string): Promise<ClinicalNote | null> {
    return this.notes.get(noteId) || null;
  }

  async getNotesByEncounter(encounterId: string): Promise<ClinicalNote[]> {
    return Array.from(this.notes.values()).filter(
      note => note.encounterId === encounterId
    );
  }

  async getNotesByPatient(patientId: string): Promise<ClinicalNote[]> {
    return Array.from(this.notes.values()).filter(
      note => note.patientId === patientId
    );
  }

  async updateNote(noteId: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote | null> {
    const note = this.notes.get(noteId);
    if (!note) return null;

    const updatedNote = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };

    this.notes.set(noteId, updatedNote);
    return updatedNote;
  }

  async signNote(noteId: string, signRequest: SignDocumentRequest): Promise<ClinicalNote | null> {
    const note = this.notes.get(noteId);
    if (!note) return null;

    // Verify user credentials (simplified - use proper auth in production)
    const isValid = await this.verifySignature(signRequest);
    if (!isValid) {
      throw new Error('Invalid signature credentials');
    }

    const signature = this.generateSignature(signRequest);

    const signedNote: ClinicalNote = {
      ...note,
      status: 'signed',
      signedAt: new Date(),
      signedBy: signRequest.userId,
      signature: signature.signature,
      updatedAt: new Date(),
    };

    this.notes.set(noteId, signedNote);
    return signedNote;
  }

  async addAddendum(noteId: string, addendumText: string, userId: string): Promise<ClinicalNote | null> {
    const note = this.notes.get(noteId);
    if (!note || note.status !== 'signed') {
      throw new Error('Can only add addendum to signed notes');
    }

    const addendum = `[${new Date().toISOString()}] By ${userId}: ${addendumText}`;
    const addendums = note.addendum || [];
    addendums.push(addendum);

    const updatedNote: ClinicalNote = {
      ...note,
      addendum: addendums,
      status: 'addended',
      updatedAt: new Date(),
    };

    this.notes.set(noteId, updatedNote);
    return updatedNote;
  }

  // ============ Vital Signs ============

  async recordVitals(request: CreateVitalsRequest, userId: string): Promise<VitalSigns> {
    const vitals: VitalSigns = {
      id: uuidv4(),
      encounterId: request.encounterId,
      patientId: request.patientId,
      recordedAt: new Date(),
      recordedBy: userId,
      temperature: request.temperature,
      temperatureUnit: request.temperatureUnit,
      pulse: request.pulse,
      respiratoryRate: request.respiratoryRate,
      bloodPressureSystolic: request.bloodPressureSystolic,
      bloodPressureDiastolic: request.bloodPressureDiastolic,
      oxygenSaturation: request.oxygenSaturation,
      weight: request.weight,
      weightUnit: request.weightUnit,
      height: request.height,
      heightUnit: request.heightUnit,
      bmi: this.calculateBMI(request.weight, request.height, request.weightUnit, request.heightUnit),
      painLevel: request.painLevel,
      notes: request.notes,
      createdAt: new Date(),
    };

    this.vitals.set(vitals.id, vitals);
    return vitals;
  }

  async getVitalsByEncounter(encounterId: string): Promise<VitalSigns[]> {
    return Array.from(this.vitals.values())
      .filter(v => v.encounterId === encounterId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }

  async getVitalsByPatient(patientId: string, limit?: number): Promise<VitalSigns[]> {
    const vitals = Array.from(this.vitals.values())
      .filter(v => v.patientId === patientId)
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

    return limit ? vitals.slice(0, limit) : vitals;
  }

  private calculateBMI(weight?: number, height?: number, weightUnit?: string, heightUnit?: string): number | undefined {
    if (!weight || !height) return undefined;

    // Convert to kg and meters
    const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight;
    const heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;

    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  }

  // ============ Problems ============

  async createProblem(request: CreateProblemRequest, userId: string): Promise<Problem> {
    const problem: Problem = {
      id: uuidv4(),
      patientId: request.patientId,
      encounterId: request.encounterId,
      icd10Code: request.icd10Code,
      problemName: request.problemName,
      status: 'active',
      severity: request.severity,
      onsetDate: new Date(request.onsetDate),
      notes: request.notes,
      addedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.problems.set(problem.id, problem);
    return problem;
  }

  async getProblemsByPatient(patientId: string, activeOnly: boolean = false): Promise<Problem[]> {
    let problems = Array.from(this.problems.values()).filter(
      p => p.patientId === patientId
    );

    if (activeOnly) {
      problems = problems.filter(p => p.status === 'active' || p.status === 'chronic');
    }

    return problems.sort((a, b) => b.onsetDate.getTime() - a.onsetDate.getTime());
  }

  async updateProblem(problemId: string, updates: Partial<Problem>): Promise<Problem | null> {
    const problem = this.problems.get(problemId);
    if (!problem) return null;

    const updatedProblem = {
      ...problem,
      ...updates,
      updatedAt: new Date(),
    };

    this.problems.set(problemId, updatedProblem);
    return updatedProblem;
  }

  // ============ Allergies ============

  async createAllergy(request: CreateAllergyRequest, userId: string): Promise<Allergy> {
    const allergy: Allergy = {
      id: uuidv4(),
      patientId: request.patientId,
      allergen: request.allergen,
      allergenType: request.allergenType,
      reaction: request.reaction,
      severity: request.severity,
      onsetDate: request.onsetDate ? new Date(request.onsetDate) : undefined,
      status: 'active',
      verifiedBy: userId,
      notes: request.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.allergies.set(allergy.id, allergy);
    return allergy;
  }

  async getAllergiesByPatient(patientId: string, activeOnly: boolean = true): Promise<Allergy[]> {
    let allergies = Array.from(this.allergies.values()).filter(
      a => a.patientId === patientId
    );

    if (activeOnly) {
      allergies = allergies.filter(a => a.status === 'active');
    }

    return allergies.sort((a, b) => {
      const severityOrder = { 'life-threatening': 0, 'severe': 1, 'moderate': 2, 'mild': 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  async updateAllergy(allergyId: string, updates: Partial<Allergy>): Promise<Allergy | null> {
    const allergy = this.allergies.get(allergyId);
    if (!allergy) return null;

    const updatedAllergy = {
      ...allergy,
      ...updates,
      updatedAt: new Date(),
    };

    this.allergies.set(allergyId, updatedAllergy);
    return updatedAllergy;
  }

  // ============ Medications ============

  async createMedication(request: CreateMedicationRequest, userId: string): Promise<Medication> {
    const medication: Medication = {
      id: uuidv4(),
      patientId: request.patientId,
      encounterId: request.encounterId,
      medicationName: request.medicationName,
      genericName: request.genericName,
      ndc: request.ndc,
      dosage: request.dosage,
      route: request.route,
      frequency: request.frequency,
      startDate: new Date(request.startDate),
      endDate: request.endDate ? new Date(request.endDate) : undefined,
      prescribedBy: userId,
      indication: request.indication,
      status: 'active',
      refills: request.refills,
      quantity: request.quantity,
      instructions: request.instructions,
      pharmacy: request.pharmacy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.medications.set(medication.id, medication);
    return medication;
  }

  async getMedicationsByPatient(patientId: string, activeOnly: boolean = true): Promise<Medication[]> {
    let medications = Array.from(this.medications.values()).filter(
      m => m.patientId === patientId
    );

    if (activeOnly) {
      medications = medications.filter(m => m.status === 'active');
    }

    return medications.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  async updateMedication(medicationId: string, updates: Partial<Medication>): Promise<Medication | null> {
    const medication = this.medications.get(medicationId);
    if (!medication) return null;

    const updatedMedication = {
      ...medication,
      ...updates,
      updatedAt: new Date(),
    };

    this.medications.set(medicationId, updatedMedication);
    return updatedMedication;
  }

  // ============ Orders ============

  async createOrder(request: CreateOrderRequest, userId: string): Promise<Order> {
    const order: Order = {
      id: uuidv4(),
      encounterId: request.encounterId,
      patientId: request.patientId,
      orderType: request.orderType,
      orderName: request.orderName,
      cptCode: request.cptCode,
      icd10Codes: request.icd10Codes,
      priority: request.priority,
      status: 'pending',
      orderedBy: userId,
      orderedAt: new Date(),
      scheduledDate: request.scheduledDate ? new Date(request.scheduledDate) : undefined,
      instructions: request.instructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(order.id, order);
    return order;
  }

  async getOrdersByEncounter(encounterId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.encounterId === encounterId)
      .sort((a, b) => b.orderedAt.getTime() - a.orderedAt.getTime());
  }

  async getOrdersByPatient(patientId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(o => o.patientId === patientId)
      .sort((a, b) => b.orderedAt.getTime() - a.orderedAt.getTime());
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updatedOrder = {
      ...order,
      ...updates,
      updatedAt: new Date(),
    };

    this.orders.set(orderId, updatedOrder);
    return updatedOrder;
  }

  async signOrder(orderId: string, signRequest: SignDocumentRequest): Promise<Order | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const isValid = await this.verifySignature(signRequest);
    if (!isValid) {
      throw new Error('Invalid signature credentials');
    }

    const signature = this.generateSignature(signRequest);

    const signedOrder: Order = {
      ...order,
      status: 'in-progress',
      signedBy: signRequest.userId,
      signature: signature.signature,
      updatedAt: new Date(),
    };

    this.orders.set(orderId, signedOrder);
    return signedOrder;
  }

  // ============ Code Lookups ============

  searchICD10(query: string): ICD10Code[] {
    const lowerQuery = query.toLowerCase();
    return this.icd10Codes.filter(
      code =>
        code.code.toLowerCase().includes(lowerQuery) ||
        code.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
  }

  searchCPT(query: string): CPTCode[] {
    const lowerQuery = query.toLowerCase();
    return this.cptCodes.filter(
      code =>
        code.code.includes(query) ||
        code.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
  }

  getICD10ByCode(code: string): ICD10Code | undefined {
    return this.icd10Codes.find(c => c.code === code);
  }

  getCPTByCode(code: string): CPTCode | undefined {
    return this.cptCodes.find(c => c.code === code);
  }

  // ============ Templates ============

  getTemplates(type?: string): ClinicalTemplate[] {
    const templates = Array.from(this.templates.values()).filter(t => t.isActive);
    return type ? templates.filter(t => t.type === type) : templates;
  }

  getTemplateById(id: string): ClinicalTemplate | null {
    return this.templates.get(id) || null;
  }

  private initializeTemplates(): void {
    const soapTemplate: ClinicalTemplate = {
      id: 'soap-general',
      name: 'General SOAP Note',
      type: 'note',
      specialty: 'General',
      content: '',
      sections: [
        { name: 'Subjective', content: 'Chief Complaint:\nHistory of Present Illness:\nReview of Systems:', order: 1, required: true },
        { name: 'Objective', content: 'Vital Signs:\nPhysical Examination:\nLaboratory/Imaging:', order: 2, required: true },
        { name: 'Assessment', content: 'Primary Diagnosis:\nSecondary Diagnoses:', order: 3, required: true },
        { name: 'Plan', content: 'Treatment:\nMedications:\nFollow-up:', order: 4, required: true },
      ],
      createdBy: 'system',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const admissionTemplate: ClinicalTemplate = {
      id: 'admission-note',
      name: 'Admission History & Physical',
      type: 'note',
      content: '',
      sections: [
        { name: 'Chief Complaint', content: '', order: 1, required: true },
        { name: 'History of Present Illness', content: '', order: 2, required: true },
        { name: 'Past Medical History', content: '', order: 3, required: true },
        { name: 'Past Surgical History', content: '', order: 4, required: false },
        { name: 'Family History', content: '', order: 5, required: false },
        { name: 'Social History', content: '', order: 6, required: false },
        { name: 'Medications', content: '', order: 7, required: true },
        { name: 'Allergies', content: '', order: 8, required: true },
        { name: 'Physical Examination', content: '', order: 9, required: true },
        { name: 'Assessment and Plan', content: '', order: 10, required: true },
      ],
      createdBy: 'system',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(soapTemplate.id, soapTemplate);
    this.templates.set(admissionTemplate.id, admissionTemplate);
  }

  // ============ E-Signature ============

  private async verifySignature(signRequest: SignDocumentRequest): Promise<boolean> {
    // In production, verify against user credentials in database
    // This is a simplified version
    if (signRequest.password) {
      // Verify password hash
      return signRequest.password.length > 0;
    }
    if (signRequest.pin) {
      // Verify PIN
      return signRequest.pin.length === 4;
    }
    return false;
  }

  private generateSignature(signRequest: SignDocumentRequest): ESignature {
    const signatureData = signRequest.signatureData || this.generateDefaultSignature(signRequest.userId);

    return {
      userId: signRequest.userId,
      userName: signRequest.userId,
      timestamp: new Date(),
      ipAddress: signRequest.ipAddress,
      signature: signatureData,
      method: signRequest.password ? 'password' : signRequest.pin ? 'pin' : 'token',
    };
  }

  private generateDefaultSignature(userId: string): string {
    const data = `${userId}-${new Date().toISOString()}`;
    return crypto.createHash('sha256').update(data).digest('base64');
  }
}

const clinicalService = new ClinicalService();
export default clinicalService;
