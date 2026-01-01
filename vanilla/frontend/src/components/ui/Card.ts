/* eslint-disable react/require-render-return */
/**
 * Card Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: { label: string; onClick: () => void }[];
  children?: HTMLElement[];
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: boolean;
  border?: boolean;
  hoverable?: boolean;
}

interface CardState {}

export class Card extends Component<CardProps, CardState> {
  constructor(props: CardProps) {
    super(props, {});
  }

  protected getClassName(): string {
    const classes = ["card"];

    if (this.props.className) {
      classes.push(this.props.className);
    }

    const padding = this.props.padding || "md";
    classes.push(`card-padding-${padding}`);

    if (this.props.shadow !== false) {
      classes.push("card-shadow");
    }

    if (this.props.border !== false) {
      classes.push("card-border");
    }

    if (this.props.hoverable) {
      classes.push("card-hoverable");
    }

    return classes.join(" ");
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();

    // Add header if title or actions present
    if (this.props.title || this.props.actions) {
      const header = this.createHeader();
      this.element.appendChild(header);
    }

    // Add content
    const content = createElement("div", {
      className: "card-content",
    });

    if (this.props.children) {
      this.props.children.forEach((child) => {
        content.appendChild(child);
      });
    }

    this.element.appendChild(content);
  }

  private createHeader(): HTMLElement {
    const header = createElement("div", {
      className: "card-header",
    });

    if (this.props.title || this.props.subtitle) {
      const headerContent = createElement("div", {
        className: "card-header-content",
      });

      if (this.props.title) {
        const title = createElement("h3", {
          className: "card-title",
          textContent: this.props.title,
        });
        headerContent.appendChild(title);
      }

      if (this.props.subtitle) {
        const subtitle = createElement("p", {
          className: "card-subtitle",
          textContent: this.props.subtitle,
        });
        headerContent.appendChild(subtitle);
      }

      header.appendChild(headerContent);
    }

    if (this.props.actions && this.props.actions.length > 0) {
      const actionsContainer = createElement("div", {
        className: "card-actions",
      });

      this.props.actions.forEach((action) => {
        const button = createElement("button", {
          className: "card-action-btn",
          textContent: action.label,
          events: {
            click: (e) => {
              e.preventDefault();
              action.onClick();
            },
          },
        });
        actionsContainer.appendChild(button);
      });

      header.appendChild(actionsContainer);
    }

    return header;
  }

  public setContent(children: HTMLElement[]): void {
    this.props.children = children;
    this.update();
  }
}

export default Card;
