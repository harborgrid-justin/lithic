/**
 * Medical Coding Prompt Templates
 * Specialized prompts for ICD-10 and CPT code suggestions
 *
 * Compliance: Designed to assist, not replace, professional medical coders
 */

import { PromptTemplate } from '@/types/ai';

// ============================================================================
// ICD-10 Coding Prompts
// ============================================================================

export const ICD10_SUGGESTION: PromptTemplate = {
  id: 'icd10_suggestion',
  name: 'ICD-10 Code Suggester',
  description: 'Suggests appropriate ICD-10 codes from clinical documentation',
  category: 'medical_coding',
  template: `You are an expert medical coder specializing in ICD-10-CM coding. Analyze the clinical documentation and suggest appropriate ICD-10 codes.

Clinical Documentation:
{clinicalText}

Encounter Type: {encounterType}
Chief Complaint: {chiefComplaint}

Provide ICD-10 code suggestions including:

For each suggested code:
1. **Code:** Full ICD-10-CM code
2. **Description:** Official code description
3. **Confidence:** High/Moderate/Low
4. **Supporting Evidence:** Specific text from documentation supporting this code
5. **Specificity Notes:** Whether a more specific code might be available
6. **Billable:** Yes/No
7. **Alternative Codes:** Other codes to consider

Guidelines:
- Code to the highest level of specificity supported by documentation
- Include both primary diagnosis and relevant secondary diagnoses
- Consider chronic conditions, complications, and comorbidities
- Note if documentation is insufficient for specific coding
- Follow ICD-10-CM Official Guidelines for Coding and Reporting
- Prioritize codes by clinical significance and billing relevance

Format as structured list. Include 3-10 codes as appropriate.`,
  variables: ['clinicalText', 'encounterType', 'chiefComplaint'],
};

export const ICD10_VALIDATION: PromptTemplate = {
  id: 'icd10_validation',
  name: 'ICD-10 Code Validator',
  description: 'Validates existing ICD-10 codes against documentation',
  category: 'medical_coding',
  template: `You are an expert medical coder. Validate the following ICD-10 codes against the clinical documentation.

Clinical Documentation:
{clinicalText}

Existing Codes:
{existingCodes}

For each code, validate:
1. **Code:** The ICD-10 code being reviewed
2. **Supported:** Yes/Partially/No
3. **Documentation Evidence:** Text supporting (or not supporting) the code
4. **Issues:** Any problems with code selection
5. **Recommendations:** Suggestions for improvement
6. **Specificity:** Could a more specific code be used?

Also identify:
- Missing codes: Conditions documented but not coded
- Invalid codes: Codes not supported by documentation
- Coding opportunities: Additional diagnoses that could be coded

Provide actionable feedback for improving coding accuracy and completeness.`,
  variables: ['clinicalText', 'existingCodes'],
};

export const ICD10_SPECIFICITY_ENHANCEMENT: PromptTemplate = {
  id: 'icd10_specificity',
  name: 'ICD-10 Specificity Enhancer',
  description: 'Suggests more specific ICD-10 codes when possible',
  category: 'medical_coding',
  template: `You are an expert medical coder focused on coding specificity. Review the codes and documentation to suggest more specific codes.

Current Codes:
{currentCodes}

Clinical Documentation:
{clinicalText}

For each code that could be more specific:
1. **Current Code:** The less specific code currently used
2. **Current Description:** What the current code represents
3. **Suggested Code:** More specific code option
4. **Suggested Description:** What the specific code represents
5. **Additional Documentation Needed:** What information would support the more specific code
6. **Impact:** Clinical and/or financial impact of using more specific code

Only suggest changes when:
- Documentation supports a more specific code
- The more specific code is billable
- The change improves clinical accuracy

Include rationale for all suggestions.`,
  variables: ['currentCodes', 'clinicalText'],
};

// ============================================================================
// CPT Coding Prompts
// ============================================================================

export const CPT_SUGGESTION: PromptTemplate = {
  id: 'cpt_suggestion',
  name: 'CPT Code Suggester',
  description: 'Suggests appropriate CPT codes for procedures and services',
  category: 'medical_coding',
  template: `You are an expert medical coder specializing in CPT coding. Analyze the clinical documentation and suggest appropriate CPT codes.

Clinical Documentation:
{clinicalText}

Encounter Type: {encounterType}
Procedures Performed: {procedures}
Time Spent: {timeSpent}

Provide CPT code suggestions including:

For each suggested code:
1. **Code:** CPT code
2. **Description:** Official CPT description
3. **Confidence:** High/Moderate/Low
4. **Supporting Evidence:** Documentation supporting this code
5. **Modifiers:** Any applicable modifiers (-25, -59, etc.)
6. **Units:** Number of units if applicable
7. **RVU Value:** Relative Value Units (if applicable)
8. **Documentation Requirements:** Key elements that must be documented

Consider:
- Evaluation & Management (E&M) levels based on complexity
- Procedures and services performed
- Time-based coding when applicable
- Bundling rules and NCCI edits
- Medical necessity
- Global surgical packages

Include both primary procedure codes and any add-on codes.
Note any documentation deficiencies that could affect coding.`,
  variables: ['clinicalText', 'encounterType', 'procedures', 'timeSpent'],
};

export const EM_LEVEL_DETERMINATION: PromptTemplate = {
  id: 'em_level_determination',
  name: 'E&M Level Determiner',
  description: 'Determines appropriate Evaluation & Management code level',
  category: 'medical_coding',
  template: `You are an expert in Evaluation & Management (E&M) coding. Determine the appropriate E&M level based on the clinical documentation.

Clinical Documentation:
{clinicalText}

Visit Type: {visitType} (new patient/established patient/consultation)
Visit Location: {location} (office/hospital/emergency/telehealth)

Analyze using 2021+ E&M Guidelines:

**Method 1: Medical Decision Making (MDM)**
Evaluate:
1. Number and complexity of problems addressed
2. Amount and/or complexity of data reviewed
3. Risk of complications, morbidity, mortality

**Method 2: Time-Based (if applicable)**
- Total time documented: {time} minutes
- Time spent on date of encounter

Provide:
1. **Recommended CPT Code:** Specific E&M code
2. **Level:** Level of service (1-5)
3. **Method Used:** MDM or Time
4. **Justification:** Detailed rationale
5. **Key Supporting Elements:** Specific documentation elements
6. **MDM Level:** Straightforward/Low/Moderate/High (if using MDM)
7. **Alternative Codes:** Other levels to consider
8. **Documentation Gaps:** Missing elements that could support higher level

Reference current CPT E&M guidelines (2021+) with focus on:
- Problem complexity
- Data reviewed (tests, records, discussion with other providers)
- Risk management
- Total time (when time-based)`,
  variables: ['clinicalText', 'visitType', 'location', 'time'],
};

export const CPT_MODIFIER_SUGGESTION: PromptTemplate = {
  id: 'cpt_modifier_suggestion',
  name: 'CPT Modifier Suggester',
  description: 'Suggests appropriate CPT modifiers',
  category: 'medical_coding',
  template: `You are an expert in CPT modifier usage. Review the procedures and suggest appropriate modifiers.

Procedures:
{procedures}

Clinical Context:
{clinicalContext}

For each procedure code, analyze need for modifiers:

**Common Modifiers to Consider:**
- -25: Significant, separately identifiable E&M service
- -59/-XS/-XE/-XP/-XU: Distinct procedural service
- -51: Multiple procedures
- -52: Reduced services
- -53: Discontinued procedure
- -76/-77: Repeat procedures
- -RT/-LT: Right/Left side
- -22: Increased procedural services
- -24: Unrelated E&M during global period

For each modifier suggested:
1. **Code:** CPT code
2. **Modifier:** Modifier number/letter
3. **Rationale:** Why this modifier applies
4. **Supporting Documentation:** Evidence in documentation
5. **Payer Considerations:** Special rules or requirements
6. **Alternative:** Other modifiers to consider

Only suggest modifiers when clearly supported by documentation.
Note any documentation that should be enhanced to support modifier use.`,
  variables: ['procedures', 'clinicalContext'],
};

// ============================================================================
// Coding Compliance Prompts
// ============================================================================

export const CODING_COMPLIANCE_CHECK: PromptTemplate = {
  id: 'coding_compliance_check',
  name: 'Coding Compliance Checker',
  description: 'Reviews coding for compliance issues',
  category: 'compliance',
  template: `You are a coding compliance specialist. Review the proposed codes for compliance issues.

Proposed ICD-10 Codes:
{icd10Codes}

Proposed CPT Codes:
{cptCodes}

Clinical Documentation:
{clinicalText}

Review for:

**1. Documentation Support:**
- Are all codes supported by documentation?
- Is documentation sufficient for code specificity?
- Are there gaps in documentation?

**2. Medical Necessity:**
- Is medical necessity clearly established?
- Do services/procedures align with diagnoses?
- Are there red flags for medical necessity denials?

**3. Coding Rules:**
- NCCI bundling edits
- Mutually exclusive codes
- Code sequencing issues
- Invalid code combinations

**4. Billing Compliance:**
- Appropriate use of modifiers
- Correct primary diagnosis
- Compliance with payer policies
- Potential upcoding/downcoding concerns

**5. Audit Risk:**
- High-risk codes or combinations
- Documentation deficiencies
- Patterns that may trigger audits

For each issue identified:
- Severity: Critical/High/Moderate/Low
- Description: What the issue is
- Impact: Potential compliance risk
- Recommendation: How to address
- Supporting Reference: Relevant guideline or regulation

Provide overall compliance assessment and risk level.`,
  variables: ['icd10Codes', 'cptCodes', 'clinicalText'],
};

export const DOCUMENTATION_IMPROVEMENT_QUERY: PromptTemplate = {
  id: 'documentation_improvement_query',
  name: 'Documentation Query Generator',
  description: 'Generates queries to improve coding documentation',
  category: 'documentation',
  template: `You are a clinical documentation improvement (CDI) specialist. Generate queries to improve documentation for accurate coding.

Clinical Documentation:
{clinicalText}

Preliminary Codes:
{preliminaryCodes}

Identify areas where additional documentation would:
- Support more specific coding
- Clarify ambiguous diagnoses
- Establish medical necessity
- Support higher-level E&M coding
- Capture complications or comorbidities

For each query:
1. **Query Topic:** What needs clarification
2. **Current Documentation:** What is currently documented
3. **Query Question:** Specific question for provider (open-ended)
4. **Rationale:** Why this information is needed
5. **Coding Impact:** How this could affect coding
6. **Urgency:** High/Medium/Low

Guidelines for queries:
- Use open-ended questions (avoid leading questions)
- Be specific about what additional information is needed
- Reference specific clinical indicators in the record
- Maintain compliant query format
- Never suggest specific diagnosis codes in query

Generate 3-5 priority queries that would most improve coding accuracy.`,
  variables: ['clinicalText', 'preliminaryCodes'],
};

// ============================================================================
// HCC Coding Prompts
// ============================================================================

export const HCC_RISK_ADJUSTMENT: PromptTemplate = {
  id: 'hcc_risk_adjustment',
  name: 'HCC Risk Adjustment Analyzer',
  description: 'Identifies HCC (Hierarchical Condition Category) opportunities',
  category: 'risk_adjustment',
  template: `You are a risk adjustment coding specialist. Analyze the patient's conditions for HCC coding opportunities.

Patient Demographics:
Age: {age}
Sex: {sex}

Active Conditions:
{conditions}

Current Medications:
{medications}

Clinical Documentation:
{clinicalText}

Analyze for HCC opportunities:

**1. Documented Conditions with HCC Impact:**
For each condition that maps to an HCC:
- Condition name
- ICD-10 code
- HCC category
- RAF impact
- Documentation quality (sufficient/needs improvement)

**2. Suspected Conditions (not yet documented):**
Based on medications and clinical context:
- Suspected condition
- Supporting evidence (meds, symptoms, etc.)
- Recommended diagnostic steps
- HCC impact if confirmed

**3. Chronic Conditions Requiring Annual Documentation:**
- Conditions that must be documented annually for RAF
- Last documented date
- Need for re-documentation

**4. Documentation Opportunities:**
- Conditions mentioned but not specifically diagnosed
- Conditions that could be documented more specifically
- Complications or manifestations not captured

**5. Risk Adjustment Impact:**
- Current estimated RAF score
- Potential RAF with complete documentation
- Financial impact of documentation improvement

Prioritize by:
- Clinical accuracy
- Documentation feasibility
- Risk adjustment impact

Always maintain clinical integrity - only suggest codes supported by clinical evidence.`,
  variables: ['age', 'sex', 'conditions', 'medications', 'clinicalText'],
};

// ============================================================================
// Export All Templates
// ============================================================================

export const CODING_PROMPTS: PromptTemplate[] = [
  ICD10_SUGGESTION,
  ICD10_VALIDATION,
  ICD10_SPECIFICITY_ENHANCEMENT,
  CPT_SUGGESTION,
  EM_LEVEL_DETERMINATION,
  CPT_MODIFIER_SUGGESTION,
  CODING_COMPLIANCE_CHECK,
  DOCUMENTATION_IMPROVEMENT_QUERY,
  HCC_RISK_ADJUSTMENT,
];

// ============================================================================
// Utility Functions
// ============================================================================

export function getPromptById(id: string): PromptTemplate | undefined {
  return CODING_PROMPTS.find(p => p.id === id);
}

export function getPromptsByCategory(category: string): PromptTemplate[] {
  return CODING_PROMPTS.filter(p => p.category === category);
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
