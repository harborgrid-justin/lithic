/**
 * WidgetLibrary - Widget selection and preview library
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface WidgetTemplate {
  id: string;
  type: "kpi" | "chart" | "table" | "metric";
  name: string;
  description: string;
  icon: string;
  defaultConfig: any;
}

export class WidgetLibrary {
  private container: HTMLElement;
  private onSelect: (template: WidgetTemplate) => void;

  private templates: WidgetTemplate[] = [
    {
      id: "kpi-card",
      type: "kpi",
      name: "KPI Card",
      description: "Single key performance indicator with trend",
      icon: "📊",
      defaultConfig: { w: 1, h: 1 },
    },
    {
      id: "line-chart",
      type: "chart",
      name: "Line Chart",
      description: "Time series line chart",
      icon: "📈",
      defaultConfig: { w: 2, h: 2 },
    },
    {
      id: "bar-chart",
      type: "chart",
      name: "Bar Chart",
      description: "Comparative bar chart",
      icon: "📊",
      defaultConfig: { w: 2, h: 2 },
    },
    {
      id: "pie-chart",
      type: "chart",
      name: "Pie Chart",
      description: "Distribution pie chart",
      icon: "🥧",
      defaultConfig: { w: 2, h: 2 },
    },
    {
      id: "data-table",
      type: "table",
      name: "Data Table",
      description: "Sortable data table",
      icon: "📋",
      defaultConfig: { w: 3, h: 2 },
    },
  ];

  constructor(
    container: HTMLElement,
    onSelect: (template: WidgetTemplate) => void,
  ) {
    this.container = container;
    this.onSelect = onSelect;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = "";

    const library = document.createElement("div");
    library.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    const title = document.createElement("h3");
    title.textContent = "Widget Library";
    title.style.cssText =
      "margin: 0 0 16px 0; font-size: 16px; font-weight: 600;";
    library.appendChild(title);

    const grid = document.createElement("div");
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    `;

    this.templates.forEach((template) => {
      const card = this.createTemplateCard(template);
      grid.appendChild(card);
    });

    library.appendChild(grid);
    this.container.appendChild(library);
  }

  private createTemplateCard(template: WidgetTemplate): HTMLElement {
    const card = document.createElement("div");
    card.style.cssText = `
      padding: 16px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    `;

    const icon = document.createElement("div");
    icon.textContent = template.icon;
    icon.style.cssText = "font-size: 32px; margin-bottom: 8px;";

    const name = document.createElement("div");
    name.textContent = template.name;
    name.style.cssText =
      "font-size: 14px; font-weight: 600; margin-bottom: 4px;";

    const description = document.createElement("div");
    description.textContent = template.description;
    description.style.cssText = "font-size: 12px; color: #666;";

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(description);

    card.addEventListener("click", () => this.onSelect(template));

    card.addEventListener("mouseenter", () => {
      card.style.borderColor = "#4a90e2";
      card.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.borderColor = "#e9ecef";
      card.style.boxShadow = "none";
    });

    return card;
  }
}
