/* eslint-disable react/require-render-return */
/**
 * Badge Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface BadgeProps {
  label: string;
  variant?: "default" | "primary" | "success" | "danger" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  outlined?: boolean;
}

export class Badge extends Component<BadgeProps, {}> {
  constructor(props: BadgeProps) {
    super(props, {});
  }

  protected createElement(): HTMLElement {
    return createElement("span", {
      className: this.getClassName(),
    });
  }

  protected getClassName(): string {
    const classes = ["badge"];

    const variant = this.props.variant || "default";
    classes.push(`badge-${variant}`);

    const size = this.props.size || "md";
    classes.push(`badge-${size}`);

    if (this.props.rounded) {
      classes.push("badge-rounded");
    }

    if (this.props.outlined) {
      classes.push("badge-outlined");
    }

    return classes.join(" ");
  }

  protected render(): void {
    this.element.className = this.getClassName();
    this.element.textContent = this.props.label;
  }

  public setLabel(label: string): void {
    this.props.label = label;
    this.update();
  }
}

export default Badge;
