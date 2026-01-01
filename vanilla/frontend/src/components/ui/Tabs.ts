/* eslint-disable react/require-render-return */
/**
 * Tabs Component
 */

import { Component } from "../base/Component";
import { createElement } from "../../utils/dom";

export interface Tab {
  id: string;
  label: string;
  content: HTMLElement | string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
}

interface TabsState {
  activeTab: string;
}

export class Tabs extends Component<TabsProps, TabsState> {
  constructor(props: TabsProps) {
    super(props, {
      activeTab: props.activeTab || props.tabs[0]?.id || "",
    });
  }

  protected getClassName(): string {
    return "tabs-container";
  }

  protected render(): void {
    this.element.innerHTML = "";
    this.element.className = this.getClassName();

    const tabList = createElement("div", {
      className: "tabs-list",
      attributes: { role: "tablist" },
    });

    this.props.tabs.forEach((tab) => {
      const tabButton = this.createTabButton(tab);
      tabList.appendChild(tabButton);
    });

    this.element.appendChild(tabList);

    const tabPanels = createElement("div", {
      className: "tabs-panels",
    });

    this.props.tabs.forEach((tab) => {
      const panel = this.createTabPanel(tab);
      tabPanels.appendChild(panel);
    });

    this.element.appendChild(tabPanels);
  }

  private createTabButton(tab: Tab): HTMLElement {
    const isActive = this.state.activeTab === tab.id;

    const button = createElement("button", {
      className: `tab-button ${isActive ? "tab-active" : ""} ${tab.disabled ? "tab-disabled" : ""}`,
      textContent: tab.label,
      attributes: {
        role: "tab",
        "aria-selected": String(isActive),
        "aria-controls": `panel-${tab.id}`,
        id: `tab-${tab.id}`,
      },
      events: {
        click: () => this.handleTabClick(tab.id),
      },
    });

    if (tab.disabled) {
      button.setAttribute("disabled", "true");
    }

    return button;
  }

  private createTabPanel(tab: Tab): HTMLElement {
    const isActive = this.state.activeTab === tab.id;

    const panel = createElement("div", {
      className: `tab-panel ${isActive ? "tab-panel-active" : ""}`,
      attributes: {
        role: "tabpanel",
        "aria-labelledby": `tab-${tab.id}`,
        id: `panel-${tab.id}`,
      },
    });

    if (typeof tab.content === "string") {
      panel.innerHTML = tab.content;
    } else {
      panel.appendChild(tab.content);
    }

    return panel;
  }

  private handleTabClick(tabId: string): void {
    const tab = this.props.tabs.find((t) => t.id === tabId);
    if (tab?.disabled) return;

    this.setState({ activeTab: tabId });

    if (this.props.onChange) {
      this.props.onChange(tabId);
    }
  }

  public setActiveTab(tabId: string): void {
    this.setState({ activeTab: tabId });
  }

  public getActiveTab(): string {
    return this.state.activeTab;
  }
}

export default Tabs;
