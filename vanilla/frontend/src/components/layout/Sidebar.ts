/* eslint-disable react/require-render-return */
/**
 * Sidebar Layout Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon?: string;
  path: string;
  active?: boolean;
}

export interface SidebarProps {
  items: SidebarMenuItem[];
  onNavigate?: (path: string) => void;
  collapsed?: boolean;
}

interface SidebarState {
  collapsed: boolean;
}

export class Sidebar extends Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props, {
      collapsed: props.collapsed || false,
    });
  }

  protected getClassName(): string {
    const classes = ["sidebar"];

    if (this.state.collapsed) {
      classes.push("sidebar-collapsed");
    }

    return classes.join(" ");
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();

    const nav = createElement("nav", {
      className: "sidebar-nav",
    });

    const menu = createElement("ul", {
      className: "sidebar-menu",
    });

    this.props.items.forEach((item) => {
      const menuItem = this.createMenuItem(item);
      menu.appendChild(menuItem);
    });

    nav.appendChild(menu);
    this.element.appendChild(nav);
  }

  private createMenuItem(item: SidebarMenuItem): HTMLElement {
    const li = createElement("li", {
      className: `sidebar-menu-item ${item.active ? "sidebar-menu-item-active" : ""}`,
    });

    const link = createElement("a", {
      className: "sidebar-menu-link",
      attributes: {
        href: "#",
        "data-path": item.path,
      },
      events: {
        click: (e) => {
          e.preventDefault();
          this.handleNavigate(item.path);
        },
      },
    });

    if (item.icon) {
      const icon = createElement("span", {
        className: "sidebar-menu-icon",
        innerHTML: item.icon,
      });
      link.appendChild(icon);
    }

    const label = createElement("span", {
      className: "sidebar-menu-label",
      textContent: item.label,
    });

    link.appendChild(label);
    li.appendChild(link);

    return li;
  }

  private handleNavigate(path: string): void {
    if (this.props.onNavigate) {
      this.props.onNavigate(path);
    }
  }

  public toggle(): void {
    this.setState({ collapsed: !this.state.collapsed });
  }

  public setCollapsed(collapsed: boolean): void {
    this.setState({ collapsed });
  }

  public setActiveItem(path: string): void {
    this.props.items.forEach((item) => {
      item.active = item.path === path;
    });
    this.update();
  }
}

export default Sidebar;
