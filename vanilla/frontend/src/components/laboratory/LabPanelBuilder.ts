/**
 * Lab Panel Builder Component
 * Create and manage laboratory test panels
 */

export class LabPanelBuilder {
  private container: HTMLElement;
  private onSave?: (panelData: any) => void;
  private availableTests: any[] = [];
  private selectedTests: Set<string> = new Set();

  constructor(
    container: HTMLElement,
    options: { onSave?: (panelData: any) => void } = {},
  ) {
    this.container = container;
    this.onSave = options.onSave;
  }

  setAvailableTests(tests: any[]): void {
    this.availableTests = tests;
    this.render();
  }

  private render(): void {
    const html = `
      <div class="lab-panel-builder">
        <form id="panelBuilderForm">
          <div class="panel-info">
            <div class="form-group">
              <label for="panelName">Panel Name*</label>
              <input type="text" id="panelName" name="panelName" required>
            </div>

            <div class="form-group">
              <label for="panelCode">Panel Code*</label>
              <input type="text" id="panelCode" name="panelCode" required>
            </div>

            <div class="form-group">
              <label for="category">Category*</label>
              <select id="category" name="category" required>
                <option value="chemistry">Chemistry</option>
                <option value="hematology">Hematology</option>
                <option value="immunology">Immunology</option>
                <option value="microbiology">Microbiology</option>
                <option value="molecular">Molecular</option>
                <option value="endocrinology">Endocrinology</option>
                <option value="coagulation">Coagulation</option>
              </select>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" rows="2"></textarea>
            </div>
          </div>

          <div class="test-selection">
            <h4>Select Tests</h4>
            <div class="test-search">
              <input type="text" id="testSearch" placeholder="Search tests...">
            </div>
            <div class="test-list">
              ${this.availableTests.map((test) => this.renderTestOption(test)).join("")}
            </div>
          </div>

          <div class="selected-tests">
            <h4>Selected Tests (<span id="selectedCount">0</span>)</h4>
            <div id="selectedTestsList" class="selected-list"></div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Panel</button>
          </div>
        </form>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private renderTestOption(test: any): string {
    const isSelected = this.selectedTests.has(test.code);
    return `
      <div class="test-option" data-test-code="${test.code}">
        <input type="checkbox" id="test-${test.code}" ${isSelected ? "checked" : ""}>
        <label for="test-${test.code}">
          <strong>${test.commonName || test.displayName}</strong>
          <span class="test-code">${test.code}</span>
          <span class="test-category">${test.category}</span>
        </label>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector(
      "#panelBuilderForm",
    ) as HTMLFormElement;
    const cancelBtn = this.container.querySelector("#cancelBtn");
    const testSearch = this.container.querySelector(
      "#testSearch",
    ) as HTMLInputElement;

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSubmit(form);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.selectedTests.clear();
        form?.reset();
        this.updateSelectedTests();
      });
    }

    if (testSearch) {
      testSearch.addEventListener("input", (e) => {
        this.handleSearch((e.target as HTMLInputElement).value);
      });
    }

    // Test selection
    const testOptions = this.container.querySelectorAll(
      '.test-option input[type="checkbox"]',
    );
    testOptions.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        const testCode = target.id.replace("test-", "");
        if (target.checked) {
          this.selectedTests.add(testCode);
        } else {
          this.selectedTests.delete(testCode);
        }
        this.updateSelectedTests();
      });
    });
  }

  private handleSearch(query: string): void {
    const lowerQuery = query.toLowerCase();
    const testOptions = this.container.querySelectorAll(".test-option");

    testOptions.forEach((option) => {
      const label = option.querySelector("label");
      if (label) {
        const text = label.textContent?.toLowerCase() || "";
        (option as HTMLElement).style.display = text.includes(lowerQuery)
          ? "block"
          : "none";
      }
    });
  }

  private updateSelectedTests(): void {
    const selectedList = this.container.querySelector("#selectedTestsList");
    const selectedCount = this.container.querySelector("#selectedCount");

    if (selectedCount) {
      selectedCount.textContent = this.selectedTests.size.toString();
    }

    if (selectedList) {
      const selectedTestsArray = Array.from(this.selectedTests);
      selectedList.innerHTML = selectedTestsArray
        .map((code) => {
          const test = this.availableTests.find((t) => t.code === code);
          return test
            ? `
          <div class="selected-test-item">
            <span>${test.commonName || test.displayName}</span>
            <button type="button" class="remove-btn" data-test-code="${code}">×</button>
          </div>
        `
            : "";
        })
        .join("");

      // Attach remove handlers
      const removeBtns = selectedList.querySelectorAll(".remove-btn");
      removeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const testCode = btn.getAttribute("data-test-code");
          if (testCode) {
            this.selectedTests.delete(testCode);
            const checkbox = this.container.querySelector(
              `#test-${testCode}`,
            ) as HTMLInputElement;
            if (checkbox) checkbox.checked = false;
            this.updateSelectedTests();
          }
        });
      });
    }
  }

  private handleSubmit(form: HTMLFormElement): void {
    const formData = new FormData(form);

    const panelData: any = {
      name: formData.get("panelName"),
      code: formData.get("panelCode"),
      category: formData.get("category"),
      description: formData.get("description") || "",
      tests: Array.from(this.selectedTests),
      specimenTypes: ["blood-serum", "blood-plasma"],
      active: true,
    };

    if (this.onSave) {
      this.onSave(panelData);
    }
  }

  destroy(): void {
    this.container.innerHTML = "";
  }
}
