/* eslint-disable react/require-render-return */
/**
 * Main Layout Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";
import { Header, HeaderProps } from "./Header";
import { Sidebar, SidebarProps, SidebarMenuItem } from "./Sidebar";
import { Footer, FooterProps } from "./Footer";

export interface LayoutProps {
  header?: HeaderProps;
  sidebar?: SidebarProps;
  footer?: FooterProps;
  showSidebar?: boolean;
}

interface LayoutState {
  sidebarOpen: boolean;
}

export class Layout extends Component<LayoutProps, LayoutState> {
  private headerComponent: Header | null = null;
  private sidebarComponent: Sidebar | null = null;
  private footerComponent: Footer | null = null;
  private mainContent: HTMLElement | null = null;

  constructor(props: LayoutProps) {
    super(props, {
      sidebarOpen: true,
    });

    this.toggleSidebar = this.toggleSidebar.bind(this);
  }

  protected getClassName(): string {
    const classes = ["layout"];

    if (this.state.sidebarOpen && this.props.showSidebar) {
      classes.push("layout-sidebar-open");
    }

    return classes.join(" ");
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();
    this.removeAllChildren();

    // Header
    if (this.props.header) {
      const headerContainer = createElement("div", {
        className: "layout-header",
      });

      this.headerComponent = new Header({
        ...this.props.header,
        onMenuClick: this.toggleSidebar,
      });

      this.addChild(this.headerComponent, headerContainer);
      this.element.appendChild(headerContainer);
    }

    // Main container
    const mainContainer = createElement("div", {
      className: "layout-main",
    });

    // Sidebar
    if (this.props.showSidebar && this.props.sidebar) {
      const sidebarContainer = createElement("aside", {
        className: "layout-sidebar",
      });

      this.sidebarComponent = new Sidebar({
        ...this.props.sidebar,
        collapsed: !this.state.sidebarOpen,
      });

      this.addChild(this.sidebarComponent, sidebarContainer);
      mainContainer.appendChild(sidebarContainer);
    }

    // Content
    const contentContainer = createElement("main", {
      className: "layout-content",
    });

    this.mainContent = createElement("div", {
      className: "layout-content-inner",
      id: "main-content",
    });

    contentContainer.appendChild(this.mainContent);
    mainContainer.appendChild(contentContainer);

    this.element.appendChild(mainContainer);

    // Footer
    if (this.props.footer) {
      const footerContainer = createElement("div", {
        className: "layout-footer",
      });

      this.footerComponent = new Footer(this.props.footer);

      this.addChild(this.footerComponent, footerContainer);
      this.element.appendChild(footerContainer);
    }
  }

  private toggleSidebar(): void {
    this.setState({ sidebarOpen: !this.state.sidebarOpen });

    if (this.sidebarComponent) {
      this.sidebarComponent.toggle();
    }
  }

  public getContentContainer(): HTMLElement | null {
    return this.mainContent;
  }

  public setContent(content: HTMLElement | Component): void {
    if (!this.mainContent) return;

    // Clear existing content
    this.mainContent.innerHTML = "";

    // Add new content
    if (content instanceof Component) {
      content.mount(this.mainContent);
    } else {
      this.mainContent.appendChild(content);
    }
  }

  public updateSidebarItems(items: SidebarMenuItem[]): void {
    if (this.sidebarComponent) {
      this.sidebarComponent.setProps({ items });
    }
  }

  public setActiveSidebarItem(path: string): void {
    if (this.sidebarComponent) {
      this.sidebarComponent.setActiveItem(path);
    }
  }
}

export default Layout;
