/**
 * Document Query Service
 * IHE XCA (Cross-Community Access) document query and retrieve
 * Aggregates documents from multiple HIEs
 */

import type {
  DocumentQueryRequest,
  DocumentQueryResponse,
  DocumentMetadata,
} from "@/types/integrations";
import { createCarequalityClient, type CarequalityConfig } from "./carequality";
import { createCommonWellClient, type CommonWellConfig } from "./commonwell";
import { db } from "@/lib/db";
import crypto from "crypto";

export interface DocumentQueryConfig {
  carequality?: CarequalityConfig;
  commonwell?: CommonWellConfig;
  timeout?: number;
  maxDocuments?: number;
}

/**
 * Document Query Service
 */
export class DocumentQueryService {
  private carequalityClient?: ReturnType<typeof createCarequalityClient>;
  private commonwellClient?: ReturnType<typeof createCommonWellClient>;

  constructor(private config: DocumentQueryConfig) {
    if (config.carequality) {
      this.carequalityClient = createCarequalityClient(config.carequality);
    }

    if (config.commonwell) {
      this.commonwellClient = createCommonWellClient(config.commonwell);
    }
  }

  /**
   * Query documents across all HIEs
   */
  async queryDocuments(request: DocumentQueryRequest): Promise<DocumentQueryResponse> {
    const allDocuments: DocumentMetadata[] = [];
    const errors: string[] = [];

    // Query in parallel
    const queries: Promise<DocumentMetadata[]>[] = [];

    if (this.carequalityClient) {
      queries.push(
        this.queryCarequalityDocuments(request).catch((error) => {
          errors.push(`Carequality: ${error.message}`);
          return [];
        })
      );
    }

    if (this.commonwellClient) {
      queries.push(
        this.queryCommonWellDocuments(request).catch((error) => {
          errors.push(`CommonWell: ${error.message}`);
          return [];
        })
      );
    }

    // Wait for all queries to complete
    const queryResults = await Promise.all(queries);

    // Combine results
    for (const documents of queryResults) {
      allDocuments.push(...documents);
    }

    // Remove duplicates
    const uniqueDocuments = this.deduplicateDocuments(allDocuments);

    // Apply filters
    const filteredDocuments = this.filterDocuments(uniqueDocuments, request);

    // Sort by creation time (newest first)
    filteredDocuments.sort(
      (a, b) => b.creationTime.getTime() - a.creationTime.getTime()
    );

    // Limit results
    const maxDocs = this.config.maxDocuments || 100;
    const limitedDocuments = filteredDocuments.slice(0, maxDocs);

    return {
      documents: limitedDocuments,
      queryId: crypto.randomUUID(),
      timestamp: new Date(),
    };
  }

  /**
   * Retrieve document
   */
  async retrieveDocument(
    documentId: string,
    repositoryId: string,
    source: "carequality" | "commonwell"
  ): Promise<{
    documentId: string;
    mimeType: string;
    content: string;
  }> {
    if (source === "carequality" && this.carequalityClient) {
      // Extract home community ID from repository ID
      const homeCommunityId = this.extractHomeCommunityId(repositoryId);

      return await this.carequalityClient.documentRetrieve(
        documentId,
        repositoryId,
        homeCommunityId
      );
    }

    if (source === "commonwell" && this.commonwellClient) {
      // Extract CommonWell person ID
      const personId = this.extractPersonId(repositoryId);

      return await this.commonwellClient.retrieveDocument(personId, documentId);
    }

    throw new Error(`Unsupported source: ${source}`);
  }

  /**
   * Store retrieved document locally
   */
  async storeDocument(
    patientId: string,
    document: {
      documentId: string;
      mimeType: string;
      content: string;
      metadata?: DocumentMetadata;
    }
  ): Promise<string> {
    const stored = await db.document.create({
      data: {
        patientId,
        externalDocumentId: document.documentId,
        mimeType: document.mimeType,
        content: document.content,
        title: document.metadata?.title || "External Document",
        createdAt: document.metadata?.creationTime || new Date(),
        metadata: JSON.stringify(document.metadata),
      },
    });

    return stored.id;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<any> {
    return await db.document.findUnique({
      where: { id: documentId },
    });
  }

  /**
   * List patient documents
   */
  async listPatientDocuments(
    patientId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      documentType?: string[];
    }
  ): Promise<DocumentMetadata[]> {
    const documents = await db.document.findMany({
      where: {
        patientId,
        ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
      },
      orderBy: { createdAt: "desc" },
    });

    return documents.map((doc) => ({
      documentId: doc.id,
      repositoryId: "local",
      title: doc.title,
      creationTime: doc.createdAt,
      mimeType: doc.mimeType,
      size: doc.content?.length || 0,
    }));
  }

  /**
   * Private helper methods
   */

  private async queryCarequalityDocuments(
    request: DocumentQueryRequest
  ): Promise<DocumentMetadata[]> {
    if (!this.carequalityClient) {
      return [];
    }

    const response = await this.carequalityClient.documentQuery(request);
    return response.documents;
  }

  private async queryCommonWellDocuments(
    request: DocumentQueryRequest
  ): Promise<DocumentMetadata[]> {
    if (!this.commonwellClient) {
      return [];
    }

    // Get CommonWell ID for patient
    const enrollment = await db.commonWellEnrollment.findFirst({
      where: { patientId: request.patientId },
    });

    if (!enrollment) {
      return [];
    }

    const response = await this.commonwellClient.getDocuments(enrollment.commonwellId);
    return response.documents;
  }

  private deduplicateDocuments(documents: DocumentMetadata[]): DocumentMetadata[] {
    const seen = new Map<string, DocumentMetadata>();

    for (const doc of documents) {
      const key = `${doc.repositoryId}:${doc.documentId}`;

      if (!seen.has(key)) {
        seen.set(key, doc);
      }
    }

    return Array.from(seen.values());
  }

  private filterDocuments(
    documents: DocumentMetadata[],
    request: DocumentQueryRequest
  ): DocumentMetadata[] {
    let filtered = documents;

    // Filter by date range
    if (request.startDate) {
      filtered = filtered.filter((doc) => doc.creationTime >= request.startDate!);
    }

    if (request.endDate) {
      filtered = filtered.filter((doc) => doc.creationTime <= request.endDate!);
    }

    // Filter by document type
    if (request.documentType && request.documentType.length > 0) {
      filtered = filtered.filter((doc) =>
        request.documentType!.some((type) =>
          doc.typeCode?.coding?.some((c) => c.code === type)
        )
      );
    }

    // Filter by class code
    if (request.classCode && request.classCode.length > 0) {
      filtered = filtered.filter((doc) =>
        request.classCode!.some((code) =>
          doc.classCode?.coding?.some((c) => c.code === code)
        )
      );
    }

    // Filter by practice setting
    if (request.practiceSettingCode && request.practiceSettingCode.length > 0) {
      // Would filter by practice setting if available in metadata
    }

    return filtered;
  }

  private extractHomeCommunityId(repositoryId: string): string {
    // Extract home community ID from repository ID
    // Format: urn:oid:2.16.840.1.113883.x.x.x
    return repositoryId.split(":").slice(0, -1).join(":");
  }

  private extractPersonId(repositoryId: string): string {
    // Extract person ID from repository ID
    return repositoryId.split(":").pop() || "";
  }
}

/**
 * Document Type Codes (LOINC)
 */
export const DOCUMENT_TYPE_CODES = {
  CCD: "34133-9", // Continuity of Care Document
  DISCHARGE_SUMMARY: "18842-5",
  HISTORY_AND_PHYSICAL: "34117-2",
  CONSULTATION_NOTE: "11488-4",
  PROGRESS_NOTE: "11506-3",
  OPERATIVE_NOTE: "11504-8",
  PROCEDURE_NOTE: "28570-0",
  RADIOLOGY_REPORT: "18748-4",
  PATHOLOGY_REPORT: "11526-1",
  LAB_REPORT: "11502-2",
  IMMUNIZATION_RECORD: "87273-9",
  MEDICATION_LIST: "10160-0",
  PROBLEM_LIST: "11450-4",
  ALLERGY_LIST: "48765-2",
};

/**
 * Document Class Codes
 */
export const DOCUMENT_CLASS_CODES = {
  CLINICAL_NOTE: "Clinical Note",
  DIAGNOSTIC_IMAGE: "Diagnostic Imaging",
  LABORATORY: "Laboratory",
  PATHOLOGY: "Pathology",
  RADIOLOGY: "Radiology",
  SUMMARY: "Summary",
};

/**
 * Parse CCD (C-CDA) Document
 */
export function parseCCDDocument(ccdXml: string): {
  patient: any;
  sections: Array<{
    title: string;
    code: string;
    content: any;
  }>;
} {
  // Simplified CCD parsing - would use proper XML/CDA parser in production
  return {
    patient: {},
    sections: [],
  };
}

/**
 * Extract FHIR resources from CCD
 */
export function extractFHIRFromCCD(ccdXml: string): any[] {
  // Convert CCD to FHIR resources
  // Would use proper CDA-to-FHIR transformation in production
  return [];
}

/**
 * Document Search Index
 */
export class DocumentSearchIndex {
  private index: Map<string, Set<string>> = new Map();

  /**
   * Index document
   */
  indexDocument(documentId: string, content: string): void {
    const words = this.tokenize(content);

    for (const word of words) {
      if (!this.index.has(word)) {
        this.index.set(word, new Set());
      }

      this.index.get(word)!.add(documentId);
    }
  }

  /**
   * Search documents
   */
  search(query: string): string[] {
    const words = this.tokenize(query);
    const results = new Set<string>();

    for (const word of words) {
      const docs = this.index.get(word);

      if (docs) {
        docs.forEach((doc) => results.add(doc));
      }
    }

    return Array.from(results);
  }

  /**
   * Tokenize text
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2);
  }
}

/**
 * Create document query service
 */
export function createDocumentQueryService(config: DocumentQueryConfig): DocumentQueryService {
  return new DocumentQueryService(config);
}
