/**
 * Carequality/Sequoia Integration
 * Implementation of Carequality framework for nationwide health information exchange
 * Based on IHE profiles: XCA, XCPD, XDS.b
 */

import type {
  CarequalityQuery,
  PatientDiscoveryRequest,
  PatientDiscoveryResponse,
  PatientMatch,
  DocumentQueryRequest,
  DocumentQueryResponse,
  DocumentMetadata,
} from "@/types/integrations";
import { db } from "@/lib/db";
import crypto from "crypto";

export interface CarequalityConfig {
  organizationId: string;
  homeCommunityId: string;
  certificatePath: string;
  certificatePassword: string;
  endpoint: string;
  timeout: number;
}

/**
 * Carequality Client
 */
export class CarequalityClient {
  constructor(private config: CarequalityConfig) {}

  /**
   * Patient Discovery (XCPD)
   * Cross-Community Patient Discovery
   */
  async patientDiscovery(request: PatientDiscoveryRequest): Promise<PatientDiscoveryResponse> {
    const queryId = generateQueryId();

    try {
      // Build XCPD request
      const xcpdRequest = this.buildXCPDRequest(request);

      // Send to Carequality network
      const response = await this.sendSOAPRequest(xcpdRequest, "urn:hl7-org:v3:PRPA_IN201305UV02");

      // Parse response
      const matches = this.parseXCPDResponse(response);

      // Log query
      await this.logQuery({
        id: queryId,
        patientId: request.demographics.firstName + request.demographics.lastName,
        queryType: "patient_discovery",
        status: "completed",
        request,
        response: matches,
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
        queryType: "patient_discovery",
        status: "failed",
        request,
        error: error.message,
        createdAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Document Query (XCA Query)
   * Cross-Community Access - Document Query
   */
  async documentQuery(request: DocumentQueryRequest): Promise<DocumentQueryResponse> {
    const queryId = generateQueryId();

    try {
      // Build XCA query request
      const xcaRequest = this.buildXCAQueryRequest(request);

      // Send to Carequality network
      const response = await this.sendSOAPRequest(
        xcaRequest,
        "urn:ihe:iti:2007:CrossGatewayQuery"
      );

      // Parse response
      const documents = this.parseXCAQueryResponse(response);

      // Log query
      await this.logQuery({
        id: queryId,
        patientId: request.patientId,
        queryType: "document_query",
        status: "completed",
        request,
        response: { documents },
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
        patientId: request.patientId,
        queryType: "document_query",
        status: "failed",
        request,
        error: error.message,
        createdAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Document Retrieve (XCA Retrieve)
   * Cross-Community Access - Document Retrieve
   */
  async documentRetrieve(
    documentId: string,
    repositoryId: string,
    homeCommunityId: string
  ): Promise<{
    documentId: string;
    mimeType: string;
    content: string;
  }> {
    const queryId = generateQueryId();

    try {
      // Build XCA retrieve request
      const xcaRequest = this.buildXCARetrieveRequest(documentId, repositoryId, homeCommunityId);

      // Send to Carequality network
      const response = await this.sendSOAPRequest(
        xcaRequest,
        "urn:ihe:iti:2007:CrossGatewayRetrieve"
      );

      // Parse response
      const document = this.parseXCARetrieveResponse(response);

      // Log query
      await this.logQuery({
        id: queryId,
        patientId: "",
        queryType: "document_retrieve",
        status: "completed",
        request: { documentId, repositoryId, homeCommunityId },
        response: { documentId: document.documentId },
        createdAt: new Date(),
      });

      return document;
    } catch (error: any) {
      await this.logQuery({
        id: queryId,
        patientId: "",
        queryType: "document_retrieve",
        status: "failed",
        request: { documentId, repositoryId, homeCommunityId },
        error: error.message,
        createdAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Build XCPD Request (Patient Discovery)
   */
  private buildXCPDRequest(request: PatientDiscoveryRequest): string {
    const { demographics } = request;

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <wsa:Action soap:mustUnderstand="1">urn:hl7-org:v3:PRPA_IN201305UV02</wsa:Action>
    <wsa:MessageID>${generateMessageId()}</wsa:MessageID>
  </soap:Header>
  <soap:Body>
    <PRPA_IN201305UV02 xmlns="urn:hl7-org:v3">
      <id root="${this.config.homeCommunityId}" extension="${generateQueryId()}"/>
      <creationTime value="${formatHL7DateTime(new Date())}"/>
      <interactionId root="2.16.840.1.113883.1.6" extension="PRPA_IN201305UV02"/>
      <processingCode code="P"/>
      <processingModeCode code="T"/>
      <acceptAckCode code="AL"/>
      <receiver>
        <device>
          <id root="2.16.840.1.113883.3.72.6.1"/>
        </device>
      </receiver>
      <sender>
        <device>
          <id root="${this.config.homeCommunityId}"/>
        </device>
      </sender>
      <controlActProcess>
        <code code="PRPA_TE201305UV02"/>
        <queryByParameter>
          <queryId root="${this.config.homeCommunityId}" extension="${generateQueryId()}"/>
          <statusCode code="new"/>
          <responsePriorityCode code="I"/>
          <parameterList>
            <livingSubjectName>
              <value>
                <given>${demographics.firstName}</given>
                <family>${demographics.lastName}</family>
              </value>
              <semanticsText>LivingSubject.name</semanticsText>
            </livingSubjectName>
            ${demographics.dateOfBirth ? `
            <livingSubjectBirthTime>
              <value value="${demographics.dateOfBirth.replace(/-/g, '')}"/>
              <semanticsText>LivingSubject.birthTime</semanticsText>
            </livingSubjectBirthTime>
            ` : ''}
            ${demographics.gender ? `
            <livingSubjectAdministrativeGender>
              <value code="${demographics.gender}"/>
              <semanticsText>LivingSubject.administrativeGender</semanticsText>
            </livingSubjectAdministrativeGender>
            ` : ''}
            ${demographics.ssn ? `
            <livingSubjectId>
              <value root="2.16.840.1.113883.4.1" extension="${demographics.ssn}"/>
              <semanticsText>LivingSubject.id</semanticsText>
            </livingSubjectId>
            ` : ''}
          </parameterList>
        </queryByParameter>
      </controlActProcess>
    </PRPA_IN201305UV02>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Build XCA Query Request (Document Query)
   */
  private buildXCAQueryRequest(request: DocumentQueryRequest): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <wsa:Action soap:mustUnderstand="1">urn:ihe:iti:2007:CrossGatewayQuery</wsa:Action>
    <wsa:MessageID>${generateMessageId()}</wsa:MessageID>
  </soap:Header>
  <soap:Body>
    <AdhocQueryRequest xmlns="urn:oasis:names:tc:ebxml-regrep:xsd:query:3.0">
      <AdhocQuery id="urn:uuid:14d4debf-8f97-4251-9a74-a90016b0af0d">
        <Slot name="$XDSDocumentEntryPatientId">
          <ValueList>
            <Value>'${request.patientId}^^^&amp;${request.organizationId}&amp;ISO'</Value>
          </ValueList>
        </Slot>
        ${request.startDate ? `
        <Slot name="$XDSDocumentEntryCreationTimeFrom">
          <ValueList>
            <Value>${formatHL7DateTime(request.startDate)}</Value>
          </ValueList>
        </Slot>
        ` : ''}
        ${request.endDate ? `
        <Slot name="$XDSDocumentEntryCreationTimeTo">
          <ValueList>
            <Value>${formatHL7DateTime(request.endDate)}</Value>
          </ValueList>
        </Slot>
        ` : ''}
        <Slot name="$XDSDocumentEntryStatus">
          <ValueList>
            <Value>('urn:oasis:names:tc:ebxml-regrep:StatusType:Approved')</Value>
          </ValueList>
        </Slot>
      </AdhocQuery>
      <ResponseOption returnComposedObjects="true" returnType="LeafClass"/>
    </AdhocQueryRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Build XCA Retrieve Request (Document Retrieve)
   */
  private buildXCARetrieveRequest(
    documentId: string,
    repositoryId: string,
    homeCommunityId: string
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <wsa:Action soap:mustUnderstand="1">urn:ihe:iti:2007:CrossGatewayRetrieve</wsa:Action>
    <wsa:MessageID>${generateMessageId()}</wsa:MessageID>
  </soap:Header>
  <soap:Body>
    <RetrieveDocumentSetRequest xmlns="urn:ihe:iti:xds-b:2007">
      <DocumentRequest>
        <HomeCommunityId>${homeCommunityId}</HomeCommunityId>
        <RepositoryUniqueId>${repositoryId}</RepositoryUniqueId>
        <DocumentUniqueId>${documentId}</DocumentUniqueId>
      </DocumentRequest>
    </RetrieveDocumentSetRequest>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Parse XCPD Response
   */
  private parseXCPDResponse(response: string): PatientMatch[] {
    // Simplified parsing - would use proper XML parser in production
    const matches: PatientMatch[] = [];

    // Extract patient matches from HL7v3 response
    // This is a simplified version - actual implementation would parse full HL7v3 XML

    return matches;
  }

  /**
   * Parse XCA Query Response
   */
  private parseXCAQueryResponse(response: string): DocumentMetadata[] {
    // Simplified parsing - would use proper XML parser in production
    const documents: DocumentMetadata[] = [];

    // Extract document metadata from ebXML response
    // This is a simplified version - actual implementation would parse full ebXML

    return documents;
  }

  /**
   * Parse XCA Retrieve Response
   */
  private parseXCARetrieveResponse(response: string): {
    documentId: string;
    mimeType: string;
    content: string;
  } {
    // Simplified parsing - would use proper XML parser in production
    return {
      documentId: "",
      mimeType: "text/xml",
      content: response,
    };
  }

  /**
   * Send SOAP request
   */
  private async sendSOAPRequest(body: string, soapAction: string): Promise<string> {
    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/soap+xml",
        "SOAPAction": soapAction,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`SOAP request failed: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Log query
   */
  private async logQuery(query: CarequalityQuery): Promise<void> {
    try {
      await db.carequalityQuery.create({
        data: query as any,
      });
    } catch (error) {
      console.error("Error logging Carequality query:", error);
    }
  }
}

/**
 * Helper functions
 */

function generateQueryId(): string {
  return crypto.randomUUID();
}

function generateMessageId(): string {
  return `urn:uuid:${crypto.randomUUID()}`;
}

function formatHL7DateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}${second}`;
}

/**
 * Create Carequality client
 */
export function createCarequalityClient(config: CarequalityConfig): CarequalityClient {
  return new CarequalityClient(config);
}
