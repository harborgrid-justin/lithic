/**
 * DataTable - Sortable, filterable data table component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  formatter?: (value: any) => string;
  width?: string;
}

export interface DataTableConfig {
  columns: DataTableColumn[];
  data: any[];
  pageSize?: number;
  showPagination?: boolean;
  onRowClick?: (row: any) => void;
}

export class DataTable {
  private container: HTMLElement;
  private config: DataTableConfig;
  private currentPage: number = 1;
  private sortColumn: string | null = null;
  private sortDirection: "asc" | "desc" = "asc";
  private filteredData: any[] = [];

  constructor(container: HTMLElement, config: DataTableConfig) {
    this.container = container;
    this.config = {
      pageSize: 10,
      showPagination: true,
      ...config,
    };
    this.filteredData = [...config.data];
    this.render();
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.className = "data-table";

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Table
    const tableContainer = document.createElement("div");
    tableContainer.style.cssText = `
      overflow-x: auto;
    `;

    const table = document.createElement("table");
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
    `;

    // Header
    const thead = this.createHeader();
    table.appendChild(thead);

    // Body
    const tbody = this.createBody();
    table.appendChild(tbody);

    tableContainer.appendChild(table);
    wrapper.appendChild(tableContainer);

    // Pagination
    if (this.config.showPagination) {
      const pagination = this.createPagination();
      wrapper.appendChild(pagination);
    }

    this.container.appendChild(wrapper);
  }

  private createHeader(): HTMLElement {
    const thead = document.createElement("thead");
    thead.style.cssText = `
      background: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    `;

    const tr = document.createElement("tr");

    this.config.columns.forEach((column) => {
      const th = document.createElement("th");
      th.style.cssText = `
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        color: #333;
        cursor: ${column.sortable !== false ? "pointer" : "default"};
        user-select: none;
        white-space: nowrap;
        ${column.width ? `width: ${column.width};` : ""}
      `;

      const content = document.createElement("div");
      content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      const label = document.createElement("span");
      label.textContent = column.label;

      content.appendChild(label);

      // Sort indicator
      if (column.sortable !== false) {
        const sortIndicator = document.createElement("span");
        sortIndicator.style.cssText = `
          font-size: 12px;
          color: #999;
        `;

        if (this.sortColumn === column.key) {
          sortIndicator.textContent = this.sortDirection === "asc" ? "▲" : "▼";
          sortIndicator.style.color = "#4a90e2";
        } else {
          sortIndicator.textContent = "⇅";
        }

        content.appendChild(sortIndicator);

        th.addEventListener("click", () => this.handleSort(column.key));
      }

      th.appendChild(content);
      tr.appendChild(th);
    });

    thead.appendChild(tr);
    return thead;
  }

  private createBody(): HTMLElement {
    const tbody = document.createElement("tbody");

    const paginatedData = this.getPaginatedData();

    if (paginatedData.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = this.config.columns.length;
      td.textContent = "No data available";
      td.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #999;
      `;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return tbody;
    }

    paginatedData.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.style.cssText = `
        border-bottom: 1px solid #e9ecef;
        transition: background-color 0.2s;
        cursor: ${this.config.onRowClick ? "pointer" : "default"};
      `;

      tr.addEventListener("mouseenter", () => {
        tr.style.backgroundColor = "#f8f9fa";
      });

      tr.addEventListener("mouseleave", () => {
        tr.style.backgroundColor = "";
      });

      if (this.config.onRowClick) {
        tr.addEventListener("click", () => this.config.onRowClick!(row));
      }

      this.config.columns.forEach((column) => {
        const td = document.createElement("td");
        td.style.cssText = `
          padding: 12px 16px;
          font-size: 14px;
          color: #333;
        `;

        const value = row[column.key];
        const displayValue = column.formatter
          ? column.formatter(value)
          : String(value);
        td.textContent = displayValue;

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    return tbody;
  }

  private createPagination(): HTMLElement {
    const pagination = document.createElement("div");
    pagination.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-top: 1px solid #e9ecef;
    `;

    // Info
    const info = document.createElement("div");
    info.style.cssText = `
      font-size: 14px;
      color: #666;
    `;

    const start = (this.currentPage - 1) * this.config.pageSize! + 1;
    const end = Math.min(
      this.currentPage * this.config.pageSize!,
      this.filteredData.length,
    );
    const total = this.filteredData.length;

    info.textContent = `Showing ${start}-${end} of ${total}`;

    // Buttons
    const buttons = document.createElement("div");
    buttons.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const totalPages = Math.ceil(
      this.filteredData.length / this.config.pageSize!,
    );

    // Previous button
    const prevBtn = this.createButton("Previous", this.currentPage === 1);
    prevBtn.addEventListener("click", () =>
      this.goToPage(this.currentPage - 1),
    );
    buttons.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      const pageBtn = this.createButton(
        String(i),
        false,
        i === this.currentPage,
      );
      pageBtn.addEventListener("click", () => this.goToPage(i));
      buttons.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = this.createButton("Next", this.currentPage >= totalPages);
    nextBtn.addEventListener("click", () =>
      this.goToPage(this.currentPage + 1),
    );
    buttons.appendChild(nextBtn);

    pagination.appendChild(info);
    pagination.appendChild(buttons);

    return pagination;
  }

  private createButton(
    text: string,
    disabled: boolean,
    active: boolean = false,
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.disabled = disabled;
    btn.style.cssText = `
      padding: 6px 12px;
      border: 1px solid ${active ? "#4a90e2" : "#dee2e6"};
      background: ${active ? "#4a90e2" : "white"};
      color: ${active ? "white" : disabled ? "#999" : "#333"};
      border-radius: 4px;
      cursor: ${disabled ? "not-allowed" : "pointer"};
      font-size: 14px;
      transition: all 0.2s;
    `;

    if (!disabled && !active) {
      btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#f8f9fa";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "white";
      });
    }

    return btn;
  }

  private handleSort(columnKey: string): void {
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = "asc";
    }

    this.filteredData.sort((a, b) => {
      const aVal = a[columnKey];
      const bVal = b[columnKey];

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      return this.sortDirection === "asc" ? comparison : -comparison;
    });

    this.render();
  }

  private getPaginatedData(): any[] {
    const start = (this.currentPage - 1) * this.config.pageSize!;
    const end = start + this.config.pageSize!;
    return this.filteredData.slice(start, end);
  }

  private goToPage(page: number): void {
    const totalPages = Math.ceil(
      this.filteredData.length / this.config.pageSize!,
    );
    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.render();
  }

  public updateData(data: any[]): void {
    this.config.data = data;
    this.filteredData = [...data];
    this.currentPage = 1;
    this.render();
  }

  public filter(predicate: (row: any) => boolean): void {
    this.filteredData = this.config.data.filter(predicate);
    this.currentPage = 1;
    this.render();
  }

  public clearFilter(): void {
    this.filteredData = [...this.config.data];
    this.currentPage = 1;
    this.render();
  }
}
