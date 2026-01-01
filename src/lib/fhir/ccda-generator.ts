/**
 * CCD/C-CDA Document Generator
 * Generate Consolidated Clinical Document Architecture (C-CDA) documents
 * Based on HL7 CDA R2 and C-CDA specifications
 */

export interface CCDAPatient {
  id: string;
  mrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "M" | "F" | "UN";
  race?: string;
  ethnicity?: string;
  language?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}

export interface CCDAProvider {
  id: string;
  npi?: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface CCDAOrganization {
  id: string;
  name: string;
  npi?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface CCDAAllergy {
  id: string;
  substance: string;
  substanceCode?: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe";
  status: "active" | "inactive" | "resolved";
  onsetDate?: Date;
}

export interface CCDAMedication {
  id: string;
  name: string;
  code?: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  status: "active" | "completed" | "discontinued";
  startDate?: Date;
  endDate?: Date;
  prescriber?: string;
}

export interface CCDAProblem {
  id: string;
  name: string;
  code?: string;
  codeSystem?: string;
  status: "active" | "inactive" | "resolved";
  onsetDate?: Date;
  resolvedDate?: Date;
}

export interface CCDAProcedure {
  id: string;
  name: string;
  code?: string;
  codeSystem?: string;
  performedDate: Date;
  performer?: string;
  status: "completed" | "aborted";
}

export interface CCDAVitalSign {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: Date;
}

export interface CCDALabResult {
  id: string;
  name: string;
  code?: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  interpretation?: string;
  date: Date;
}

export interface CCDADocument {
  documentId: string;
  versionNumber?: number;
  creationTime: Date;
  patient: CCDAPatient;
  author: CCDAProvider;
  custodian: CCDAOrganization;
  documentationOf?: {
    serviceEvent: {
      effectiveTime: {
        low: Date;
        high?: Date;
      };
      performer?: CCDAProvider;
    };
  };
  allergies?: CCDAAllergy[];
  medications?: CCDAMedication[];
  problems?: CCDAProblem[];
  procedures?: CCDAProcedure[];
  vitalSigns?: CCDAVitalSign[];
  labResults?: CCDALabResult[];
}

/**
 * CCD/C-CDA Generator
 */
export class CCDAGenerator {
  private xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

  /**
   * Generate C-CDA Continuity of Care Document (CCD)
   */
  generateCCD(document: CCDADocument): string {
    const xml: string[] = [this.xmlHeader];

    xml.push(this.generateClinicalDocument(document));

    return xml.join("\n");
  }

  /**
   * Generate Clinical Document wrapper
   */
  private generateClinicalDocument(doc: CCDADocument): string {
    return `
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:sdtc="urn:hl7-org:sdtc">
  ${this.generateDocumentHeader(doc)}
  ${this.generateRecordTarget(doc.patient)}
  ${this.generateAuthor(doc.author, doc.creationTime)}
  ${this.generateCustodian(doc.custodian)}
  ${doc.documentationOf ? this.generateDocumentationOf(doc.documentationOf) : ""}
  ${this.generateComponentOf()}
  ${this.generateComponent(doc)}
</ClinicalDocument>`.trim();
  }

  /**
   * Generate document header
   */
  private generateDocumentHeader(doc: CCDADocument): string {
    return `
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.1" extension="2015-08-01"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.2" extension="2015-08-01"/>
  <id root="2.16.840.1.113883.19.5" extension="${this.escape(doc.documentId)}"/>
  <code code="34133-9" displayName="Summarization of Episode Note" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
  <title>Continuity of Care Document</title>
  <effectiveTime value="${this.formatDateTime(doc.creationTime)}"/>
  <confidentialityCode code="N" displayName="normal" codeSystem="2.16.840.1.113883.5.25" codeSystemName="ConfidentialityCode"/>
  <languageCode code="en-US"/>
  <versionNumber value="${doc.versionNumber || 1}"/>`.trim();
  }

  /**
   * Generate record target (patient information)
   */
  private generateRecordTarget(patient: CCDAPatient): string {
    return `
  <recordTarget>
    <patientRole>
      <id extension="${this.escape(patient.mrn)}" root="2.16.840.1.113883.19.5"/>
      ${this.generateAddress(patient)}
      ${this.generateTelecom(patient)}
      <patient>
        ${this.generatePatientName(patient)}
        <administrativeGenderCode code="${patient.gender}" displayName="${this.getGenderDisplay(patient.gender)}" codeSystem="2.16.840.1.113883.5.1" codeSystemName="AdministrativeGender"/>
        <birthTime value="${this.formatDate(patient.dateOfBirth)}"/>
        ${patient.maritalStatus ? `<maritalStatusCode code="${patient.maritalStatus}" codeSystem="2.16.840.1.113883.5.2" codeSystemName="MaritalStatus"/>` : ""}
        ${patient.race ? `<raceCode code="${patient.race}" codeSystem="2.16.840.1.113883.6.238" codeSystemName="Race &amp; Ethnicity - CDC"/>` : ""}
        ${patient.ethnicity ? `<ethnicGroupCode code="${patient.ethnicity}" codeSystem="2.16.840.1.113883.6.238" codeSystemName="Race &amp; Ethnicity - CDC"/>` : ""}
        ${patient.language ? `<languageCommunication><languageCode code="${patient.language}"/></languageCommunication>` : ""}
      </patient>
    </patientRole>
  </recordTarget>`.trim();
  }

  /**
   * Generate author information
   */
  private generateAuthor(author: CCDAProvider, time: Date): string {
    return `
  <author>
    <time value="${this.formatDateTime(time)}"/>
    <assignedAuthor>
      <id extension="${this.escape(author.id)}" root="2.16.840.1.113883.19.5"/>
      ${author.npi ? `<id extension="${this.escape(author.npi)}" root="2.16.840.1.113883.4.6"/>` : ""}
      ${this.generateProviderAddress(author)}
      ${this.generateProviderTelecom(author)}
      <assignedPerson>
        <name>
          <given>${this.escape(author.firstName)}</given>
          <family>${this.escape(author.lastName)}</family>
        </name>
      </assignedPerson>
    </assignedAuthor>
  </author>`.trim();
  }

  /**
   * Generate custodian (organization)
   */
  private generateCustodian(org: CCDAOrganization): string {
    return `
  <custodian>
    <assignedCustodian>
      <representedCustodianOrganization>
        <id extension="${this.escape(org.id)}" root="2.16.840.1.113883.19.5"/>
        ${org.npi ? `<id extension="${this.escape(org.npi)}" root="2.16.840.1.113883.4.6"/>` : ""}
        <name>${this.escape(org.name)}</name>
        ${this.generateOrgTelecom(org)}
        ${this.generateOrgAddress(org)}
      </representedCustodianOrganization>
    </assignedCustodian>
  </custodian>`.trim();
  }

  /**
   * Generate documentation of
   */
  private generateDocumentationOf(
    docOf: NonNullable<CCDADocument["documentationOf"]>,
  ): string {
    return `
  <documentationOf>
    <serviceEvent classCode="PCPR">
      <effectiveTime>
        <low value="${this.formatDateTime(docOf.serviceEvent.effectiveTime.low)}"/>
        ${docOf.serviceEvent.effectiveTime.high ? `<high value="${this.formatDateTime(docOf.serviceEvent.effectiveTime.high)}"/>` : ""}
      </effectiveTime>
      ${docOf.serviceEvent.performer ? this.generatePerformer(docOf.serviceEvent.performer) : ""}
    </serviceEvent>
  </documentationOf>`.trim();
  }

  /**
   * Generate component of
   */
  private generateComponentOf(): string {
    return `
  <componentOf>
    <encompassingEncounter>
      <id root="2.16.840.1.113883.19.5" extension="encounter-1"/>
      <effectiveTime>
        <low nullFlavor="NI"/>
        <high nullFlavor="NI"/>
      </effectiveTime>
    </encompassingEncounter>
  </componentOf>`.trim();
  }

  /**
   * Generate body component with all sections
   */
  private generateComponent(doc: CCDADocument): string {
    return `
  <component>
    <structuredBody>
      ${doc.allergies ? this.generateAllergiesSection(doc.allergies) : ""}
      ${doc.medications ? this.generateMedicationsSection(doc.medications) : ""}
      ${doc.problems ? this.generateProblemsSection(doc.problems) : ""}
      ${doc.procedures ? this.generateProceduresSection(doc.procedures) : ""}
      ${doc.vitalSigns ? this.generateVitalSignsSection(doc.vitalSigns) : ""}
      ${doc.labResults ? this.generateLabResultsSection(doc.labResults) : ""}
    </structuredBody>
  </component>`.trim();
  }

  /**
   * Generate allergies section
   */
  private generateAllergiesSection(allergies: CCDAAllergy[]): string {
    return `
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.6.1" extension="2015-08-01"/>
          <code code="48765-2" displayName="Allergies, adverse reactions, alerts" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>Allergies and Adverse Reactions</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr><th>Substance</th><th>Reaction</th><th>Severity</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${allergies.map((a) => `<tr><td>${this.escape(a.substance)}</td><td>${this.escape(a.reaction || "")}</td><td>${this.escape(a.severity || "")}</td><td>${this.escape(a.status)}</td></tr>`).join("\n                ")}
              </tbody>
            </table>
          </text>
          ${allergies.map((a) => this.generateAllergyEntry(a)).join("\n          ")}
        </section>
      </component>`;
  }

  /**
   * Generate allergy entry
   */
  private generateAllergyEntry(allergy: CCDAAllergy): string {
    return `
          <entry typeCode="DRIV">
            <act classCode="ACT" moodCode="EVN">
              <templateId root="2.16.840.1.113883.10.20.22.4.30" extension="2015-08-01"/>
              <id root="2.16.840.1.113883.19.5" extension="${this.escape(allergy.id)}"/>
              <code code="CONC" codeSystem="2.16.840.1.113883.5.6"/>
              <statusCode code="${allergy.status === "active" ? "active" : "completed"}"/>
              ${allergy.onsetDate ? `<effectiveTime><low value="${this.formatDate(allergy.onsetDate)}"/></effectiveTime>` : ""}
              <entryRelationship typeCode="SUBJ">
                <observation classCode="OBS" moodCode="EVN">
                  <templateId root="2.16.840.1.113883.10.20.22.4.7" extension="2014-06-09"/>
                  <id root="2.16.840.1.113883.19.5" extension="${this.escape(allergy.id)}-obs"/>
                  <code code="ASSERTION" codeSystem="2.16.840.1.113883.5.4"/>
                  <statusCode code="completed"/>
                  <value xsi:type="CD" code="${allergy.substanceCode || "419511003"}" displayName="${this.escape(allergy.substance)}" codeSystem="2.16.840.1.113883.6.96" codeSystemName="SNOMED CT"/>
                  ${
                    allergy.reaction
                      ? `
                  <entryRelationship typeCode="MFST" inversionInd="true">
                    <observation classCode="OBS" moodCode="EVN">
                      <templateId root="2.16.840.1.113883.10.20.22.4.9" extension="2014-06-09"/>
                      <code code="ASSERTION" codeSystem="2.16.840.1.113883.5.4"/>
                      <text>${this.escape(allergy.reaction)}</text>
                      <statusCode code="completed"/>
                      <value xsi:type="CD" nullFlavor="OTH"><originalText>${this.escape(allergy.reaction)}</originalText></value>
                    </observation>
                  </entryRelationship>`
                      : ""
                  }
                  ${
                    allergy.severity
                      ? `
                  <entryRelationship typeCode="SUBJ" inversionInd="true">
                    <observation classCode="OBS" moodCode="EVN">
                      <templateId root="2.16.840.1.113883.10.20.22.4.8" extension="2014-06-09"/>
                      <code code="SEV" codeSystem="2.16.840.1.113883.5.4"/>
                      <text>${this.escape(allergy.severity)}</text>
                      <statusCode code="completed"/>
                      <value xsi:type="CD" code="${this.getSeverityCode(allergy.severity)}" displayName="${this.escape(allergy.severity)}" codeSystem="2.16.840.1.113883.6.96"/>
                    </observation>
                  </entryRelationship>`
                      : ""
                  }
                </observation>
              </entryRelationship>
            </act>
          </entry>`;
  }

  /**
   * Generate medications section
   */
  private generateMedicationsSection(medications: CCDAMedication[]): string {
    return `
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.1.1" extension="2014-06-09"/>
          <code code="10160-0" displayName="History of Medication use Narrative" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>Medications</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr><th>Medication</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${medications.map((m) => `<tr><td>${this.escape(m.name)}</td><td>${this.escape(m.dosage || "")}</td><td>${this.escape(m.route || "")}</td><td>${this.escape(m.frequency || "")}</td><td>${this.escape(m.status)}</td></tr>`).join("\n                ")}
              </tbody>
            </table>
          </text>
          ${medications.map((m) => this.generateMedicationEntry(m)).join("\n          ")}
        </section>
      </component>`;
  }

  /**
   * Generate medication entry
   */
  private generateMedicationEntry(med: CCDAMedication): string {
    return `
          <entry typeCode="DRIV">
            <substanceAdministration classCode="SBADM" moodCode="EVN">
              <templateId root="2.16.840.1.113883.10.20.22.4.16" extension="2014-06-09"/>
              <id root="2.16.840.1.113883.19.5" extension="${this.escape(med.id)}"/>
              <statusCode code="${med.status === "active" ? "active" : "completed"}"/>
              ${med.startDate || med.endDate ? `<effectiveTime xsi:type="IVL_TS">${med.startDate ? `<low value="${this.formatDate(med.startDate)}"/>` : ""}${med.endDate ? `<high value="${this.formatDate(med.endDate)}"/>` : ""}</effectiveTime>` : ""}
              ${med.route ? `<routeCode code="${med.route}" codeSystem="2.16.840.1.113883.3.26.1.1" codeSystemName="NCI Thesaurus"/>` : ""}
              <consumable>
                <manufacturedProduct classCode="MANU">
                  <templateId root="2.16.840.1.113883.10.20.22.4.23" extension="2014-06-09"/>
                  <manufacturedMaterial>
                    <code code="${med.code || "unknown"}" displayName="${this.escape(med.name)}" codeSystem="2.16.840.1.113883.6.88" codeSystemName="RxNorm"/>
                  </manufacturedMaterial>
                </manufacturedProduct>
              </consumable>
            </substanceAdministration>
          </entry>`;
  }

  /**
   * Generate problems section
   */
  private generateProblemsSection(problems: CCDAProblem[]): string {
    return `
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.5.1" extension="2015-08-01"/>
          <code code="11450-4" displayName="Problem list - Reported" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>Problems</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr><th>Problem</th><th>Status</th><th>Onset Date</th></tr>
              </thead>
              <tbody>
                ${problems.map((p) => `<tr><td>${this.escape(p.name)}</td><td>${this.escape(p.status)}</td><td>${p.onsetDate ? this.formatDate(p.onsetDate) : ""}</td></tr>`).join("\n                ")}
              </tbody>
            </table>
          </text>
        </section>
      </component>`;
  }

  /**
   * Generate procedures section
   */
  private generateProceduresSection(procedures: CCDAProcedure[]): string {
    return `
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.7.1" extension="2014-06-09"/>
          <code code="47519-4" displayName="History of Procedures Document" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>Procedures</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr><th>Procedure</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${procedures.map((p) => `<tr><td>${this.escape(p.name)}</td><td>${this.formatDate(p.performedDate)}</td><td>${this.escape(p.status)}</td></tr>`).join("\n                ")}
              </tbody>
            </table>
          </text>
        </section>
      </component>`;
  }

  /**
   * Generate vital signs section
   */
  private generateVitalSignsSection(vitals: CCDAVitalSign[]): string {
    return `
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.4.1" extension="2015-08-01"/>
          <code code="8716-3" displayName="Vital signs" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>Vital Signs</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr><th>Vital Sign</th><th>Value</th><th>Unit</th><th>Date</th></tr>
              </thead>
              <tbody>
                ${vitals.map((v) => `<tr><td>${this.escape(v.type)}</td><td>${v.value}</td><td>${this.escape(v.unit)}</td><td>${this.formatDate(v.date)}</td></tr>`).join("\n                ")}
              </tbody>
            </table>
          </text>
        </section>
      </component>`;
  }

  /**
   * Generate lab results section
   */
  private generateLabResultsSection(labs: CCDALabResult[]): string {
    return `
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.22.2.3.1" extension="2015-08-01"/>
          <code code="30954-2" displayName="Relevant diagnostic tests/laboratory data Narrative" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC"/>
          <title>Laboratory Results</title>
          <text>
            <table border="1" width="100%">
              <thead>
                <tr><th>Test</th><th>Value</th><th>Unit</th><th>Reference Range</th><th>Date</th></tr>
              </thead>
              <tbody>
                ${labs.map((l) => `<tr><td>${this.escape(l.name)}</td><td>${l.value}</td><td>${this.escape(l.unit || "")}</td><td>${this.escape(l.referenceRange || "")}</td><td>${this.formatDate(l.date)}</td></tr>`).join("\n                ")}
              </tbody>
            </table>
          </text>
        </section>
      </component>`;
  }

  // Helper methods

  private generatePatientName(patient: CCDAPatient): string {
    return `<name><given>${this.escape(patient.firstName)}</given>${patient.middleName ? `<given>${this.escape(patient.middleName)}</given>` : ""}<family>${this.escape(patient.lastName)}</family></name>`;
  }

  private generateAddress(patient: CCDAPatient): string {
    if (!patient.address) return "";
    return `<addr><streetAddressLine>${this.escape(patient.address)}</streetAddressLine>${patient.city ? `<city>${this.escape(patient.city)}</city>` : ""}${patient.state ? `<state>${this.escape(patient.state)}</state>` : ""}${patient.zipCode ? `<postalCode>${this.escape(patient.zipCode)}</postalCode>` : ""}<country>US</country></addr>`;
  }

  private generateTelecom(patient: CCDAPatient): string {
    const items: string[] = [];
    if (patient.phone)
      items.push(
        `<telecom value="tel:${this.escape(patient.phone)}" use="HP"/>`,
      );
    if (patient.email)
      items.push(
        `<telecom value="mailto:${this.escape(patient.email)}" use="WP"/>`,
      );
    return items.join("\n      ");
  }

  private generateProviderAddress(provider: CCDAProvider): string {
    if (!provider.address) return "";
    return `<addr><streetAddressLine>${this.escape(provider.address)}</streetAddressLine>${provider.city ? `<city>${this.escape(provider.city)}</city>` : ""}${provider.state ? `<state>${this.escape(provider.state)}</state>` : ""}${provider.zipCode ? `<postalCode>${this.escape(provider.zipCode)}</postalCode>` : ""}</addr>`;
  }

  private generateProviderTelecom(provider: CCDAProvider): string {
    return provider.phone
      ? `<telecom value="tel:${this.escape(provider.phone)}" use="WP"/>`
      : "";
  }

  private generateOrgAddress(org: CCDAOrganization): string {
    if (!org.address) return "";
    return `<addr><streetAddressLine>${this.escape(org.address)}</streetAddressLine>${org.city ? `<city>${this.escape(org.city)}</city>` : ""}${org.state ? `<state>${this.escape(org.state)}</state>` : ""}${org.zipCode ? `<postalCode>${this.escape(org.zipCode)}</postalCode>` : ""}</addr>`;
  }

  private generateOrgTelecom(org: CCDAOrganization): string {
    return org.phone
      ? `<telecom value="tel:${this.escape(org.phone)}" use="WP"/>`
      : "";
  }

  private generatePerformer(performer: CCDAProvider): string {
    return `
      <performer typeCode="PRF">
        <assignedEntity>
          <id extension="${this.escape(performer.id)}" root="2.16.840.1.113883.19.5"/>
          <assignedPerson>
            <name><given>${this.escape(performer.firstName)}</given><family>${this.escape(performer.lastName)}</family></name>
          </assignedPerson>
        </assignedEntity>
      </performer>`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  private formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${dateStr}${hours}${minutes}${seconds}`;
  }

  private escape(text: string): string {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private getGenderDisplay(code: string): string {
    const map: Record<string, string> = {
      M: "Male",
      F: "Female",
      UN: "Undifferentiated",
    };
    return map[code] || "Unknown";
  }

  private getSeverityCode(severity: string): string {
    const map: Record<string, string> = {
      mild: "255604002",
      moderate: "6736007",
      severe: "24484000",
    };
    return map[severity.toLowerCase()] || "255604002";
  }
}

/**
 * Create a default CCDA generator
 */
export const ccdaGenerator = new CCDAGenerator();

/**
 * Helper function to generate CCD
 */
export function generateCCD(document: CCDADocument): string {
  return ccdaGenerator.generateCCD(document);
}
