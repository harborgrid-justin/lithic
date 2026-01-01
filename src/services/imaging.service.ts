/**
 * Imaging Service
 * Handles all imaging-related operations including orders, studies, and reports
 */

export interface ImagingOrder {
  id: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  orderDate: string;
  modality: string;
  bodyPart: string;
  procedure: string;
  procedureCode: string;
  clinicalIndication: string;
  orderingPhysician: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT' | 'EMERGENCY';
  status: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REPORTED';
  scheduledDate?: string;
  completedDate?: string;
  accessionNumber?: string;
  studyInstanceUID?: string;
  notes?: string;
  contrast?: boolean;
  transportRequired?: boolean;
  isolationPrecautions?: string;
  pregnancyStatus?: 'UNKNOWN' | 'POSITIVE' | 'NEGATIVE';
  creatinine?: number;
  gfr?: number;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ImagingStudy {
  id: string;
  studyInstanceUID: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  patientSex: 'M' | 'F' | 'O';
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  modality: string;
  bodyPart: string;
  referringPhysician: string;
  performingPhysician: string;
  radiologist?: string;
  numberOfSeries: number;
  numberOfInstances: number;
  institutionName: string;
  stationName?: string;
  seriesList: Series[];
  status: 'ACQUIRED' | 'QUALITY_CHECK' | 'READY_FOR_REVIEW' | 'IN_REVIEW' | 'REPORTED' | 'FINALIZED';
  reportId?: string;
  reportStatus?: 'DRAFT' | 'PRELIMINARY' | 'FINAL';
  pacsStatus: 'UPLOADING' | 'STORED' | 'ARCHIVED' | 'ERROR';
  fileSize: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Series {
  id: string;
  seriesInstanceUID: string;
  seriesNumber: number;
  seriesDescription: string;
  modality: string;
  bodyPart: string;
  numberOfInstances: number;
  instances: Instance[];
  thumbnailUrl?: string;
}

export interface Instance {
  id: string;
  sopInstanceUID: string;
  instanceNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  rows: number;
  columns: number;
  bitsAllocated: number;
  windowCenter?: number;
  windowWidth?: number;
}

export interface RadiologyReport {
  id: string;
  studyId: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  reportDate: string;
  radiologist: string;
  radiologistId: string;
  status: 'DRAFT' | 'PRELIMINARY' | 'FINAL' | 'AMENDED' | 'CORRECTED';
  studyDescription: string;
  technique?: string;
  comparison?: string;
  findings: string;
  impression: string;
  recommendations?: string;
  criticalFindings?: string;
  templateId?: string;
  signedDate?: string;
  signedBy?: string;
  verifiedDate?: string;
  verifiedBy?: string;
  addendums?: Addendum[];
  createdAt: string;
  updatedAt: string;
}

export interface Addendum {
  id: string;
  date: string;
  author: string;
  authorId: string;
  content: string;
}

export interface WorklistItem {
  id: string;
  studyId?: string;
  orderId?: string;
  accessionNumber: string;
  patientName: string;
  patientMRN: string;
  patientDOB: string;
  patientSex: 'M' | 'F' | 'O';
  modality: string;
  procedure: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  priority: 'ROUTINE' | 'URGENT' | 'STAT' | 'EMERGENCY';
  location: string;
  technologist?: string;
  notes?: string;
  contrast?: boolean;
  pregnancyStatus?: 'UNKNOWN' | 'POSITIVE' | 'NEGATIVE';
  transportRequired?: boolean;
  isolationPrecautions?: string;
}

export interface Modality {
  id: string;
  name: string;
  type: 'CR' | 'CT' | 'MR' | 'US' | 'XA' | 'DX' | 'MG' | 'NM' | 'PT' | 'RF' | 'OTHER';
  manufacturer: string;
  model: string;
  serialNumber: string;
  aeTitle: string;
  ipAddress: string;
  port: number;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  lastHeartbeat?: string;
  studyCount?: number;
  installedDate: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
}

export interface ImageAnnotation {
  id: string;
  studyId: string;
  seriesId: string;
  instanceId: string;
  type: 'ARROW' | 'RECTANGLE' | 'CIRCLE' | 'POLYGON' | 'TEXT' | 'MEASUREMENT';
  coordinates: number[][];
  text?: string;
  color: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Measurement {
  id: string;
  studyId: string;
  seriesId: string;
  instanceId: string;
  type: 'LENGTH' | 'AREA' | 'VOLUME' | 'ANGLE' | 'HU' | 'SUV';
  value: number;
  unit: string;
  coordinates: number[][];
  label?: string;
  author: string;
  authorId: string;
  createdAt: string;
}

class ImagingService {
  private baseUrl = '/api/imaging';

  // Imaging Orders
  async getOrders(filters?: {
    status?: string;
    patientId?: string;
    modality?: string;
    startDate?: string;
    endDate?: string;
    priority?: string;
  }): Promise<ImagingOrder[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await fetch(`${this.baseUrl}/orders?${params}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  }

  async getOrder(id: string): Promise<ImagingOrder> {
    const response = await fetch(`${this.baseUrl}/orders/${id}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  }

  async createOrder(order: Partial<ImagingOrder>): Promise<ImagingOrder> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  }

  async updateOrder(id: string, updates: Partial<ImagingOrder>): Promise<ImagingOrder> {
    const response = await fetch(`${this.baseUrl}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update order');
    return response.json();
  }

  async cancelOrder(id: string, reason: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to cancel order');
  }

  // Studies
  async getStudies(filters?: {
    patientId?: string;
    modality?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    accessionNumber?: string;
  }): Promise<ImagingStudy[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await fetch(`${this.baseUrl}/studies?${params}`);
    if (!response.ok) throw new Error('Failed to fetch studies');
    return response.json();
  }

  async getStudy(id: string): Promise<ImagingStudy> {
    const response = await fetch(`${this.baseUrl}/studies/${id}`);
    if (!response.ok) throw new Error('Failed to fetch study');
    return response.json();
  }

  async getStudyByAccession(accessionNumber: string): Promise<ImagingStudy> {
    const response = await fetch(`${this.baseUrl}/studies?accessionNumber=${accessionNumber}`);
    if (!response.ok) throw new Error('Failed to fetch study');
    const studies = await response.json();
    return studies[0];
  }

  async compareStudies(studyIds: string[]): Promise<ImagingStudy[]> {
    const studies = await Promise.all(studyIds.map(id => this.getStudy(id)));
    return studies;
  }

  // Reports
  async getReports(filters?: {
    studyId?: string;
    patientId?: string;
    radiologist?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RadiologyReport[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await fetch(`${this.baseUrl}/reports?${params}`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  }

  async getReport(id: string): Promise<RadiologyReport> {
    const response = await fetch(`${this.baseUrl}/reports/${id}`);
    if (!response.ok) throw new Error('Failed to fetch report');
    return response.json();
  }

  async createReport(report: Partial<RadiologyReport>): Promise<RadiologyReport> {
    const response = await fetch(`${this.baseUrl}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error('Failed to create report');
    return response.json();
  }

  async updateReport(id: string, updates: Partial<RadiologyReport>): Promise<RadiologyReport> {
    const response = await fetch(`${this.baseUrl}/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update report');
    return response.json();
  }

  async signReport(id: string): Promise<RadiologyReport> {
    const response = await fetch(`${this.baseUrl}/reports/${id}/sign`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sign report');
    return response.json();
  }

  async addAddendum(reportId: string, content: string): Promise<RadiologyReport> {
    const response = await fetch(`${this.baseUrl}/reports/${reportId}/addendum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to add addendum');
    return response.json();
  }

  // Worklist
  async getWorklist(filters?: {
    modality?: string;
    date?: string;
    status?: string;
    technologist?: string;
  }): Promise<WorklistItem[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await fetch(`${this.baseUrl}/worklist?${params}`);
    if (!response.ok) throw new Error('Failed to fetch worklist');
    return response.json();
  }

  async updateWorklistItem(id: string, updates: Partial<WorklistItem>): Promise<WorklistItem> {
    const response = await fetch(`${this.baseUrl}/worklist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update worklist item');
    return response.json();
  }

  // Template Management
  async getReportTemplates(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/templates`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  }

  async getReportTemplate(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`);
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
  }
}

export const imagingService = new ImagingService();
export default imagingService;
