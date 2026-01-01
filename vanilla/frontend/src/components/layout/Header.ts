/* eslint-disable react/require-render-return */
/**
 * Header Layout Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";
import { authService as auth } from "../../services/auth";

export interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  onLogout?: () => void;
}

export class Header extends Component<HeaderProps, {}> {
  constructor(props: HeaderProps) {
    super(props, {});
  }

  protected getClassName(): string {
    return "header";
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();

    const container = createElement("div", {
      className: "header-container",
    });

    // Left section
    const leftSection = createElement("div", {
      className: "header-left",
    });

    const menuBtn = createElement("button", {
      className: "header-menu-btn",
      innerHTML: "☰",
      attributes: { "aria-label": "Toggle menu" },
      events: {
        click: () => this.props.onMenuClick?.(),
      },
    });

    const logo = createElement("div", {
      className: "header-logo",
    });

    const logoText = createElement("span", {
      className: "header-logo-text",
      textContent: this.props.title || "Lithic Healthcare",
    });

    logo.appendChild(logoText);
    leftSection.appendChild(menuBtn);
    leftSection.appendChild(logo);

    // Right section
    const rightSection = createElement("div", {
      className: "header-right",
    });

    const user = auth.getCurrentUser();

    if (user) {
      const userInfo = createElement("div", {
        className: "header-user",
      });

      const userName = createElement("span", {
        className: "header-user-name",
        textContent: `${user.firstName} ${user.lastName}`,
      });

      const userRole = createElement("span", {
        className: "header-user-role",
        textContent: user.role,
      });

      userInfo.appendChild(userName);
      userInfo.appendChild(userRole);

      const logoutBtn = createElement("button", {
        className: "header-logout-btn btn btn-ghost",
        textContent: "Logout",
        events: {
          click: () => this.props.onLogout?.(),
        },
      });

      rightSection.appendChild(userInfo);
      rightSection.appendChild(logoutBtn);
    }

    container.appendChild(leftSection);
    container.appendChild(rightSection);
    this.element.appendChild(container);
  }
}

export default Header;
