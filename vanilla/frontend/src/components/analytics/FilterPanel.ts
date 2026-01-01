/**
 * FilterPanel - Dynamic filter panel for analytics
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface Filter {
  id: string;
  label: string;
  type: "select" | "multiselect" | "text" | "number" | "daterange";
  options?: FilterOption[];
  value?: any;
}

export interface FilterPanelConfig {
  filters: Filter[];
  onApply: (filters: Record<string, any>) => void;
  onReset?: () => void;
}

export class FilterPanel {
  private container: HTMLElement;
  private config: FilterPanelConfig;
  private filterValues: Record<string, any> = {};

  constructor(container: HTMLElement, config: FilterPanelConfig) {
    this.container = container;
    this.config = config;
    this.initializeFilterValues();
    this.render();
  }

  private initializeFilterValues(): void {
    this.config.filters.forEach((filter) => {
      this.filterValues[filter.id] = filter.value || null;
    });
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.className = "filter-panel";

    const panel = document.createElement("div");
    panel.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Title
    const title = document.createElement("h3");
    title.textContent = "Filters";
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    `;
    panel.appendChild(title);

    // Filters
    const filtersContainer = document.createElement("div");
    filtersContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    `;

    this.config.filters.forEach((filter) => {
      const filterElement = this.createFilter(filter);
      filtersContainer.appendChild(filterElement);
    });

    panel.appendChild(filtersContainer);

    // Buttons
    const buttons = document.createElement("div");
    buttons.style.cssText = `
      display: flex;
      gap: 12px;
    `;

    const applyBtn = this.createButton("Apply Filters", "primary");
    applyBtn.addEventListener("click", () => this.handleApply());

    const resetBtn = this.createButton("Reset", "secondary");
    resetBtn.addEventListener("click", () => this.handleReset());

    buttons.appendChild(applyBtn);
    buttons.appendChild(resetBtn);
    panel.appendChild(buttons);

    this.container.appendChild(panel);
  }

  private createFilter(filter: Filter): HTMLElement {
    const container = document.createElement("div");

    // Label
    const label = document.createElement("label");
    label.textContent = filter.label;
    label.style.cssText = `
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    `;
    container.appendChild(label);

    // Input
    let input: HTMLElement;
    switch (filter.type) {
      case "select":
        input = this.createSelectInput(filter);
        break;
      case "multiselect":
        input = this.createMultiSelectInput(filter);
        break;
      case "text":
        input = this.createTextInput(filter);
        break;
      case "number":
        input = this.createNumberInput(filter);
        break;
      case "daterange":
        input = this.createDateRangeInput(filter);
        break;
      default:
        input = this.createTextInput(filter);
    }

    container.appendChild(input);
    return container;
  }

  private createSelectInput(filter: Filter): HTMLElement {
    const select = document.createElement("select");
    select.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
      background: white;
      cursor: pointer;
    `;

    // Default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select...";
    select.appendChild(defaultOption);

    // Options
    filter.options?.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = String(option.value);
      optionElement.textContent = option.label;
      if (this.filterValues[filter.id] === option.value) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });

    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      this.filterValues[filter.id] = target.value || null;
    });

    return select;
  }

  private createMultiSelectInput(filter: Filter): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 8px;
      max-height: 150px;
      overflow-y: auto;
    `;

    if (!this.filterValues[filter.id]) {
      this.filterValues[filter.id] = [];
    }

    filter.options?.forEach((option) => {
      const label = document.createElement("label");
      label.style.cssText = `
        display: flex;
        align-items: center;
        padding: 4px;
        cursor: pointer;
        font-size: 14px;
      `;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = String(option.value);
      checkbox.checked = this.filterValues[filter.id].includes(option.value);
      checkbox.style.cssText = `
        margin-right: 8px;
      `;

      checkbox.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
          this.filterValues[filter.id].push(option.value);
        } else {
          this.filterValues[filter.id] = this.filterValues[filter.id].filter(
            (v: any) => v !== option.value,
          );
        }
      });

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(option.label));
      container.appendChild(label);
    });

    return container;
  }

  private createTextInput(filter: Filter): HTMLElement {
    const input = document.createElement("input");
    input.type = "text";
    input.value = this.filterValues[filter.id] || "";
    input.placeholder = `Enter ${filter.label.toLowerCase()}...`;
    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
    `;

    input.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      this.filterValues[filter.id] = target.value || null;
    });

    return input;
  }

  private createNumberInput(filter: Filter): HTMLElement {
    const input = document.createElement("input");
    input.type = "number";
    input.value = this.filterValues[filter.id] || "";
    input.placeholder = `Enter ${filter.label.toLowerCase()}...`;
    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
    `;

    input.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      this.filterValues[filter.id] = target.value ? Number(target.value) : null;
    });

    return input;
  }

  private createDateRangeInput(filter: Filter): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    const startInput = document.createElement("input");
    startInput.type = "date";
    startInput.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
    `;

    const separator = document.createElement("span");
    separator.textContent = "to";
    separator.style.color = "#666";

    const endInput = document.createElement("input");
    endInput.type = "date";
    endInput.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
    `;

    if (this.filterValues[filter.id]) {
      startInput.value = this.filterValues[filter.id].start || "";
      endInput.value = this.filterValues[filter.id].end || "";
    }

    const updateValue = () => {
      this.filterValues[filter.id] = {
        start: startInput.value || null,
        end: endInput.value || null,
      };
    };

    startInput.addEventListener("change", updateValue);
    endInput.addEventListener("change", updateValue);

    container.appendChild(startInput);
    container.appendChild(separator);
    container.appendChild(endInput);

    return container;
  }

  private createButton(
    text: string,
    variant: "primary" | "secondary",
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = text;

    const isPrimary = variant === "primary";
    btn.style.cssText = `
      flex: 1;
      padding: 10px 16px;
      border: 1px solid ${isPrimary ? "#4a90e2" : "#dee2e6"};
      background: ${isPrimary ? "#4a90e2" : "white"};
      color: ${isPrimary ? "white" : "#333"};
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-1px)";
      btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
      btn.style.boxShadow = "";
    });

    return btn;
  }

  private handleApply(): void {
    // Filter out null/empty values
    const activeFilters: Record<string, any> = {};
    Object.entries(this.filterValues).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== "" &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        activeFilters[key] = value;
      }
    });

    this.config.onApply(activeFilters);
  }

  private handleReset(): void {
    this.initializeFilterValues();
    this.render();

    if (this.config.onReset) {
      this.config.onReset();
    }
  }

  public getValues(): Record<string, any> {
    return { ...this.filterValues };
  }

  public setValues(values: Record<string, any>): void {
    this.filterValues = { ...this.filterValues, ...values };
    this.render();
  }
}
