/**
 * DateRangePicker - Date range selection component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangePickerConfig {
  initialRange?: DateRange;
  presets?: Array<{ label: string; days: number }>;
  onChange: (range: DateRange) => void;
}

export class DateRangePicker {
  private container: HTMLElement;
  private config: DateRangePickerConfig;
  private currentRange: DateRange;

  private defaultPresets = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
    { label: "Last 12 Months", days: 365 },
    { label: "Year to Date", days: -1 },
  ];

  constructor(container: HTMLElement, config: DateRangePickerConfig) {
    this.container = container;
    this.config = {
      presets: this.defaultPresets,
      ...config,
    };

    this.currentRange = config.initialRange || this.getDefaultRange();
    this.render();
  }

  private getDefaultRange(): DateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end };
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.className = "date-range-picker";

    const picker = document.createElement("div");
    picker.style.cssText = `
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    `;

    // Date inputs
    const dateInputs = this.createDateInputs();
    picker.appendChild(dateInputs);

    // Presets
    if (this.config.presets && this.config.presets.length > 0) {
      const presets = this.createPresets();
      picker.appendChild(presets);
    }

    this.container.appendChild(picker);
  }

  private createDateInputs(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;

    // Start date
    const startInput = document.createElement("input");
    startInput.type = "date";
    startInput.value = this.formatDate(this.currentRange.start);
    startInput.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
    `;

    startInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.currentRange.start = new Date(target.value);
      this.config.onChange(this.currentRange);
    });

    // Separator
    const separator = document.createElement("span");
    separator.textContent = "—";
    separator.style.color = "#666";

    // End date
    const endInput = document.createElement("input");
    endInput.type = "date";
    endInput.value = this.formatDate(this.currentRange.end);
    endInput.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-size: 14px;
    `;

    endInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.currentRange.end = new Date(target.value);
      this.config.onChange(this.currentRange);
    });

    container.appendChild(startInput);
    container.appendChild(separator);
    container.appendChild(endInput);

    return container;
  }

  private createPresets(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    `;

    this.config.presets!.forEach((preset) => {
      const btn = document.createElement("button");
      btn.textContent = preset.label;
      btn.style.cssText = `
        padding: 6px 12px;
        border: 1px solid #dee2e6;
        background: white;
        color: #333;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      `;

      btn.addEventListener("click", () => this.applyPreset(preset.days));

      btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#f8f9fa";
        btn.style.borderColor = "#4a90e2";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "white";
        btn.style.borderColor = "#dee2e6";
      });

      container.appendChild(btn);
    });

    return container;
  }

  private applyPreset(days: number): void {
    const end = new Date();
    const start = new Date();

    if (days === -1) {
      // Year to date
      start.setMonth(0, 1);
    } else {
      start.setDate(start.getDate() - days);
    }

    this.currentRange = { start, end };
    this.config.onChange(this.currentRange);
    this.render();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0] || "";
  }

  public getRange(): DateRange {
    return { ...this.currentRange };
  }

  public setRange(range: DateRange): void {
    this.currentRange = range;
    this.render();
  }
}
