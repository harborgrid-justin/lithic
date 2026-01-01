/**
 * ReportBuilder - Report configuration builder
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface ReportConfig {
  name: string;
  type: string;
  format: string;
  metrics: string[];
  sections: any[];
}

export class ReportBuilder {
  private container: HTMLElement;
  private onSave: (config: ReportConfig) => void;
  private config: Partial<ReportConfig> = { metrics: [], sections: [] };

  constructor(container: HTMLElement, onSave: (config: ReportConfig) => void) {
    this.container = container;
    this.onSave = onSave;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = "";

    const builder = document.createElement("div");
    builder.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 800px;
    `;

    const title = document.createElement("h2");
    title.textContent = "Build Report";
    title.style.cssText = "margin: 0 0 24px 0;";
    builder.appendChild(title);

    // Basic info
    builder.appendChild(this.createField("text", "name", "Report Name", true));
    builder.appendChild(
      this.createField("select", "type", "Report Type", true, [
        { value: "quality_measures", label: "Quality Measures" },
        { value: "financial_summary", label: "Financial Summary" },
        { value: "operational_dashboard", label: "Operational Dashboard" },
      ]),
    );
    builder.appendChild(
      this.createField("select", "format", "Output Format", true, [
        { value: "pdf", label: "PDF" },
        { value: "excel", label: "Excel" },
        { value: "csv", label: "CSV" },
      ]),
    );

    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Create Report";
    saveBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
    `;
    saveBtn.addEventListener("click", () => this.handleSave());
    builder.appendChild(saveBtn);

    this.container.appendChild(builder);
  }

  private createField(
    type: string,
    name: string,
    label: string,
    required: boolean = false,
    options?: any[],
  ): HTMLElement {
    const field = document.createElement("div");
    field.style.cssText = "margin-bottom: 20px;";

    const labelEl = document.createElement("label");
    labelEl.textContent = label + (required ? " *" : "");
    labelEl.style.cssText =
      "display: block; margin-bottom: 8px; font-weight: 500;";

    let input: HTMLInputElement | HTMLSelectElement;
    if (type === "select") {
      input = document.createElement("select");
      options?.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = type;
    }

    input.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
    `;

    input.addEventListener("input", (e) => {
      (this.config as any)[name] = (e.target as any).value;
    });

    field.appendChild(labelEl);
    field.appendChild(input);
    return field;
  }

  private handleSave(): void {
    if (!this.config.name || !this.config.type || !this.config.format) {
      alert("Please fill in all required fields");
      return;
    }

    this.onSave(this.config as ReportConfig);
  }
}
