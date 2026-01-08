/**
 * InsuranceCard Component - Displays and manages patient insurance
 */

import { Insurance, Patient } from "../../types/Patient";
import PatientService from "../../services/PatientService";

export class InsuranceCard {
  private container: HTMLElement;
  private patientId: string;
  private insuranceList: Insurance[] = [];
  private editMode: boolean = false;
  private editingInsurance: Insurance | null = null;

  constructor(containerId: string, patientId: string) {
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = element;
    this.patientId = patientId;
  }

  /**
   * Set insurance list
   */
  public setInsurance(insurance: Insurance[]): void {
    this.insuranceList = insurance;
    this.render();
  }

  /**
   * Render insurance cards
   */
  private render(): void {
    if (!this.editMode) {
      this.renderList();
    } else {
      this.renderForm();
    }
  }

  /**
   * Render insurance list
   */
  private renderList(): void {
    this.container.innerHTML = `
      <div class="insurance-container">
        <div class="insurance-header">
          <h3>Insurance Information</h3>
          <button class="btn-primary" id="addInsuranceBtn">Add Insurance</button>
        </div>

        ${
          this.insuranceList.length === 0
            ? `
          <div class="no-insurance">
            <p>No insurance information on file</p>
          </div>
        `
            : `
          <div class="insurance-list">
            ${this.insuranceList.map((ins) => this.renderInsuranceCard(ins)).join("")}
          </div>
        `
        }
      </div>
    `;

    this.attachListEventListeners();
  }

  /**
   * Render a single insurance card
   */
  private renderInsuranceCard(insurance: Insurance): string {
    const effectiveDate = new Date(
      insurance.effectiveDate,
    ).toLocaleDateString();
    const expirationDate = insurance.expirationDate
      ? new Date(insurance.expirationDate).toLocaleDateString()
      : "N/A";

    return `
      <div class="insurance-card ${insurance.isPrimary ? "primary" : "secondary"}">
        <div class="insurance-badge">
          ${insurance.isPrimary ? "Primary" : "Secondary"}
        </div>

        <div class="insurance-info">
          <h4>${insurance.provider}</h4>

          <div class="insurance-details">
            <div class="detail-row">
              <span class="label">Policy Number:</span>
              <span class="value">${insurance.policyNumber}</span>
            </div>

            ${
              insurance.groupNumber
                ? `
              <div class="detail-row">
                <span class="label">Group Number:</span>
                <span class="value">${insurance.groupNumber}</span>
              </div>
            `
                : ""
            }

            <div class="detail-row">
              <span class="label">Subscriber:</span>
              <span class="value">${insurance.subscriberName} (${insurance.subscriberId})</span>
            </div>

            <div class="detail-row">
              <span class="label">Relationship:</span>
              <span class="value">${insurance.relationship}</span>
            </div>

            <div class="detail-row">
              <span class="label">Effective Date:</span>
              <span class="value">${effectiveDate}</span>
            </div>

            <div class="detail-row">
              <span class="label">Expiration Date:</span>
              <span class="value">${expirationDate}</span>
            </div>

            <div class="detail-row">
              <span class="label">Verified:</span>
              <span class="value ${insurance.verified ? "verified" : "unverified"}">
                ${insurance.verified ? "✓ Yes" : "✗ No"}
              </span>
            </div>

            ${
              insurance.copay !== undefined
                ? `
              <div class="detail-row">
                <span class="label">Copay:</span>
                <span class="value">$${insurance.copay.toFixed(2)}</span>
              </div>
            `
                : ""
            }

            ${
              insurance.deductible !== undefined
                ? `
              <div class="detail-row">
                <span class="label">Deductible:</span>
                <span class="value">$${insurance.deductible.toFixed(2)}</span>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="insurance-actions">
          <button class="btn-edit" data-insurance-id="${insurance.id}">Edit</button>
        </div>
      </div>
    `;
  }

  /**
   * Render insurance form
   */
  private renderForm(): void {
    const insurance = this.editingInsurance;

    this.container.innerHTML = `
      <div class="insurance-form-container">
        <h3>${insurance ? "Edit" : "Add"} Insurance</h3>

        <form id="insuranceForm" class="insurance-form">
          <div class="form-row">
            <div class="form-group">
              <label for="provider">Insurance Provider *</label>
              <input type="text" id="provider" name="provider" required
                value="${insurance?.provider || ""}">
            </div>

            <div class="form-group">
              <label for="policyNumber">Policy Number *</label>
              <input type="text" id="policyNumber" name="policyNumber" required
                value="${insurance?.policyNumber || ""}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="groupNumber">Group Number</label>
              <input type="text" id="groupNumber" name="groupNumber"
                value="${insurance?.groupNumber || ""}">
            </div>

            <div class="form-group">
              <label for="subscriberName">Subscriber Name *</label>
              <input type="text" id="subscriberName" name="subscriberName" required
                value="${insurance?.subscriberName || ""}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="subscriberId">Subscriber ID *</label>
              <input type="text" id="subscriberId" name="subscriberId" required
                value="${insurance?.subscriberId || ""}">
            </div>

            <div class="form-group">
              <label for="relationship">Relationship *</label>
              <select id="relationship" name="relationship" required>
                <option value="">Select...</option>
                <option value="self" ${insurance?.relationship === "self" ? "selected" : ""}>Self</option>
                <option value="spouse" ${insurance?.relationship === "spouse" ? "selected" : ""}>Spouse</option>
                <option value="child" ${insurance?.relationship === "child" ? "selected" : ""}>Child</option>
                <option value="other" ${insurance?.relationship === "other" ? "selected" : ""}>Other</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="effectiveDate">Effective Date *</label>
              <input type="date" id="effectiveDate" name="effectiveDate" required
                value="${insurance ? new Date(insurance.effectiveDate).toISOString().split("T")[0] || "" : ""}">
            </div>

            <div class="form-group">
              <label for="expirationDate">Expiration Date</label>
              <input type="date" id="expirationDate" name="expirationDate"
                value="${insurance?.expirationDate ? new Date(insurance.expirationDate).toISOString().split("T")[0] || "" : ""}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="copay">Copay ($)</label>
              <input type="number" id="copay" name="copay" step="0.01" min="0"
                value="${insurance?.copay || ""}">
            </div>

            <div class="form-group">
              <label for="deductible">Deductible ($)</label>
              <input type="number" id="deductible" name="deductible" step="0.01" min="0"
                value="${insurance?.deductible || ""}">
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="isPrimary" name="isPrimary"
                ${insurance?.isPrimary ? "checked" : ""}>
              Primary Insurance
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="verified" name="verified"
                ${insurance?.verified ? "checked" : ""}>
              Verified
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Save Insurance</button>
            <button type="button" class="btn-secondary" id="cancelFormBtn">Cancel</button>
          </div>

          <div class="form-message" id="formMessage"></div>
        </form>
      </div>
    `;

    this.attachFormEventListeners();
  }

  /**
   * Attach list event listeners
   */
  private attachListEventListeners(): void {
    const addBtn = this.container.querySelector(
      "#addInsuranceBtn",
    ) as HTMLButtonElement;
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.editMode = true;
        this.editingInsurance = null;
        this.render();
      });
    }

    const editButtons = this.container.querySelectorAll(".btn-edit");
    editButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const insuranceId = target.getAttribute("data-insurance-id");
        if (insuranceId) {
          const insurance = this.insuranceList.find(
            (ins) => ins.id === insuranceId,
          );
          if (insurance) {
            this.editMode = true;
            this.editingInsurance = insurance;
            this.render();
          }
        }
      });
    });
  }

  /**
   * Attach form event listeners
   */
  private attachFormEventListeners(): void {
    const form = this.container.querySelector(
      "#insuranceForm",
    ) as HTMLFormElement;
    const cancelBtn = this.container.querySelector(
      "#cancelFormBtn",
    ) as HTMLButtonElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    cancelBtn.addEventListener("click", () => {
      this.editMode = false;
      this.editingInsurance = null;
      this.render();
    });
  }

  /**
   * Handle form submission
   */
  private async handleSubmit(): Promise<void> {
    const form = this.container.querySelector(
      "#insuranceForm",
    ) as HTMLFormElement;
    const formData = new FormData(form);
    const messageEl = this.container.querySelector(
      "#formMessage",
    ) as HTMLElement;

    try {
      const insuranceData: Insurance = {
        id: this.editingInsurance?.id || "",
        provider: formData.get("provider") as string,
        policyNumber: formData.get("policyNumber") as string,
        groupNumber: (formData.get("groupNumber") as string) || undefined,
        subscriberName: formData.get("subscriberName") as string,
        subscriberId: formData.get("subscriberId") as string,
        relationship: formData.get("relationship") as Insurance["relationship"],
        effectiveDate: formData.get("effectiveDate") as string,
        expirationDate: (formData.get("expirationDate") as string) || undefined,
        isPrimary: (formData.get("isPrimary") as string) === "on",
        verified: (formData.get("verified") as string) === "on",
        verifiedDate: undefined,
        copay: formData.get("copay")
          ? parseFloat(formData.get("copay") as string)
          : undefined,
        deductible: formData.get("deductible")
          ? parseFloat(formData.get("deductible") as string)
          : undefined,
      };

      const response = await PatientService.updateInsurance(
        this.patientId,
        insuranceData,
      );

      if (response.success && response.data) {
        messageEl.className = "form-message success";
        messageEl.textContent = "Insurance saved successfully";

        // Update local list
        this.insuranceList = response.data.insurance;

        // Exit edit mode
        setTimeout(() => {
          this.editMode = false;
          this.editingInsurance = null;
          this.render();
        }, 1000);
      } else {
        throw new Error(response.error || "Failed to save insurance");
      }
    } catch (error) {
      messageEl.className = "form-message error";
      messageEl.textContent =
        error instanceof Error ? error.message : "An error occurred";
    }
  }
}
