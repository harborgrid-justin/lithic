/**
 * CommonWell Health Alliance Integration
 * Implementation of CommonWell APIs for health information exchange
 */

import type {
  CommonWellEnrollment,
  CommonWellQuery,
  PatientDiscoveryRequest,
  PatientDiscoveryResponse,
  DocumentQueryResponse,
} from "@/types/integrations";
import { db } from "@/lib/db";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export interface CommonWellConfig {
  organizationId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  environment: "production" | "sandbox";
}

/**
 * CommonWell Client
 */
export class CommonWellClient {
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(private config: CommonWellConfig) {}

  /**
   * Enroll patient in CommonWell
   */
  async enrollPatient(patientId: string, demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    ssn?: string;
    address?: any;
  }): Promise<CommonWellEnrollment> {
    await this.ensureAuthenticated();

    try {
      // Create person in CommonWell
      const person = await this.createPerson(demographics);

      // Link patient to person
      await this.linkPatient(patientId, person.id);

      // Create enrollment record
      const enrollment: CommonWellEnrollment = {
        id: crypto.randomUUID(),
        patientId,
        commonwellId: person.id,
        status: "active",
        consentStatus: "granted",
        enrolledAt: new Date(),
        updatedAt: new Date(),
      };

      // Store enrollment
      await db.commonWellEnrollment.create({
        data: enrollment as any,
      });

      return enrollment;
    } catch (error: any) {
      throw new Error(`Failed to enroll patient: ${error.message}`);
    }
  }

  /**
   * Search for person (patient discovery)
   */
  async personSearch(request: PatientDiscoveryRequest): Promise<PatientDiscoveryResponse> {
    await this.ensureAuthenticated();

    const queryId = crypto.randomUUID();

    try {
      const response = await this.makeRequest("POST", "/v1/person/search", {
        demographics: {
          name: {
            given: [request.demographics.firstName],
            family: request.demographics.lastName,
          },
          birthDate: request.demographics.dateOfBirth,
          gender: request.demographics.gender,
          identifier: request.demographics.ssn ? [{
            system: "http://hl7.org/fhir/sid/us-ssn",
            value: request.demographics.ssn,
          }] : undefined,
        },
      });

      const matches = response.entry?.map((entry: any) => ({
        patientId: entry.resource.id,
        organizationId: entry.resource.managingOrganization?.reference || "",
        organizationName: entry.resource.managingOrganization?.display || "",
        matchScore: entry.search?.score || 0,
        demographics: entry.resource,
        identifiers: entry.resource.identifier || [],
      })) || [];

      // Log query
      await this.logQuery({
        id: queryId,
        patientId: request.demographics.firstName + request.demographics.lastName,
        queryType: "person",
        status: "completed",
        results: matches,
        createdAt: new Date(),
      });

      return {
        matches,
        queryId,
        timestamp: new Date(),
      };
    } catch (error: any) {
      await this.logQuery({
        id: queryId,
        patientId: request.demographics.firstName + request.demographics.lastName,
        queryType: "person",
        status: "failed",
        error: error.message,
        createdAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Get patient documents
   */
  async getDocuments(commonwellId: string): Promise<DocumentQueryResponse> {
    await this.ensureAuthenticated();

    const queryId = crypto.randomUUID();

    try {
      const response = await this.makeRequest("GET", `/v1/person/${commonwellId}/documents`);

      const documents = response.entry?.map((entry: any) => ({
        documentId: entry.resource.id,
        repositoryId: entry.resource.content?.[0]?.attachment?.url || "",
        title: entry.resource.description || entry.resource.type?.text || "Document",
        creationTime: new Date(entry.resource.date),
        author: entry.resource.author?.map((a: any) => a.display) || [],
        classCode: entry.resource.class,
        typeCode: entry.resource.type,
        mimeType: entry.resource.content?.[0]?.attachment?.contentType || "application/pdf",
        size: entry.resource.content?.[0]?.attachment?.size,
      })) || [];

      // Log query
      await this.logQuery({
        id: queryId,
        patientId: commonwellId,
        queryType: "document",
        status: "completed",
        results: documents,
        createdAt: new Date(),
      });

      return {
        documents,
        queryId,
        timestamp: new Date(),
      };
    } catch (error: any) {
      await this.logQuery({
        id: queryId,
        patientId: commonwellId,
        queryType: "document",
        status: "failed",
        error: error.message,
        createdAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Retrieve document
   */
  async retrieveDocument(
    commonwellId: string,
    documentId: string
  ): Promise<{
    documentId: string;
    mimeType: string;
    content: string;
  }> {
    await this.ensureAuthenticated();

    try {
      const response = await this.makeRequest(
        "GET",
        `/v1/person/${commonwellId}/documents/${documentId}`
      );

      const content = response.content?.[0]?.attachment?.data || "";
      const mimeType = response.content?.[0]?.attachment?.contentType || "application/pdf";

      return {
        documentId,
        mimeType,
        content,
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  /**
   * Upload document
   */
  async uploadDocument(
    commonwellId: string,
    document: {
      title: string;
      mimeType: string;
      content: string; // Base64 encoded
      type?: any;
      class?: any;
    }
  ): Promise<string> {
    await this.ensureAuthenticated();

    try {
      const response = await this.makeRequest("POST", `/v1/person/${commonwellId}/documents`, {
        resourceType: "DocumentReference",
        status: "current",
        description: document.title,
        type: document.type,
        class: document.class,
        subject: {
          reference: `Person/${commonwellId}`,
        },
        date: new Date().toISOString(),
        content: [
          {
            attachment: {
              contentType: document.mimeType,
              data: document.content,
              title: document.title,
            },
          },
        ],
      });

      return response.id;
    } catch (error: any) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Get patient encounters
   */
  async getEncounters(commonwellId: string): Promise<any[]> {
    await this.ensureAuthenticated();

    try {
      const response = await this.makeRequest("GET", `/v1/person/${commonwellId}/encounters`);

      return response.entry?.map((entry: any) => entry.resource) || [];
    } catch (error: any) {
      throw new Error(`Failed to get encounters: ${error.message}`);
    }
  }

  /**
   * Unenroll patient
   */
  async unenrollPatient(patientId: string): Promise<void> {
    const enrollment = await db.commonWellEnrollment.findFirst({
      where: { patientId },
    });

    if (!enrollment) {
      throw new Error("Patient not enrolled in CommonWell");
    }

    await this.ensureAuthenticated();

    try {
      // Delete person link in CommonWell
      await this.makeRequest("DELETE", `/v1/person/${enrollment.commonwellId}/links/${patientId}`);

      // Update enrollment status
      await db.commonWellEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "terminated",
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to unenroll patient: ${error.message}`);
    }
  }

  /**
   * Update consent
   */
  async updateConsent(
    patientId: string,
    consentStatus: "granted" | "denied"
  ): Promise<void> {
    const enrollment = await db.commonWellEnrollment.findFirst({
      where: { patientId },
    });

    if (!enrollment) {
      throw new Error("Patient not enrolled in CommonWell");
    }

    await this.ensureAuthenticated();

    try {
      // Update consent in CommonWell
      await this.makeRequest("PUT", `/v1/person/${enrollment.commonwellId}/consent`, {
        status: consentStatus === "granted" ? "active" : "rejected",
        scope: {
          coding: [
            {
              system: "http://loinc.org",
              code: "59284-0",
              display: "Patient Consent",
            },
          ],
        },
        patient: {
          reference: `Person/${enrollment.commonwellId}`,
        },
      });

      // Update local record
      await db.commonWellEnrollment.update({
        where: { id: enrollment.id },
        data: {
          consentStatus,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to update consent: ${error.message}`);
    }
  }

  /**
   * Private helper methods
   */

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    await this.authenticate();
  }

  private async authenticate(): Promise<void> {
    // Generate JWT assertion
    const assertion = jwt.sign(
      {
        iss: this.config.organizationId,
        sub: this.config.apiKey,
        aud: `${this.config.baseUrl}/v1/oauth/token`,
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        jti: crypto.randomUUID(),
      },
      this.config.apiSecret,
      { algorithm: "HS256" }
    );

    const response = await fetch(`${this.config.baseUrl}/v1/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  }

  private async makeRequest(method: string, path: string, body?: any): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    const url = `${this.config.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Request failed: ${response.statusText} - ${error}`);
    }

    return await response.json();
  }

  private async createPerson(demographics: any): Promise<{ id: string }> {
    const response = await this.makeRequest("POST", "/v1/person", {
      resourceType: "Person",
      name: [
        {
          given: [demographics.firstName],
          family: demographics.lastName,
        },
      ],
      birthDate: demographics.dateOfBirth,
      gender: demographics.gender,
      identifier: demographics.ssn ? [
        {
          system: "http://hl7.org/fhir/sid/us-ssn",
          value: demographics.ssn,
        },
      ] : undefined,
      address: demographics.address ? [demographics.address] : undefined,
    });

    return { id: response.id };
  }

  private async linkPatient(patientId: string, personId: string): Promise<void> {
    await this.makeRequest("POST", `/v1/person/${personId}/links`, {
      patient: {
        reference: `Patient/${patientId}`,
      },
      organization: {
        reference: `Organization/${this.config.organizationId}`,
      },
    });
  }

  private async logQuery(query: CommonWellQuery): Promise<void> {
    try {
      await db.commonWellQuery.create({
        data: query as any,
      });
    } catch (error) {
      console.error("Error logging CommonWell query:", error);
    }
  }
}

/**
 * Create CommonWell client
 */
export function createCommonWellClient(config: CommonWellConfig): CommonWellClient {
  return new CommonWellClient(config);
}
