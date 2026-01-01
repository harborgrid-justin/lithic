/* eslint-disable react/require-render-return */
/**
 * Input Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface InputProps {
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date"
    | "time";
  label?: string;
  placeholder?: string;
  value?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  error?: string;
  helperText?: string;
  icon?: string;
  iconPosition?: "left" | "right";
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  onChange?: (value: string, e: Event) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  onInput?: (value: string, e: Event) => void;
}

interface InputState {
  value: string;
  focused: boolean;
  error: string | null;
}

export class Input extends Component<InputProps, InputState> {
  private inputElement: HTMLInputElement | null = null;

  constructor(props: InputProps) {
    super(props, {
      value: props.value || "",
      focused: false,
      error: props.error || null,
    });

    this.handleChange = this.handleChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  protected createElement(): HTMLElement {
    return createElement("div", {
      className: this.getClassName(),
    });
  }

  protected getClassName(): string {
    const classes = ["input-wrapper"];

    if (this.state.focused) {
      classes.push("input-focused");
    }

    if (this.state.error) {
      classes.push("input-error");
    }

    if (this.props.disabled) {
      classes.push("input-disabled");
    }

    if (this.props.icon) {
      classes.push(`input-with-icon-${this.props.iconPosition || "left"}`);
    }

    return classes.join(" ");
  }

  protected render(): void {
    // Clear content
    this.element.innerHTML = "";
    this.element.className = this.getClassName();

    // Add label
    if (this.props.label) {
      const label = createElement("label", {
        className: "input-label",
        textContent: this.props.label,
        attributes: {
          for: this.props.id || this.props.name || "",
        },
      });

      if (this.props.required) {
        const required = createElement("span", {
          className: "input-required",
          textContent: " *",
        });
        label.appendChild(required);
      }

      this.element.appendChild(label);
    }

    // Create input container
    const inputContainer = createElement("div", {
      className: "input-container",
    });

    // Add icon (left)
    if (this.props.icon && this.props.iconPosition !== "right") {
      const icon = createElement("span", {
        className: "input-icon input-icon-left",
        innerHTML: this.props.icon,
      });
      inputContainer.appendChild(icon);
    }

    // Create input element
    this.inputElement = createElement("input", {
      className: "input-field",
      attributes: {
        type: this.props.type || "text",
        placeholder: this.props.placeholder || "",
        value: this.state.value,
        name: this.props.name || "",
        id: this.props.id || this.props.name || "",
        ...(this.props.autoComplete && {
          autocomplete: this.props.autoComplete,
        }),
        ...(this.props.maxLength && {
          maxlength: String(this.props.maxLength),
        }),
        ...(this.props.minLength && {
          minlength: String(this.props.minLength),
        }),
        ...(this.props.pattern && { pattern: this.props.pattern }),
      },
    }) as HTMLInputElement;

    if (this.props.disabled) {
      this.inputElement.disabled = true;
    }

    if (this.props.required) {
      this.inputElement.required = true;
    }

    if (this.props.readonly) {
      this.inputElement.readOnly = true;
    }

    inputContainer.appendChild(this.inputElement);

    // Add icon (right)
    if (this.props.icon && this.props.iconPosition === "right") {
      const icon = createElement("span", {
        className: "input-icon input-icon-right",
        innerHTML: this.props.icon,
      });
      inputContainer.appendChild(icon);
    }

    this.element.appendChild(inputContainer);

    // Add helper text or error
    if (this.state.error) {
      const error = createElement("div", {
        className: "input-error-text",
        textContent: this.state.error,
      });
      this.element.appendChild(error);
    } else if (this.props.helperText) {
      const helper = createElement("div", {
        className: "input-helper-text",
        textContent: this.props.helperText,
      });
      this.element.appendChild(helper);
    }
  }

  protected onMount(): void {
    if (this.inputElement) {
      this.inputElement.addEventListener("change", this.handleChange);
      this.inputElement.addEventListener("input", this.handleInput);
      this.inputElement.addEventListener("focus", this.handleFocus);
      this.inputElement.addEventListener("blur", this.handleBlur);
    }
  }

  protected onUnmount(): void {
    if (this.inputElement) {
      this.inputElement.removeEventListener("change", this.handleChange);
      this.inputElement.removeEventListener("input", this.handleInput);
      this.inputElement.removeEventListener("focus", this.handleFocus);
      this.inputElement.removeEventListener("blur", this.handleBlur);
    }
  }

  private handleChange(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.setState({ value });

    if (this.props.onChange) {
      this.props.onChange(value, e);
    }
  }

  private handleInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;

    if (this.props.onInput) {
      this.props.onInput(value, e);
    }
  }

  private handleFocus(e: FocusEvent): void {
    this.setState({ focused: true });

    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
  }

  private handleBlur(e: FocusEvent): void {
    this.setState({ focused: false });

    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  }

  public getValue(): string {
    return this.state.value;
  }

  public setValue(value: string): void {
    this.setState({ value });
    if (this.inputElement) {
      this.inputElement.value = value;
    }
  }

  public setError(error: string | null): void {
    this.setState({ error });
  }

  public focus(): void {
    this.inputElement?.focus();
  }

  public blur(): void {
    this.inputElement?.blur();
  }

  public clear(): void {
    this.setValue("");
  }
}

export default Input;
