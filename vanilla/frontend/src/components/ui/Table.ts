/**
 * Table Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => string | HTMLElement;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyField?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  onSort?: (column: string, direction: "asc" | "desc") => void;
}

interface TableState {
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  loading: boolean;
}

export class Table<T = any> extends Component<TableProps<T>, TableState> {
  constructor(props: TableProps<T>) {
    super(props, {
      sortColumn: null,
      sortDirection: "asc",
      loading: props.loading || false,
    });

    this.handleSort = this.handleSort.bind(this);
  }

  protected getClassName(): string {
    const classes = ["table-wrapper"];

    if (this.state.loading) {
      classes.push("table-loading");
    }

    return classes.join(" ");
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();

    if (this.state.loading) {
      const loader = createElement("div", {
        className: "table-loader",
        innerHTML: '<div class="spinner"></div><p>Loading...</p>',
      });
      this.element.appendChild(loader);
      return;
    }

    const tableClasses = ["table"];

    if (this.props.striped) {
      tableClasses.push("table-striped");
    }

    if (this.props.hoverable) {
      tableClasses.push("table-hoverable");
    }

    if (this.props.bordered) {
      tableClasses.push("table-bordered");
    }

    const table = createElement("table", {
      className: tableClasses.join(" "),
    });

    // Create header
    const thead = this.createHeader();
    table.appendChild(thead);

    // Create body
    const tbody = this.createBody();
    table.appendChild(tbody);

    this.element.appendChild(table);
  }

  private createHeader(): HTMLElement {
    const thead = createElement("thead", { className: "table-header" });
    const tr = createElement("tr");

    this.props.columns.forEach((column) => {
      const th = createElement("th", {
        className: column.sortable ? "table-th-sortable" : "table-th",
        ...(column.width && {
          attributes: { style: `width: ${column.width}` },
        }),
      });

      const content = createElement("div", {
        className: "table-th-content",
      });

      const label = createElement("span", {
        textContent: column.label,
      });
      content.appendChild(label);

      if (column.sortable) {
        const sortIcon = createElement("span", {
          className: this.getSortIconClass(column.key),
        });
        content.appendChild(sortIcon);

        th.addEventListener("click", () => this.handleSort(column.key));
      }

      th.appendChild(content);
      tr.appendChild(th);
    });

    thead.appendChild(tr);
    return thead;
  }

  private createBody(): HTMLElement {
    const tbody = createElement("tbody", { className: "table-body" });

    if (this.props.data.length === 0) {
      const tr = createElement("tr");
      const td = createElement("td", {
        className: "table-empty",
        textContent: this.props.emptyMessage || "No data available",
        attributes: {
          colspan: String(this.props.columns.length),
        },
      });
      tr.appendChild(td);
      tbody.appendChild(tr);
      return tbody;
    }

    this.props.data.forEach((row, rowIndex) => {
      const tr = createElement("tr", {
        className: "table-row",
        ...(this.props.onRowClick && {
          events: {
            click: () => this.props.onRowClick!(row, rowIndex),
          },
        }),
      });

      if (this.props.onRowClick) {
        tr.classList.add("table-row-clickable");
      }

      this.props.columns.forEach((column) => {
        const td = createElement("td", { className: "table-cell" });

        const value = (row as any)[column.key];

        if (column.render) {
          const rendered = column.render(value, row);
          if (typeof rendered === "string") {
            td.innerHTML = rendered;
          } else {
            td.appendChild(rendered);
          }
        } else {
          td.textContent = value != null ? String(value) : "";
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    return tbody;
  }

  private getSortIconClass(columnKey: string): string {
    const classes = ["table-sort-icon"];

    if (this.state.sortColumn === columnKey) {
      classes.push("table-sort-active");
      classes.push(`table-sort-${this.state.sortDirection}`);
    }

    return classes.join(" ");
  }

  private handleSort(columnKey: string): void {
    let direction: "asc" | "desc" = "asc";

    if (this.state.sortColumn === columnKey) {
      direction = this.state.sortDirection === "asc" ? "desc" : "asc";
    }

    this.setState({
      sortColumn: columnKey,
      sortDirection: direction,
    });

    if (this.props.onSort) {
      this.props.onSort(columnKey, direction);
    }
  }

  public setData(data: T[]): void {
    this.props.data = data;
    this.update();
  }

  public setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  public getData(): T[] {
    return this.props.data;
  }
}

export default Table;
