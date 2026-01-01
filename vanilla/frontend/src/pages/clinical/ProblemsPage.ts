// Problems Page - Vanilla TypeScript
import ClinicalService from "../../services/ClinicalService";
import ProblemList from "../../components/clinical/ProblemList";

export class ProblemsPage {
  private container: HTMLElement;
  private patientId: string;
  private problemList: ProblemList | null = null;
  private icd10Codes: any[] = [];

  constructor(containerId: string, patientId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.patientId = patientId;
  }

  async init(): Promise<void> {
    await this.render();
    await this.loadProblems();
  }

  private async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="problems-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn btn-link" id="back-btn">← Back</button>
            <h1>Problem List</h1>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="add-problem-btn">Add Problem</button>
          </div>
        </header>

        <div class="filter-section">
          <label>
            <input type="checkbox" id="active-only-checkbox" checked>
            Show active problems only
          </label>
        </div>

        <div id="problem-list-container"></div>

        <div id="add-problem-modal" class="modal" style="display:none;">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Add Problem</h2>
              <button class="close-btn" id="close-modal-btn">&times;</button>
            </div>
            <div class="modal-body">
              <form id="add-problem-form">
                <div class="form-group">
                  <label for="icd10-search">Search ICD-10</label>
                  <input type="text" id="icd10-search" placeholder="Search by code or description">
                  <div id="icd10-results" class="search-results"></div>
                </div>

                <div class="form-group">
                  <label for="selected-icd10">Selected ICD-10 Code</label>
                  <input type="text" id="selected-icd10" readonly>
                  <input type="hidden" id="icd10-code">
                </div>

                <div class="form-group">
                  <label for="problem-name">Problem Name</label>
                  <input type="text" id="problem-name" required>
                </div>

                <div class="form-group">
                  <label for="severity">Severity</label>
                  <select id="severity" required>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="onset-date">Onset Date</label>
                  <input type="date" id="onset-date" required>
                </div>

                <div class="form-group">
                  <label for="notes">Notes</label>
                  <textarea id="notes" rows="3"></textarea>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Add Problem</button>
                  <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private async loadProblems(): Promise<void> {
    try {
      const activeOnly =
        (document.getElementById("active-only-checkbox") as HTMLInputElement)
          ?.checked ?? true;
      const problems = await ClinicalService.getProblemsByPatient(
        this.patientId,
        activeOnly,
      );

      this.problemList = new ProblemList(
        "problem-list-container",
        async (problemId, status) => {
          await this.updateProblemStatus(problemId, status);
        },
      );

      this.problemList.setProblems(problems);
    } catch (error) {
      console.error("Error loading problems:", error);
    }
  }

  private async updateProblemStatus(
    problemId: string,
    status: string,
  ): Promise<void> {
    try {
      await ClinicalService.updateProblem(problemId, {
        status,
        resolvedDate:
          status === "resolved" ? new Date().toISOString() : undefined,
      });
      await this.loadProblems();
    } catch (error) {
      console.error("Error updating problem:", error);
      alert("Failed to update problem");
    }
  }

  private attachEventListeners(): void {
    const backBtn = document.getElementById("back-btn");
    backBtn?.addEventListener("click", () => {
      window.history.back();
    });

    const addProblemBtn = document.getElementById("add-problem-btn");
    addProblemBtn?.addEventListener("click", () => {
      this.showModal();
    });

    const closeModalBtn = document.getElementById("close-modal-btn");
    closeModalBtn?.addEventListener("click", () => {
      this.hideModal();
    });

    const activeOnlyCheckbox = document.getElementById("active-only-checkbox");
    activeOnlyCheckbox?.addEventListener("change", async () => {
      await this.loadProblems();
    });

    const icd10Search = document.getElementById(
      "icd10-search",
    ) as HTMLInputElement;
    icd10Search?.addEventListener("input", async (e) => {
      await this.searchICD10((e.target as HTMLInputElement).value);
    });

    const addProblemForm = document.getElementById(
      "add-problem-form",
    ) as HTMLFormElement;
    addProblemForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.addProblem(addProblemForm);
    });

    const cancelBtn = document.getElementById("cancel-btn");
    cancelBtn?.addEventListener("click", () => {
      this.hideModal();
    });
  }

  private showModal(): void {
    const modal = document.getElementById("add-problem-modal");
    if (modal) {
      modal.style.display = "block";
    }
  }

  private hideModal(): void {
    const modal = document.getElementById("add-problem-modal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  private async searchICD10(query: string): Promise<void> {
    if (query.length < 2) {
      const resultsContainer = document.getElementById("icd10-results");
      if (resultsContainer) {
        resultsContainer.innerHTML = "";
      }
      return;
    }

    try {
      const codes = await ClinicalService.searchICD10(query);
      this.displayICD10Results(codes);
    } catch (error) {
      console.error("Error searching ICD-10:", error);
    }
  }

  private displayICD10Results(codes: any[]): void {
    const resultsContainer = document.getElementById("icd10-results");
    if (!resultsContainer) return;

    if (codes.length === 0) {
      resultsContainer.innerHTML =
        '<div class="no-results">No codes found</div>';
      return;
    }

    resultsContainer.innerHTML = codes
      .map(
        (code) => `
      <div class="search-result-item" data-code="${code.code}" data-description="${code.description}">
        <strong>${code.code}</strong> - ${code.description}
      </div>
    `,
      )
      .join("");

    // Attach click handlers to results
    const resultItems = resultsContainer.querySelectorAll(
      ".search-result-item",
    );
    resultItems.forEach((item) => {
      item.addEventListener("click", () => {
        const code = item.getAttribute("data-code");
        const description = item.getAttribute("data-description");
        this.selectICD10Code(code || "", description || "");
      });
    });
  }

  private selectICD10Code(code: string, description: string): void {
    const selectedInput = document.getElementById(
      "selected-icd10",
    ) as HTMLInputElement;
    const codeInput = document.getElementById("icd10-code") as HTMLInputElement;
    const problemNameInput = document.getElementById(
      "problem-name",
    ) as HTMLInputElement;
    const resultsContainer = document.getElementById("icd10-results");

    if (selectedInput) {
      selectedInput.value = `${code} - ${description}`;
    }
    if (codeInput) {
      codeInput.value = code;
    }
    if (problemNameInput && !problemNameInput.value) {
      problemNameInput.value = description;
    }
    if (resultsContainer) {
      resultsContainer.innerHTML = "";
    }
  }

  private async addProblem(form: HTMLFormElement): Promise<void> {
    try {
      const formData = new FormData(form);
      const data = {
        patientId: this.patientId,
        icd10Code: (document.getElementById("icd10-code") as HTMLInputElement)
          ?.value,
        problemName: (
          document.getElementById("problem-name") as HTMLInputElement
        )?.value,
        severity: (document.getElementById("severity") as HTMLSelectElement)
          ?.value,
        onsetDate: (document.getElementById("onset-date") as HTMLInputElement)
          ?.value,
        notes: (document.getElementById("notes") as HTMLTextAreaElement)?.value,
      };

      await ClinicalService.createProblem(data);
      alert("Problem added successfully");
      this.hideModal();
      form.reset();
      await this.loadProblems();
    } catch (error) {
      console.error("Error adding problem:", error);
      alert("Failed to add problem");
    }
  }

  destroy(): void {
    this.problemList?.destroy();
    this.container.innerHTML = "";
  }
}

export default ProblemsPage;
