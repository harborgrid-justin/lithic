/* eslint-disable react/require-render-return */
/**
 * DataTable Component with Pagination and Search
 */

import { Component } from "../base/Component";
import { Table, TableColumn, TableProps } from "./Table";
import { Input } from "./Input";
import { createElement } from "../../utils/dom";

export interface DataTableProps<T = any> extends TableProps<T> {
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
}

interface DataTableState {
  currentPage: number;
  searchQuery: string;
  filteredData: any[];
}

export class DataTable<T = any> extends Component<
  DataTableProps<T>,
  DataTableState
> {
  private table: Table<T> | null = null;
  private searchInput: Input | null = null;

  constructor(props: DataTableProps<T>) {
    super(props, {
      currentPage: 1,
      searchQuery: "",
      filteredData: props.data,
    });
  }

  protected getClassName(): string {
    return "data-table";
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();
    this.removeAllChildren();

    // Search bar
    if (this.props.searchable) {
      const searchBar = this.createSearchBar();
      this.element.appendChild(searchBar);
    }

    // Table
    const tableContainer = createElement("div", {
      className: "data-table-container",
    });

    const paginatedData = this.getPaginatedData();
    this.table = new Table({
      ...this.props,
      data: paginatedData,
    });

    this.addChild(this.table, tableContainer);
    this.element.appendChild(tableContainer);

    // Pagination
    if (this.props.pagination) {
      const pagination = this.createPagination();
      this.element.appendChild(pagination);
    }
  }

  private createSearchBar(): HTMLElement {
    const searchBar = createElement("div", {
      className: "data-table-search",
    });

    this.searchInput = new Input({
      type: "search",
      placeholder: this.props.searchPlaceholder || "Search...",
      icon: "🔍",
      onInput: (value) => this.handleSearch(value),
    });

    this.addChild(this.searchInput, searchBar);
    return searchBar;
  }

  private createPagination(): HTMLElement {
    const pagination = createElement("div", {
      className: "data-table-pagination",
    });

    const totalPages = this.getTotalPages();
    const { currentPage } = this.state;

    const info = createElement("div", {
      className: "pagination-info",
      textContent: `Page ${currentPage} of ${totalPages}`,
    });

    const controls = createElement("div", {
      className: "pagination-controls",
    });

    const prevBtn = createElement("button", {
      className: "pagination-btn",
      textContent: "Previous",
      attributes: {
        disabled: currentPage === 1 ? "true" : undefined,
      },
      events: {
        click: () => this.changePage(currentPage - 1),
      },
    });

    const nextBtn = createElement("button", {
      className: "pagination-btn",
      textContent: "Next",
      attributes: {
        disabled: currentPage === totalPages ? "true" : undefined,
      },
      events: {
        click: () => this.changePage(currentPage + 1),
      },
    });

    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);

    pagination.appendChild(info);
    pagination.appendChild(controls);

    return pagination;
  }

  private handleSearch(query: string): void {
    this.setState({
      searchQuery: query,
      currentPage: 1,
      filteredData: this.filterData(query),
    });

    if (this.props.onSearch) {
      this.props.onSearch(query);
    }
  }

  private filterData(query: string): any[] {
    if (!query) {
      return this.props.data;
    }

    const lowerQuery = query.toLowerCase();

    return this.props.data.filter((row) => {
      return this.props.columns.some((column) => {
        const value = (row as any)[column.key];
        return value && String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }

  private getPaginatedData(): any[] {
    if (!this.props.pagination) {
      return this.state.filteredData;
    }

    const pageSize = this.props.pageSize || 10;
    const start = (this.state.currentPage - 1) * pageSize;
    const end = start + pageSize;

    return this.state.filteredData.slice(start, end);
  }

  private getTotalPages(): number {
    const pageSize = this.props.pageSize || 10;
    return Math.ceil(this.state.filteredData.length / pageSize);
  }

  private changePage(page: number): void {
    const totalPages = this.getTotalPages();

    if (page < 1 || page > totalPages) {
      return;
    }

    this.setState({ currentPage: page });

    if (this.props.onPageChange) {
      this.props.onPageChange(page);
    }
  }

  public setData(data: T[]): void {
    this.props.data = data;
    this.setState({
      filteredData: this.filterData(this.state.searchQuery),
      currentPage: 1,
    });
  }
}

export default DataTable;
