/**
 * DashboardBuilder - Dashboard creation and editing interface
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface DashboardConfig {
  name: string;
  description?: string;
  category: string;
  visibility: "public" | "private" | "shared";
}

export class DashboardBuilder {
  private container: HTMLElement;
  private onSave: (config: DashboardConfig) => void;
  private config: Partial<DashboardConfig> = {};

  constructor(
    container: HTMLElement,
    onSave: (config: DashboardConfig) => void,
    initialConfig?: Partial<DashboardConfig>,
  ) {
    this.container = container;
    this.onSave = onSave;
    this.config = initialConfig || {};
    this.render();
  }

  private render(): void {
    this.container.innerHTML = "";

    const form = document.createElement("div");
    form.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
    `;

    const title = document.createElement("h2");
    title.textContent = "Create Dashboard";
    title.style.cssText = "margin: 0 0 24px 0; font-size: 20px;";
    form.appendChild(title);

    // Name
    form.appendChild(this.createField("text", "name", "Dashboard Name", true));

    // Description
    form.appendChild(
      this.createField("textarea", "description", "Description"),
    );

    // Category
    form.appendChild(
      this.createField("select", "category", "Category", true, [
        { value: "quality", label: "Quality" },
        { value: "financial", label: "Financial" },
        { value: "operational", label: "Operational" },
        { value: "population", label: "Population Health" },
      ]),
    );

    // Visibility
    form.appendChild(
      this.createField("select", "visibility", "Visibility", true, [
        { value: "private", label: "Private" },
        { value: "shared", label: "Shared" },
        { value: "public", label: "Public" },
      ]),
    );

    // Buttons
    const buttons = document.createElement("div");
    buttons.style.cssText = "display: flex; gap: 12px; margin-top: 24px;";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Dashboard";
    saveBtn.style.cssText = `
      flex: 1;
      padding: 12px;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    `;
    saveBtn.addEventListener("click", () => this.handleSave());

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `
      padding: 12px 24px;
      background: white;
      color: #666;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      cursor: pointer;
    `;

    buttons.appendChild(saveBtn);
    buttons.appendChild(cancelBtn);
    form.appendChild(buttons);

    this.container.appendChild(form);
  }

  private createField(
    type: string,
    name: string,
    label: string,
    required: boolean = false,
    options?: Array<{ value: string; label: string }>,
  ): HTMLElement {
    const field = document.createElement("div");
    field.style.cssText = "margin-bottom: 20px;";

    const labelEl = document.createElement("label");
    labelEl.textContent = label + (required ? " *" : "");
    labelEl.style.cssText =
      "display: block; margin-bottom: 8px; font-weight: 500;";
    field.appendChild(labelEl);

    let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    if (type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
    } else if (type === "select") {
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
      font-family: inherit;
    `;

    input.value = (this.config as any)[name] || "";
    input.addEventListener("input", (e) => {
      (this.config as any)[name] = (e.target as any).value;
    });

    field.appendChild(input);
    return field;
  }

  private handleSave(): void {
    if (!this.config.name || !this.config.category || !this.config.visibility) {
      alert("Please fill in all required fields");
      return;
    }

    this.onSave(this.config as DashboardConfig);
  }
}
