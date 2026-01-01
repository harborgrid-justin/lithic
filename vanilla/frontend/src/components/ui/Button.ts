/* eslint-disable react/require-render-return */
/**
 * Button Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface ButtonProps {
  label?: string;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  type?: "button" | "submit" | "reset";
  onClick?: (e: MouseEvent) => void;
}

interface ButtonState {
  loading: boolean;
  disabled: boolean;
}

export class Button extends Component<ButtonProps, ButtonState> {
  constructor(props: ButtonProps) {
    super(props, {
      loading: props.loading || false,
      disabled: props.disabled || false,
    });

    this.handleClick = this.handleClick.bind(this);
  }

  protected createElement(): HTMLElement {
    return createElement("button", {
      className: this.getClassName(),
      attributes: {
        type: this.props.type || "button",
      },
    });
  }

  protected getClassName(): string {
    const classes = ["btn"];

    const variant = this.props.variant || "primary";
    classes.push(`btn-${variant}`);

    const size = this.props.size || "md";
    classes.push(`btn-${size}`);

    if (this.props.fullWidth) {
      classes.push("btn-full");
    }

    if (this.state.loading) {
      classes.push("btn-loading");
    }

    if (this.state.disabled) {
      classes.push("btn-disabled");
    }

    return classes.join(" ");
  }

  protected render(): void {
    const button = this.element as HTMLButtonElement;

    // Update classes
    button.className = this.getClassName();

    // Update disabled state
    button.disabled = this.state.disabled || this.state.loading;

    // Clear content
    button.innerHTML = "";

    // Add icon (left)
    if (this.props.icon && this.props.iconPosition !== "right") {
      const icon = createElement("span", {
        className: "btn-icon btn-icon-left",
        innerHTML: this.props.icon,
      });
      button.appendChild(icon);
    }

    // Add loading spinner
    if (this.state.loading) {
      const spinner = createElement("span", {
        className: "btn-spinner",
        innerHTML: '<span class="spinner"></span>',
      });
      button.appendChild(spinner);
    }

    // Add label
    if (this.props.label) {
      const label = createElement("span", {
        className: "btn-label",
        textContent: this.props.label,
      });
      button.appendChild(label);
    }

    // Add icon (right)
    if (this.props.icon && this.props.iconPosition === "right") {
      const icon = createElement("span", {
        className: "btn-icon btn-icon-right",
        innerHTML: this.props.icon,
      });
      button.appendChild(icon);
    }
  }

  protected onMount(): void {
    this.addEventListener("click", this.handleClick);
  }

  protected onUnmount(): void {
    this.removeEventListener("click", this.handleClick);
  }

  private handleClick(e: Event): void {
    if (this.state.disabled || this.state.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (this.props.onClick) {
      this.props.onClick(e as MouseEvent);
    }
  }

  public setLoading(loading: boolean): void {
    this.setState({ loading });
  }

  public setDisabled(disabled: boolean): void {
    this.setState({ disabled });
  }
}

export default Button;
