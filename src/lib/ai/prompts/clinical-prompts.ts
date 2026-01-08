/**
 * Clinical Prompt Templates
 * Specialized prompts for clinical documentation and decision support
 *
 * HIPAA Compliant: Designed to minimize PHI exposure while maintaining clinical utility
 */

import { PromptTemplate } from '@/types/ai';

// ============================================================================
// Clinical Summarization Prompts
// ============================================================================

export const CLINICAL_SUMMARY_BRIEF: PromptTemplate = {
  id: 'clinical_summary_brief',
  name: 'Brief Clinical Summary',
  description: 'Generates concise clinical note summaries',
  category: 'summarization',
  template: `You are a clinical documentation specialist. Create a brief summary of the following clinical note.

Clinical Note:
{noteContent}

Requirements:
- Maximum 3-4 sentences
- Focus on key clinical findings and decisions
- Use standard medical terminology
- Do not include patient identifiers
- Highlight critical information

Provide only the summary, no additional commentary.`,
  variables: ['noteContent'],
  examples: [
    {
      input: {
        noteContent: 'Patient presents with acute onset chest pain...',
      },
      output: 'Patient with acute chest pain, troponin elevated. EKG shows ST changes suggestive of NSTEMI. Started on dual antiplatelet therapy and admitted to cardiology.',
    },
  ],
};

export const CLINICAL_SUMMARY_DETAILED: PromptTemplate = {
  id: 'clinical_summary_detailed',
  name: 'Detailed Clinical Summary',
  description: 'Generates comprehensive clinical note summaries',
  category: 'summarization',
  template: `You are a clinical documentation specialist. Create a detailed, structured summary of the following clinical note.

Clinical Note:
{noteContent}

Provide a summary in the following format:

**Chief Complaint & History:**
[Summarize presenting complaint and relevant history]

**Key Findings:**
- [List significant physical exam, lab, and imaging findings]

**Assessment:**
[Summarize clinical impression and diagnoses]

**Plan:**
- [List management plan and interventions]

**Critical Alerts:**
[Note any urgent findings or safety concerns]

Use professional medical language and standard terminology. Do not include patient identifiers.`,
  variables: ['noteContent'],
};

export const SOAP_NOTE_GENERATION: PromptTemplate = {
  id: 'soap_note_generation',
  name: 'SOAP Note Generator',
  description: 'Structures clinical information into SOAP format',
  category: 'documentation',
  template: `You are a clinical documentation assistant. Structure the following clinical information into a proper SOAP note format.

Clinical Information:
{clinicalInfo}

Generate a well-structured SOAP note with these sections:

**SUBJECTIVE:**
[Patient's symptoms, complaints, and history in their words]

**OBJECTIVE:**
[Vital signs, physical exam findings, lab results, imaging]

**ASSESSMENT:**
[Clinical impression, diagnoses with ICD-10 codes if applicable]

**PLAN:**
[Treatment plan, medications, follow-up, patient education]

Use professional medical terminology and follow standard documentation practices.`,
  variables: ['clinicalInfo'],
};

// ============================================================================
// Differential Diagnosis Prompts
// ============================================================================

export const DIFFERENTIAL_DIAGNOSIS: PromptTemplate = {
  id: 'differential_diagnosis',
  name: 'Differential Diagnosis Generator',
  description: 'Generates differential diagnosis from patient presentation',
  category: 'clinical_decision_support',
  template: `You are a clinical decision support system. Based on the patient presentation below, generate a ranked differential diagnosis.

Patient Presentation:
Chief Complaint: {chiefComplaint}
Symptoms: {symptoms}
Duration: {duration}
Vital Signs: {vitalSigns}
Physical Exam: {physicalExam}
{additionalInfo}

For each diagnosis candidate, provide:
1. Condition name with ICD-10 code
2. Probability (high/moderate/low)
3. Supporting findings
4. Contradicting findings (if any)
5. Recommended diagnostic tests
6. Urgency level (routine/urgent/emergent)

List diagnoses from most to least likely. Include at least 3-5 differential diagnoses.
Note any red flags or critical findings that require immediate attention.`,
  variables: ['chiefComplaint', 'symptoms', 'duration', 'vitalSigns', 'physicalExam', 'additionalInfo'],
};

export const CRITICAL_FINDING_ALERT: PromptTemplate = {
  id: 'critical_finding_alert',
  name: 'Critical Finding Analyzer',
  description: 'Identifies critical findings requiring immediate attention',
  category: 'clinical_decision_support',
  template: `You are a clinical safety system. Analyze the following clinical data for critical findings that require immediate attention.

Clinical Data:
{clinicalData}

Identify:
1. Life-threatening conditions or findings
2. Time-sensitive interventions needed
3. Critical abnormal values
4. Safety concerns

For each critical finding, provide:
- Finding description
- Severity level (critical/high/moderate)
- Recommended immediate action
- Time frame for intervention

If no critical findings, state "No critical findings identified."
Always err on the side of caution in healthcare contexts.`,
  variables: ['clinicalData'],
};

// ============================================================================
// Medication Reconciliation Prompts
// ============================================================================

export const MEDICATION_RECONCILIATION: PromptTemplate = {
  id: 'medication_reconciliation',
  name: 'Medication Reconciliation Assistant',
  description: 'Identifies medication discrepancies and interactions',
  category: 'medication_safety',
  template: `You are a medication safety specialist. Perform medication reconciliation between the patient's reported medications and EHR records.

Patient-Reported Medications:
{patientMedications}

EHR Medications:
{ehrMedications}

Patient Allergies: {allergies}
Active Conditions: {conditions}

Identify:
1. **Discrepancies:**
   - Medications reported by patient but not in EHR
   - Medications in EHR but not reported by patient
   - Dosage or frequency differences

2. **Drug Interactions:**
   - Major interactions (avoid combination)
   - Moderate interactions (monitor closely)
   - Minor interactions (be aware)

3. **Contraindications:**
   - Based on allergies
   - Based on conditions
   - Based on lab values (if provided)

4. **Duplicate Therapy:**
   - Same drug, different brand names
   - Same therapeutic class

For each issue, provide:
- Severity (critical/high/moderate/low)
- Description
- Recommendation
- Supporting evidence

Provide a reconciled medication list at the end.`,
  variables: ['patientMedications', 'ehrMedications', 'allergies', 'conditions'],
};

// ============================================================================
// Documentation Enhancement Prompts
// ============================================================================

export const DOCUMENTATION_ENHANCEMENT: PromptTemplate = {
  id: 'documentation_enhancement',
  name: 'Documentation Quality Enhancer',
  description: 'Suggests improvements to clinical documentation',
  category: 'documentation',
  template: `You are a clinical documentation specialist. Review the following documentation and suggest improvements.

Current Documentation:
{currentDoc}

Context: {context}

Provide suggestions for:
1. **Completeness:** Missing elements for complete documentation
2. **Clarity:** Areas that could be more specific or clear
3. **Compliance:** Documentation elements needed for billing/compliance
4. **Clinical Detail:** Additional clinical details that would be valuable

For each suggestion, provide:
- Category (completeness/clarity/compliance/detail)
- Current state
- Suggested improvement
- Rationale

Format suggestions as actionable recommendations.`,
  variables: ['currentDoc', 'context'],
};

export const HPI_GENERATOR: PromptTemplate = {
  id: 'hpi_generator',
  name: 'History of Present Illness Generator',
  description: 'Generates well-structured HPI from clinical notes',
  category: 'documentation',
  template: `You are a clinical documentation assistant. Generate a comprehensive History of Present Illness (HPI) from the following information.

Chief Complaint: {chiefComplaint}
Patient Information: {patientInfo}
Symptom Details: {symptoms}

Create an HPI that includes:
- Onset: When symptoms began
- Location: Where symptoms occur
- Duration: How long symptoms last
- Character: Quality/nature of symptoms
- Aggravating factors: What makes it worse
- Relieving factors: What makes it better
- Timing: Pattern of symptoms
- Severity: Impact on daily activities
- Associated symptoms: Related complaints
- Previous similar episodes
- Treatments tried and response

Write in paragraph form using professional medical language. Be thorough but concise.`,
  variables: ['chiefComplaint', 'patientInfo', 'symptoms'],
};

// ============================================================================
// Patient Education Prompts
// ============================================================================

export const PATIENT_EDUCATION: PromptTemplate = {
  id: 'patient_education',
  name: 'Patient Education Generator',
  description: 'Creates patient-friendly explanations',
  category: 'patient_education',
  template: `You are a patient education specialist. Create clear, patient-friendly education materials.

Topic: {topic}
Diagnosis/Condition: {condition}
Patient Context: {patientContext}

Create education content that includes:

**What is {condition}?**
[Simple explanation in lay terms]

**What causes it?**
[Causes in understandable language]

**What are the symptoms?**
[List key symptoms patients should watch for]

**How is it treated?**
[Explain treatment options simply]

**What should you do?**
[Clear action steps]

**When to seek immediate care:**
[Red flag symptoms requiring urgent attention]

**Questions to ask your provider:**
[3-5 relevant questions]

Use:
- Simple language (8th grade reading level)
- Short sentences
- Bullet points for clarity
- Avoid medical jargon or explain terms
- Positive, reassuring tone`,
  variables: ['topic', 'condition', 'patientContext'],
};

// ============================================================================
// Quality Measure Prompts
// ============================================================================

export const QUALITY_GAP_ANALYSIS: PromptTemplate = {
  id: 'quality_gap_analysis',
  name: 'Quality Measure Gap Analyzer',
  description: 'Identifies care gaps in quality measures',
  category: 'quality',
  template: `You are a clinical quality analyst. Analyze the patient's chart for quality measure gaps.

Patient Demographics:
Age: {age}
Sex: {sex}

Active Conditions: {conditions}
Current Medications: {medications}
Recent Labs: {labs}
Recent Screenings: {screenings}
Immunizations: {immunizations}

Analyze for common quality measures including:
- Diabetes care (HbA1c, eye exams, foot exams, nephropathy screening)
- Hypertension control (BP monitoring, medication adherence)
- Preventive care (cancer screenings, immunizations)
- Chronic disease management
- Medication management

For each gap identified, provide:
1. Measure name and category
2. What is missing or overdue
3. Due date/urgency
4. Clinical significance
5. Recommended action
6. Documentation needed

Prioritize gaps by clinical importance and urgency.`,
  variables: ['age', 'sex', 'conditions', 'medications', 'labs', 'screenings', 'immunizations'],
};

// ============================================================================
// Export All Templates
// ============================================================================

export const CLINICAL_PROMPTS: PromptTemplate[] = [
  CLINICAL_SUMMARY_BRIEF,
  CLINICAL_SUMMARY_DETAILED,
  SOAP_NOTE_GENERATION,
  DIFFERENTIAL_DIAGNOSIS,
  CRITICAL_FINDING_ALERT,
  MEDICATION_RECONCILIATION,
  DOCUMENTATION_ENHANCEMENT,
  HPI_GENERATOR,
  PATIENT_EDUCATION,
  QUALITY_GAP_ANALYSIS,
];

// ============================================================================
// Utility Functions
// ============================================================================

export function getPromptById(id: string): PromptTemplate | undefined {
  return CLINICAL_PROMPTS.find(p => p.id === id);
}

export function getPromptsByCategory(category: string): PromptTemplate[] {
  return CLINICAL_PROMPTS.filter(p => p.category === category);
}

export function fillPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  let filled = template.template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`{${key}}`, 'g'), value || '[Not provided]');
  }
  return filled;
}
