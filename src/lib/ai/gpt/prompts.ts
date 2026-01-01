/**
 * Clinical AI Prompts
 *
 * Carefully engineered prompts for clinical documentation,
 * SOAP notes, medication reconciliation, and clinical summaries.
 *
 * All prompts include safety instructions and disclaimers.
 *
 * @module ai/gpt/prompts
 */

/**
 * System prompt for clinical documentation assistant
 */
export const CLINICAL_ASSISTANT_SYSTEM_PROMPT = `You are an AI clinical documentation assistant for healthcare providers.

CRITICAL SAFETY GUIDELINES:
- You are an ASSISTANT ONLY. All clinical decisions must be made by licensed healthcare providers.
- Never provide definitive diagnoses or treatment plans.
- Always recommend consulting clinical guidelines and seeking second opinions for complex cases.
- Flag any potentially dangerous drug interactions or contraindications.
- Encourage providers to verify all information before acting on it.
- Do NOT access or request actual patient PHI/PII.

Your role is to help with:
1. Clinical documentation (SOAP notes, H&P, discharge summaries)
2. Differential diagnosis suggestions (for provider consideration)
3. Treatment plan organization (based on evidence-based guidelines)
4. Medication reconciliation assistance
5. Clinical research summaries

Always cite evidence levels when making clinical suggestions:
- Level A: High-quality RCTs, meta-analyses
- Level B: Well-designed cohort/case-control studies
- Level C: Expert opinion, case series

Format responses clearly with:
- Section headers
- Bullet points for lists
- Clear action items
- References when applicable

Remember: You assist clinicians; you do not replace clinical judgment.`;

/**
 * Prompt for generating SOAP notes
 */
export const SOAP_NOTE_GENERATION_PROMPT = `Generate a professional SOAP note based on the following clinical information.

Format the note with these sections:
- **Subjective**: Chief complaint, HPI, ROS
- **Objective**: Vital signs, physical exam findings, lab results
- **Assessment**: Problem list with ICD-10 codes where applicable
- **Plan**: Treatment plan, medications, follow-up

Guidelines:
1. Use standard medical abbreviations appropriately
2. Be concise but complete
3. Include relevant positive and negative findings
4. Organize chronologically within sections
5. Use proper medical terminology

IMPORTANT: Mark any missing critical information with [INCOMPLETE] tags.

Clinical Information:
{clinical_info}

Generate the SOAP note:`;

/**
 * Prompt for medication reconciliation
 */
export const MEDICATION_RECONCILIATION_PROMPT = `Perform medication reconciliation analysis.

Compare the following medication lists and identify:
1. **Discrepancies**: Differences between lists (additions, deletions, dose changes)
2. **Duplicates**: Same medication or therapeutic class duplications
3. **Interactions**: Potential drug-drug interactions (flag severity: Major, Moderate, Minor)
4. **Contraindications**: Based on the patient's conditions
5. **Recommendations**: Suggested actions for the provider

Patient Conditions: {conditions}

Previous Medication List:
{previous_meds}

Current Medication List:
{current_meds}

Provide analysis in structured format with clear action items for the provider.

CRITICAL: Flag any potentially dangerous interactions with HIGH PRIORITY alerts.`;

/**
 * Prompt for clinical summary generation
 */
export const CLINICAL_SUMMARY_PROMPT = `Generate a concise clinical summary from the following medical records.

Create a summary with:
1. **Patient Demographics**: Age, sex (do NOT include name, MRN, or other identifiers)
2. **Chief Complaint**: Primary reason for visit/admission
3. **Problem List**: Active medical conditions (prioritized by acuity)
4. **Key Findings**: Critical labs, imaging, or exam findings
5. **Current Medications**: Active medications with indications
6. **Hospital Course**: Brief narrative of treatment (if applicable)
7. **Pending Items**: Outstanding tests, consults, or follow-up needed

Keep the summary to 250 words or less while including all critical information.

Medical Records:
{medical_records}

Generate clinical summary:`;

/**
 * Prompt for differential diagnosis generation
 */
export const DIFFERENTIAL_DIAGNOSIS_PROMPT = `Generate a differential diagnosis list based on the clinical presentation.

Clinical Presentation:
- Chief Complaint: {chief_complaint}
- History: {history}
- Physical Exam: {exam_findings}
- Labs/Imaging: {diagnostic_results}

Generate a prioritized differential diagnosis list with:
1. **Most Likely Diagnoses** (top 3-5)
   - For each: probability assessment (high/medium/low), key supporting features, key discriminating features
2. **Serious Diagnoses Not to Miss** (even if less likely)
   - Red flags that would suggest each diagnosis
3. **Recommended Workup**
   - Additional tests or imaging to narrow differential
   - Specialist consultations if indicated

Format each diagnosis:
- **Diagnosis Name** (ICD-10 code if applicable)
- Likelihood: [High/Medium/Low]
- Supporting Evidence: [bullet points]
- Discriminating Features: [bullet points]
- Next Steps: [bullet points]

Remember: This is for provider consideration only. Clinical judgment is paramount.`;

/**
 * Prompt for treatment plan recommendations
 */
export const TREATMENT_PLAN_PROMPT = `Suggest an evidence-based treatment plan for the following condition.

Condition: {condition}
Patient Context: {patient_context}
Current Medications: {current_medications}
Allergies: {allergies}

Generate treatment plan with:

1. **Pharmacologic Management**
   - First-line therapy (with evidence level)
   - Alternative options
   - Dosing recommendations
   - Contraindications to check
   - Monitoring parameters

2. **Non-Pharmacologic Management**
   - Lifestyle modifications
   - Physical therapy or rehabilitation
   - Patient education points

3. **Follow-up Plan**
   - Timing of follow-up visits
   - Monitoring labs or imaging
   - Specialist referrals if indicated

4. **Patient Education**
   - Key points to discuss with patient
   - Warning signs to watch for
   - When to seek emergency care

Cite guidelines when possible (e.g., ACC/AHA, IDSA, etc.).

IMPORTANT: All recommendations are suggestions for provider review. Provider must verify appropriateness for individual patient.`;

/**
 * Prompt for clinical note classification
 */
export const NOTE_CLASSIFICATION_PROMPT = `Classify the following clinical note.

Determine:
1. **Note Type**: Progress Note, H&P, Consult, Procedure Note, Discharge Summary, etc.
2. **Primary Specialty**: Internal Medicine, Surgery, Cardiology, etc.
3. **Acuity Level**: Routine, Urgent, Emergent
4. **Key Clinical Entities**: Diagnoses, procedures, medications mentioned
5. **Completeness Score**: 0-100 based on standard documentation requirements

Clinical Note:
{note_content}

Provide classification in JSON format:
{
  "noteType": "",
  "specialty": "",
  "acuityLevel": "",
  "diagnoses": [],
  "procedures": [],
  "medications": [],
  "completenessScore": 0,
  "missingElements": []
}`;

/**
 * Prompt for extracting clinical entities
 */
export const ENTITY_EXTRACTION_PROMPT = `Extract structured clinical entities from the following text.

Extract:
1. **Diagnoses/Conditions**: Include ICD-10 codes if mentioned
2. **Medications**: Include dose, route, frequency if mentioned
3. **Procedures**: Include CPT codes if mentioned
4. **Lab Results**: Include values and units
5. **Vital Signs**: Include values and units
6. **Allergies**: Include reaction type
7. **Social History**: Smoking, alcohol, drug use
8. **Family History**: Relevant conditions

Clinical Text:
{clinical_text}

Return structured JSON:
{
  "diagnoses": [{"name": "", "icd10": "", "status": "active/resolved"}],
  "medications": [{"name": "", "dose": "", "route": "", "frequency": ""}],
  "procedures": [{"name": "", "cpt": "", "date": ""}],
  "labs": [{"test": "", "value": "", "unit": "", "flag": "normal/high/low"}],
  "vitals": {"bp": "", "hr": "", "temp": "", "rr": "", "o2sat": ""},
  "allergies": [{"allergen": "", "reaction": "", "severity": ""}],
  "socialHistory": {},
  "familyHistory": []
}`;

/**
 * Prompt for clinical question answering
 */
export const CLINICAL_QA_PROMPT = `Answer the following clinical question based on current evidence and guidelines.

Question: {question}
Context: {context}

Provide:
1. **Direct Answer**: Clear, concise response
2. **Evidence Level**: Quality of supporting evidence (A/B/C)
3. **Guidelines**: Relevant professional society guidelines
4. **Key Points**: 3-5 bullet points of essential information
5. **References**: Citations if applicable
6. **Caveats**: Important limitations or special considerations

Format for clinical use with actionable information.

REMINDER: This is educational information. Provider must exercise clinical judgment.`;

/**
 * Prompt for discharge summary generation
 */
export const DISCHARGE_SUMMARY_PROMPT = `Generate a comprehensive discharge summary.

Hospital Course Information:
{hospital_course}

Include all standard sections:
1. **Admission Date & Discharge Date**
2. **Admission Diagnosis**
3. **Discharge Diagnosis** (with ICD-10 codes)
4. **Hospital Course**: Concise narrative of hospital stay
5. **Procedures Performed**: With dates
6. **Discharge Medications**: Complete list with instructions
7. **Discharge Condition**: Stable, improved, etc.
8. **Discharge Disposition**: Home, SNF, rehab, etc.
9. **Follow-up Plan**: Appointments, pending results, ongoing care
10. **Patient Instructions**: Diet, activity, wound care, etc.

Format professionally for provider signature and medical record.`;

/**
 * Prompt for radiology report interpretation
 */
export const RADIOLOGY_INTERPRETATION_PROMPT = `Interpret the following radiology report for clinical decision-making.

Radiology Report:
{radiology_report}

Provide:
1. **Key Findings Summary**: Most important findings in layman's terms
2. **Clinical Significance**: What this means for patient care
3. **Comparison to Previous**: If prior studies mentioned, note changes
4. **Recommended Actions**: Follow-up imaging, specialist referral, or intervention needed
5. **Differential Diagnosis**: What findings suggest
6. **Urgent Findings**: Any critical or unexpected findings requiring immediate action

Flag any critical findings with **URGENT** designation.

Remember: Radiologist's interpretation is definitive; this summary is for clinical workflow assistance.`;

/**
 * Build a complete prompt with safety wrapper
 */
export function buildClinicalPrompt(
  basePrompt: string,
  variables: Record<string, string>
): string {
  let prompt = basePrompt;

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  return prompt;
}

/**
 * Validate that prompt doesn't contain PHI before sending to API
 */
export function validatePromptSafety(prompt: string): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for common PHI patterns
  const phiPatterns = [
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/, warning: 'Possible SSN detected' },
    { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, warning: 'Possible patient name detected' },
    { pattern: /\b\d{10}\b/, warning: 'Possible phone number detected' },
    { pattern: /MRN[:\s]*\d+/i, warning: 'MRN detected' },
    { pattern: /DOB[:\s]*\d+/i, warning: 'Date of birth detected' },
  ];

  phiPatterns.forEach(({ pattern, warning }) => {
    if (pattern.test(prompt)) {
      warnings.push(warning);
    }
  });

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * Predefined clinical templates
 */
export const CLINICAL_TEMPLATES = {
  soapNote: SOAP_NOTE_GENERATION_PROMPT,
  medReconciliation: MEDICATION_RECONCILIATION_PROMPT,
  clinicalSummary: CLINICAL_SUMMARY_PROMPT,
  differential: DIFFERENTIAL_DIAGNOSIS_PROMPT,
  treatmentPlan: TREATMENT_PLAN_PROMPT,
  noteClassification: NOTE_CLASSIFICATION_PROMPT,
  entityExtraction: ENTITY_EXTRACTION_PROMPT,
  clinicalQA: CLINICAL_QA_PROMPT,
  dischargeSummary: DISCHARGE_SUMMARY_PROMPT,
  radiologyInterpretation: RADIOLOGY_INTERPRETATION_PROMPT,
};

export type ClinicalTemplateType = keyof typeof CLINICAL_TEMPLATES;
