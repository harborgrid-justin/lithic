/* eslint-disable react/require-render-return */
/**
 * Toast Notification Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface ToastOptions {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  closeable?: boolean;
}

interface ToastState {
  visible: boolean;
}

export class Toast extends Component<ToastOptions, ToastState> {
  private timeoutId: number | null = null;

  constructor(props: ToastOptions) {
    super(props, { visible: false });
    this.close = this.close.bind(this);
  }

  protected getClassName(): string {
    const classes = ["toast"];
    const type = this.props.type || "info";
    const position = this.props.position || "top-right";

    classes.push(`toast-${type}`);
    classes.push(`toast-${position}`);

    if (this.state.visible) {
      classes.push("toast-visible");
    }

    return classes.join(" ");
  }

  protected render(): void {
    this.element.className = this.getClassName();
    this.element.innerHTML = "";

    const content = createElement("div", {
      className: "toast-content",
    });

    const icon = this.getIcon();
    if (icon) {
      const iconEl = createElement("span", {
        className: "toast-icon",
        innerHTML: icon,
      });
      content.appendChild(iconEl);
    }

    const message = createElement("span", {
      className: "toast-message",
      textContent: this.props.message,
    });
    content.appendChild(message);

    this.element.appendChild(content);

    if (this.props.closeable !== false) {
      const closeBtn = createElement("button", {
        className: "toast-close",
        innerHTML: "&times;",
        events: { click: this.close },
      });
      this.element.appendChild(closeBtn);
    }
  }

  private getIcon(): string {
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };
    return icons[this.props.type || "info"];
  }

  protected onMount(): void {
    setTimeout(() => this.show(), 10);
  }

  public show(): void {
    this.setState({ visible: true });

    const duration = this.props.duration || 5000;
    if (duration > 0) {
      this.timeoutId = window.setTimeout(() => this.close(), duration);
    }
  }

  public close(): void {
    this.setState({ visible: false });

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    setTimeout(() => this.unmount(), 300);
  }
}

// Toast Container Manager
class ToastContainer {
  private container: HTMLElement | null = null;
  private toasts: Toast[] = [];

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = createElement("div", {
        className: "toast-container",
        id: "toast-container",
      });
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  public show(options: ToastOptions): void {
    const toast = new Toast(options);
    this.toasts.push(toast);
    toast.mount(this.getContainer());
  }

  public success(message: string, duration?: number): void {
    this.show({ message, type: "success", duration });
  }

  public error(message: string, duration?: number): void {
    this.show({ message, type: "error", duration });
  }

  public warning(message: string, duration?: number): void {
    this.show({ message, type: "warning", duration });
  }

  public info(message: string, duration?: number): void {
    this.show({ message, type: "info", duration });
  }
}

export const toast = new ToastContainer();
export default toast;
