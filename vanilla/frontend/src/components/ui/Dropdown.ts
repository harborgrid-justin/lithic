/* eslint-disable react/require-render-return */
/**
 * Dropdown Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  onChange?: (value: string) => void;
}

interface DropdownState {
  isOpen: boolean;
  selectedValue: string | null;
  searchQuery: string;
}

export class Dropdown extends Component<DropdownProps, DropdownState> {
  constructor(props: DropdownProps) {
    super(props, {
      isOpen: false,
      selectedValue: props.value || null,
      searchQuery: "",
    });

    this.toggleOpen = this.toggleOpen.bind(this);
    this.close = this.close.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
  }

  protected getClassName(): string {
    const classes = ["dropdown"];

    if (this.state.isOpen) {
      classes.push("dropdown-open");
    }

    if (this.props.disabled) {
      classes.push("dropdown-disabled");
    }

    return classes.join(" ");
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();

    const trigger = this.createTrigger();
    this.element.appendChild(trigger);

    if (this.state.isOpen) {
      const menu = this.createMenu();
      this.element.appendChild(menu);
    }
  }

  private createTrigger(): HTMLElement {
    const selected = this.props.options.find(
      (opt) => opt.value === this.state.selectedValue,
    );

    const trigger = createElement("button", {
      className: "dropdown-trigger",
      textContent: selected?.label || this.props.placeholder || "Select...",
      attributes: {
        type: "button",
        disabled: this.props.disabled ? "true" : undefined,
      },
      events: {
        click: this.toggleOpen,
      },
    });

    const arrow = createElement("span", {
      className: "dropdown-arrow",
      innerHTML: "▼",
    });
    trigger.appendChild(arrow);

    return trigger;
  }

  private createMenu(): HTMLElement {
    const menu = createElement("div", {
      className: "dropdown-menu",
    });

    if (this.props.searchable) {
      const search = createElement("input", {
        className: "dropdown-search",
        attributes: {
          type: "text",
          placeholder: "Search...",
        },
        events: {
          input: (e) => {
            this.setState({
              searchQuery: (e.target as HTMLInputElement).value,
            });
          },
          click: (e) => e.stopPropagation(),
        },
      });
      menu.appendChild(search);
    }

    const optionsList = createElement("div", {
      className: "dropdown-options",
    });

    const filteredOptions = this.getFilteredOptions();

    filteredOptions.forEach((option) => {
      const optionEl = createElement("button", {
        className: `dropdown-option ${
          option.value === this.state.selectedValue
            ? "dropdown-option-selected"
            : ""
        } ${option.disabled ? "dropdown-option-disabled" : ""}`,
        textContent: option.label,
        attributes: {
          type: "button",
          disabled: option.disabled ? "true" : undefined,
        },
        events: {
          click: () => this.handleSelect(option.value),
        },
      });

      optionsList.appendChild(optionEl);
    });

    menu.appendChild(optionsList);
    return menu;
  }

  private getFilteredOptions(): DropdownOption[] {
    if (!this.props.searchable || !this.state.searchQuery) {
      return this.props.options;
    }

    const query = this.state.searchQuery.toLowerCase();
    return this.props.options.filter((opt) =>
      opt.label.toLowerCase().includes(query),
    );
  }

  private handleSelect(value: string): void {
    this.setState({
      selectedValue: value,
      isOpen: false,
      searchQuery: "",
    });

    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }

  private toggleOpen(): void {
    if (this.props.disabled) return;
    this.setState({ isOpen: !this.state.isOpen });
  }

  private close(): void {
    this.setState({ isOpen: false, searchQuery: "" });
  }

  private handleDocumentClick(e: Event): void {
    if (!this.element.contains(e.target as Node)) {
      this.close();
    }
  }

  protected onMount(): void {
    document.addEventListener("click", this.handleDocumentClick);
  }

  protected onUnmount(): void {
    document.removeEventListener("click", this.handleDocumentClick);
  }

  public getValue(): string | null {
    return this.state.selectedValue;
  }

  public setValue(value: string): void {
    this.setState({ selectedValue: value });
  }
}

export default Dropdown;
