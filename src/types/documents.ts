/**
 * Document Management Types
 * Lithic Healthcare Platform v0.5
 *
 * Comprehensive type definitions for enterprise document management,
 * versioning, OCR, and document workflows.
 */

export type DocumentType =
  | 'medical_record'
  | 'lab_result'
  | 'imaging'
  | 'consent_form'
  | 'prescription'
  | 'insurance_card'
  | 'identification'
  | 'referral'
  | 'treatment_plan'
  | 'discharge_summary'
  | 'operative_note'
  | 'progress_note'
  | 'other';

export type DocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'deleted';

export type DocumentFormat =
  | 'pdf'
  | 'jpeg'
  | 'png'
  | 'tiff'
  | 'docx'
  | 'txt'
  | 'xml'
  | 'hl7'
  | 'dicom';

export type AccessLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'top_secret';

export interface DocumentMetadata {
  title: string;
  description?: string;
  type: DocumentType;
  format: DocumentFormat;
  size: number;
  mimeType: string;
  checksum: string;
  encryptionStatus: 'unencrypted' | 'encrypted' | 'partially_encrypted';
  tags: string[];
  keywords: string[];
  language: string;
  pageCount?: number;
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'not_applicable';
  ocrConfidence?: number;
  extractedText?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  status: DocumentStatus;
  changeDescription: string;
  fileUrl: string;
  fileSize: number;
  checksum: string;
  metadata: DocumentMetadata;
  annotations: DocumentAnnotation[];
  isCurrent: boolean;
}

export interface DocumentAnnotation {
  id: string;
  type: 'highlight' | 'note' | 'redaction' | 'signature' | 'stamp';
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  color?: string;
}

export interface DocumentPermission {
  userId: string;
  userName: string;
  role: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canDownload: boolean;
  canPrint: boolean;
  canAnnotate: boolean;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface DocumentAuditLog {
  id: string;
  documentId: string;
  action: 'created' | 'viewed' | 'downloaded' | 'edited' | 'deleted' | 'shared' | 'printed' | 'annotated';
  performedBy: string;
  performedByName: string;
  performedAt: Date;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, unknown>;
}

export interface Document {
  id: string;
  externalId?: string;
  organizationId: string;
  patientId?: string;
  encounterId?: string;
  metadata: DocumentMetadata;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  currentVersion: number;
  versions: DocumentVersion[];
  permissions: DocumentPermission[];
  auditLogs: DocumentAuditLog[];
  fileUrl: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  updatedAt: Date;
  updatedBy: string;
  updatedByName: string;
  deletedAt?: Date;
  deletedBy?: string;
  archivedAt?: Date;
  archivedBy?: string;
  expiresAt?: Date;
  retentionPolicy?: string;
  legalHold: boolean;
  relatedDocuments: string[];
  parentDocumentId?: string;
  workflowState?: string;
  reviewers: DocumentReviewer[];
  attachments: DocumentAttachment[];
}

export interface DocumentReviewer {
  userId: string;
  userName: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'recused';
  reviewedAt?: Date;
  comments?: string;
  signature?: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface DocumentSearchParams {
  query?: string;
  types?: DocumentType[];
  statuses?: DocumentStatus[];
  patientId?: string;
  encounterId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  organizationId?: string;
  accessLevel?: AccessLevel[];
  hasOcr?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'size' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentSearchResult {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: DocumentSearchFacets;
}

export interface DocumentSearchFacets {
  types: Record<DocumentType, number>;
  statuses: Record<DocumentStatus, number>;
  tags: Record<string, number>;
  accessLevels: Record<AccessLevel, number>;
  dateRanges: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    lastYear: number;
    older: number;
  };
}

export interface DocumentUploadOptions {
  organizationId: string;
  patientId?: string;
  encounterId?: string;
  type: DocumentType;
  title: string;
  description?: string;
  tags?: string[];
  accessLevel?: AccessLevel;
  performOcr?: boolean;
  encrypt?: boolean;
  expiresAt?: Date;
  retentionPolicy?: string;
}

export interface DocumentUploadProgress {
  documentId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'ocr' | 'completed' | 'failed';
  error?: string;
}

export interface BulkDocumentOperation {
  operationType: 'delete' | 'archive' | 'tag' | 'changeStatus' | 'changeAccessLevel';
  documentIds: string[];
  parameters?: Record<string, unknown>;
}

export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{
    documentId: string;
    error: string;
  }>;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  templateUrl: string;
  fields: TemplateField[];
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'signature' | 'checkbox' | 'dropdown';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: string;
  position: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRResult {
  documentId: string;
  versionId: string;
  status: 'success' | 'partial' | 'failed';
  confidence: number;
  extractedText: string;
  structuredData?: Record<string, unknown>;
  pages: OCRPage[];
  processingTime: number;
  ocrEngine: string;
  language: string;
  errors?: string[];
}

export interface OCRPage {
  pageNumber: number;
  text: string;
  confidence: number;
  blocks: OCRBlock[];
  tables?: OCRTable[];
  forms?: OCRForm[];
}

export interface OCRBlock {
  id: string;
  type: 'text' | 'title' | 'header' | 'footer' | 'table' | 'image';
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: OCRLine[];
}

export interface OCRLine {
  text: string;
  confidence: number;
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRTable {
  rows: number;
  columns: number;
  cells: OCRTableCell[][];
}

export interface OCRTableCell {
  rowIndex: number;
  columnIndex: number;
  text: string;
  confidence: number;
  rowSpan: number;
  columnSpan: number;
}

export interface OCRForm {
  fields: OCRFormField[];
}

export interface OCRFormField {
  key: string;
  value: string;
  confidence: number;
  type: 'text' | 'checkbox' | 'date' | 'signature';
}

export interface DocumentComparison {
  documentId1: string;
  documentId2: string;
  differences: DocumentDifference[];
  similarity: number;
  comparedAt: Date;
}

export interface DocumentDifference {
  type: 'addition' | 'deletion' | 'modification';
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  oldContent?: string;
  newContent?: string;
  description: string;
}
