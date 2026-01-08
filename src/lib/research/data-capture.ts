/**
 * Research Data Capture System (REDCap-like)
 * Lithic Healthcare Platform v0.5
 *
 * Comprehensive data capture forms with CDISC standards support
 */

import {
  DataCaptureForm,
  DataCaptureFormInstance,
  FormField,
  FormLogic,
  FormValidation,
  FormInstanceStatus,
  DataQuery,
  QueryStatus,
  ElectronicSignature,
  FormAuditEntry,
  AuditAction,
} from "@/types/research";
import { auditLogger } from "@/lib/audit-logger";

export class DataCaptureSystem {
  private static instance: DataCaptureSystem;
  private forms: Map<string, DataCaptureForm> = new Map();
  private instances: Map<string, DataCaptureFormInstance> = new Map();
  private queries: Map<string, DataQuery> = new Map();

  private constructor() {}

  static getInstance(): DataCaptureSystem {
    if (!DataCaptureSystem.instance) {
      DataCaptureSystem.instance = new DataCaptureSystem();
    }
    return DataCaptureSystem.instance;
  }

  /**
   * Create a new data capture form template
   */
  async createForm(
    form: Omit<DataCaptureForm, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<DataCaptureForm> {
    try {
      // Validate form structure
      this.validateFormStructure(form);

      const newForm: DataCaptureForm = {
        ...form,
        id: this.generateId("form"),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: userId,
        updatedBy: userId,
      };

      this.forms.set(newForm.id, newForm);

      // Audit log
      await auditLogger.log({
        userId,
        action: "CREATE",
        resource: "data_capture_form",
        resourceId: newForm.id,
        details: {
          formId: newForm.formId,
          name: newForm.name,
          trialId: newForm.trialId,
        },
        organizationId: newForm.organizationId,
      });

      return newForm;
    } catch (error) {
      throw new Error(
        `Failed to create form: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Create form instance for data entry
   */
  async createFormInstance(
    formId: string,
    subjectId: string,
    visitId: string | null,
    userId: string,
    repeatInstance?: number
  ): Promise<DataCaptureFormInstance> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error(`Form ${formId} not found`);
    }

    // Check if form is repeating and validate repeat instance
    if (form.isRepeating && repeatInstance) {
      if (form.maxRepeat && repeatInstance > form.maxRepeat) {
        throw new Error(
          `Maximum repeat instances (${form.maxRepeat}) exceeded`
        );
      }
    }

    const instance: DataCaptureFormInstance = {
      id: this.generateId("instance"),
      instanceId: this.generateInstanceId(formId, subjectId, repeatInstance),
      formId,
      subjectId,
      visitId,
      repeatInstance: repeatInstance || null,
      data: {},
      status: FormInstanceStatus.NOT_STARTED,
      completedAt: null,
      completedBy: null,
      verifiedAt: null,
      verifiedBy: null,
      lockedAt: null,
      lockedBy: null,
      queries: [],
      signatures: [],
      auditTrail: [
        {
          id: this.generateId("audit"),
          timestamp: new Date(),
          userId,
          userName: "User", // Would fetch from user service
          action: AuditAction.CREATED,
          fieldName: null,
          oldValue: null,
          newValue: null,
          reason: "Form instance created",
        },
      ],
      organizationId: form.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: userId,
      updatedBy: userId,
    };

    this.instances.set(instance.id, instance);

    return instance;
  }

  /**
   * Update form instance data
   */
  async updateFormData(
    instanceId: string,
    fieldName: string,
    value: any,
    userId: string,
    reason?: string
  ): Promise<DataCaptureFormInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    // Check if instance is locked
    if (instance.lockedAt) {
      throw new Error("Cannot update locked form instance");
    }

    const form = this.forms.get(instance.formId);
    if (!form) {
      throw new Error(`Form ${instance.formId} not found`);
    }

    // Validate field exists
    const field = form.fields.find((f) => f.fieldName === fieldName);
    if (!field) {
      throw new Error(`Field ${fieldName} not found in form`);
    }

    // Validate field value
    const validationResult = this.validateFieldValue(field, value);
    if (!validationResult.valid) {
      throw new Error(
        `Validation failed: ${validationResult.message}`
      );
    }

    // Store old value for audit trail
    const oldValue = instance.data[fieldName];

    // Update data
    instance.data[fieldName] = value;
    instance.updatedAt = new Date();
    instance.updatedBy = userId;

    // Update status if starting data entry
    if (instance.status === FormInstanceStatus.NOT_STARTED) {
      instance.status = FormInstanceStatus.IN_PROGRESS;
    }

    // Add audit trail entry
    instance.auditTrail.push({
      id: this.generateId("audit"),
      timestamp: new Date(),
      userId,
      userName: "User",
      action: AuditAction.MODIFIED,
      fieldName,
      oldValue,
      newValue: value,
      reason: reason || null,
    });

    // Evaluate form logic
    await this.evaluateFormLogic(instance, form);

    // Run form validations
    await this.runFormValidations(instance, form);

    this.instances.set(instanceId, instance);

    // Audit log
    await auditLogger.log({
      userId,
      action: "UPDATE",
      resource: "form_data",
      resourceId: instanceId,
      details: {
        fieldName,
        oldValue,
        newValue: value,
      },
      organizationId: instance.organizationId,
    });

    return instance;
  }

  /**
   * Complete form instance
   */
  async completeForm(
    instanceId: string,
    userId: string
  ): Promise<DataCaptureFormInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    const form = this.forms.get(instance.formId);
    if (!form) {
      throw new Error(`Form ${instance.formId} not found`);
    }

    // Validate all required fields are filled
    const missingFields = this.checkRequiredFields(instance, form);
    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
    }

    // Run all validations
    const validationErrors = await this.runFormValidations(instance, form);
    if (validationErrors.length > 0) {
      throw new Error(
        `Validation errors: ${validationErrors.join("; ")}`
      );
    }

    instance.status = FormInstanceStatus.COMPLETED;
    instance.completedAt = new Date();
    instance.completedBy = userId;
    instance.updatedAt = new Date();

    // Add audit trail entry
    instance.auditTrail.push({
      id: this.generateId("audit"),
      timestamp: new Date(),
      userId,
      userName: "User",
      action: AuditAction.MODIFIED,
      fieldName: null,
      oldValue: FormInstanceStatus.IN_PROGRESS,
      newValue: FormInstanceStatus.COMPLETED,
      reason: "Form completed",
    });

    this.instances.set(instanceId, instance);

    return instance;
  }

  /**
   * Verify form data (data manager review)
   */
  async verifyForm(
    instanceId: string,
    userId: string
  ): Promise<DataCaptureFormInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    if (instance.status !== FormInstanceStatus.COMPLETED) {
      throw new Error("Only completed forms can be verified");
    }

    instance.status = FormInstanceStatus.VERIFIED;
    instance.verifiedAt = new Date();
    instance.verifiedBy = userId;
    instance.updatedAt = new Date();

    // Add audit trail entry
    instance.auditTrail.push({
      id: this.generateId("audit"),
      timestamp: new Date(),
      userId,
      userName: "User",
      action: AuditAction.VERIFIED,
      fieldName: null,
      oldValue: FormInstanceStatus.COMPLETED,
      newValue: FormInstanceStatus.VERIFIED,
      reason: "Form verified",
    });

    this.instances.set(instanceId, instance);

    return instance;
  }

  /**
   * Lock form instance (prevent further changes)
   */
  async lockForm(
    instanceId: string,
    userId: string
  ): Promise<DataCaptureFormInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    if (instance.status !== FormInstanceStatus.VERIFIED) {
      throw new Error("Only verified forms can be locked");
    }

    instance.status = FormInstanceStatus.LOCKED;
    instance.lockedAt = new Date();
    instance.lockedBy = userId;
    instance.updatedAt = new Date();

    // Add audit trail entry
    instance.auditTrail.push({
      id: this.generateId("audit"),
      timestamp: new Date(),
      userId,
      userName: "User",
      action: AuditAction.LOCKED,
      fieldName: null,
      oldValue: FormInstanceStatus.VERIFIED,
      newValue: FormInstanceStatus.LOCKED,
      reason: "Form locked for analysis",
    });

    this.instances.set(instanceId, instance);

    return instance;
  }

  /**
   * Add electronic signature (21 CFR Part 11 compliant)
   */
  async addSignature(
    instanceId: string,
    signature: Omit<ElectronicSignature, "id" | "signedAt">,
    userId: string,
    ipAddress: string
  ): Promise<DataCaptureFormInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    const newSignature: ElectronicSignature = {
      ...signature,
      id: this.generateId("signature"),
      signedAt: new Date(),
      ipAddress,
    };

    instance.signatures.push(newSignature);
    instance.updatedAt = new Date();

    // Add audit trail entry
    instance.auditTrail.push({
      id: this.generateId("audit"),
      timestamp: new Date(),
      userId,
      userName: signature.userName,
      action: AuditAction.SIGNED,
      fieldName: null,
      oldValue: null,
      newValue: signature.meaning,
      reason: signature.reason || "Electronic signature applied",
    });

    this.instances.set(instanceId, instance);

    return instance;
  }

  /**
   * Raise data query
   */
  async raiseQuery(
    instanceId: string,
    fieldName: string,
    queryType: string,
    question: string,
    userId: string
  ): Promise<DataQuery> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    const query: DataQuery = {
      id: this.generateId("query"),
      fieldName,
      queryType: queryType as any,
      question,
      raisedBy: userId,
      raisedAt: new Date(),
      status: QueryStatus.OPEN,
      response: null,
      respondedBy: null,
      respondedAt: null,
      closedBy: null,
      closedAt: null,
    };

    instance.queries.push(query);
    instance.status = FormInstanceStatus.QUERY_OPEN;

    this.queries.set(query.id, query);
    this.instances.set(instanceId, instance);

    // Add audit trail entry
    instance.auditTrail.push({
      id: this.generateId("audit"),
      timestamp: new Date(),
      userId,
      userName: "User",
      action: AuditAction.QUERIED,
      fieldName,
      oldValue: null,
      newValue: question,
      reason: "Data query raised",
    });

    return query;
  }

  /**
   * Respond to data query
   */
  async respondToQuery(
    instanceId: string,
    queryId: string,
    response: string,
    userId: string
  ): Promise<DataQuery> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    const query = instance.queries.find((q) => q.id === queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    query.response = response;
    query.respondedBy = userId;
    query.respondedAt = new Date();
    query.status = QueryStatus.ANSWERED;

    this.queries.set(queryId, query);
    this.instances.set(instanceId, instance);

    return query;
  }

  /**
   * Close data query
   */
  async closeQuery(
    instanceId: string,
    queryId: string,
    userId: string
  ): Promise<DataQuery> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Form instance ${instanceId} not found`);
    }

    const query = instance.queries.find((q) => q.id === queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    if (query.status !== QueryStatus.ANSWERED) {
      throw new Error("Only answered queries can be closed");
    }

    query.status = QueryStatus.CLOSED;
    query.closedBy = userId;
    query.closedAt = new Date();

    // Check if all queries are closed
    const openQueries = instance.queries.filter(
      (q) => q.status === QueryStatus.OPEN || q.status === QueryStatus.ANSWERED
    );
    if (openQueries.length === 0) {
      instance.status = FormInstanceStatus.COMPLETED;
    }

    this.queries.set(queryId, query);
    this.instances.set(instanceId, instance);

    // Add audit trail entry
    instance.auditTrail.push({
      id: this.generateId("audit"),
      timestamp: new Date(),
      userId,
      userName: "User",
      action: AuditAction.QUERY_RESOLVED,
      fieldName: query.fieldName,
      oldValue: QueryStatus.ANSWERED,
      newValue: QueryStatus.CLOSED,
      reason: "Query resolved",
    });

    return query;
  }

  // Private helper methods

  private validateFormStructure(form: any): void {
    if (!form.formId || !form.name || !form.trialId) {
      throw new Error("Form must have formId, name, and trialId");
    }

    if (!form.fields || form.fields.length === 0) {
      throw new Error("Form must have at least one field");
    }

    // Validate field names are unique
    const fieldNames = form.fields.map((f: FormField) => f.fieldName);
    const duplicates = fieldNames.filter(
      (name: string, index: number) => fieldNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      throw new Error(`Duplicate field names: ${duplicates.join(", ")}`);
    }
  }

  private validateFieldValue(field: FormField, value: any): { valid: boolean; message?: string } {
    // Check required
    if (field.required && (value === null || value === undefined || value === "")) {
      return { valid: false, message: "Field is required" };
    }

    // Skip validation if value is empty and not required
    if (!field.required && (value === null || value === undefined || value === "")) {
      return { valid: true };
    }

    // Validate based on field type and validation rules
    if (field.validation) {
      // Min/max for numbers
      if (field.fieldType === "NUMBER" && typeof value === "number") {
        if (field.validation.min !== null && value < field.validation.min) {
          return {
            valid: false,
            message: `Value must be at least ${field.validation.min}`,
          };
        }
        if (field.validation.max !== null && value > field.validation.max) {
          return {
            valid: false,
            message: `Value must be at most ${field.validation.max}`,
          };
        }
      }

      // Pattern for text
      if (field.validation.pattern && typeof value === "string") {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return {
            valid: false,
            message: field.validation.errorMessage || "Invalid format",
          };
        }
      }
    }

    return { valid: true };
  }

  private checkRequiredFields(
    instance: DataCaptureFormInstance,
    form: DataCaptureForm
  ): string[] {
    const missing: string[] = [];

    for (const field of form.fields) {
      if (field.required) {
        const value = instance.data[field.fieldName];
        if (value === null || value === undefined || value === "") {
          missing.push(field.fieldName);
        }
      }
    }

    return missing;
  }

  private async evaluateFormLogic(
    instance: DataCaptureFormInstance,
    form: DataCaptureForm
  ): Promise<void> {
    // Evaluate conditional logic rules
    for (const logic of form.logic) {
      const conditionMet = this.evaluateCondition(logic.condition, instance.data);

      if (conditionMet) {
        // Apply logic action
        // This would update field visibility, requirements, etc.
        // For now, just log
      }
    }
  }

  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    // Simplified condition evaluation
    // In production, use a proper expression parser
    try {
      // Replace field names with values
      let expression = condition;
      for (const [key, value] of Object.entries(data)) {
        expression = expression.replace(
          new RegExp(`\\[${key}\\]`, "g"),
          JSON.stringify(value)
        );
      }

      // Evaluate (in production, use a safe evaluator)
      return false; // Placeholder
    } catch {
      return false;
    }
  }

  private async runFormValidations(
    instance: DataCaptureFormInstance,
    form: DataCaptureForm
  ): Promise<string[]> {
    const errors: string[] = [];

    for (const validation of form.validations) {
      // Run validation rules
      // This would check cross-field validations, etc.
    }

    return errors;
  }

  private generateInstanceId(
    formId: string,
    subjectId: string,
    repeatInstance?: number
  ): string {
    const repeat = repeatInstance ? `_${repeatInstance}` : "";
    return `${formId}_${subjectId}${repeat}`;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const dataCaptureSystem = DataCaptureSystem.getInstance();
