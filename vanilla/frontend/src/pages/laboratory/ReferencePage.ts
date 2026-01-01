/**
 * Reference Page
 * View LOINC codes and reference ranges
 */

import { labService } from "../../services/LaboratoryService";
import { ReferenceRanges } from "../../components/laboratory/ReferenceRanges";

export class ReferencePage {
  private container: HTMLElement;
  private referenceRanges: ReferenceRanges | null = null;
  private activeTab: "loinc" | "ranges" = "loinc";

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="reference-page">
        <div class="page-header">
          <h1>Laboratory Reference</h1>
        </div>

        <div class="reference-tabs">
          <button type="button" class="tab-btn active" data-tab="loinc">LOINC Codes</button>
          <button type="button" class="tab-btn" data-tab="ranges">Reference Ranges</button>
          <button type="button" class="tab-btn" data-tab="panels">Common Panels</button>
        </div>

        <div class="tab-content">
          <div id="loincTab" class="tab-pane active"></div>
          <div id="rangesTab" class="tab-pane"></div>
          <div id="panelsTab" class="tab-pane"></div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadLOINCCodes();
    this.attachEventListeners();
  }

  private async loadLOINCCodes(): Promise<void> {
    try {
      const loincCodes = await labService.getLOINCCodes();

      const loincTab = this.container.querySelector("#loincTab");
      if (loincTab) {
        loincTab.innerHTML = `
          <div class="loinc-codes">
            <div class="search-box">
              <input type="text" id="loincSearch" placeholder="Search LOINC codes...">
            </div>
            <div id="loincList" class="loinc-list">
              ${loincCodes.map((loinc: any) => this.renderLOINCCard(loinc)).join("")}
            </div>
          </div>
        `;

        const searchInput = loincTab.querySelector("#loincSearch");
        if (searchInput) {
          searchInput.addEventListener("input", (e) => {
            this.handleLOINCSearch((e.target as HTMLInputElement).value);
          });
        }
      }
    } catch (error) {
      console.error("Error loading LOINC codes:", error);
    }
  }

  private renderLOINCCard(loinc: any): string {
    return `
      <div class="loinc-card" data-loinc-code="${loinc.code}">
        <div class="loinc-header">
          <h4>${loinc.commonName || loinc.displayName}</h4>
          <span class="loinc-code">${loinc.code}</span>
        </div>
        <div class="loinc-body">
          <div class="loinc-detail">
            <strong>Component:</strong> ${loinc.component}
          </div>
          <div class="loinc-detail">
            <strong>System:</strong> ${loinc.system}
          </div>
          <div class="loinc-detail">
            <strong>Category:</strong> <span class="category-badge">${loinc.category}</span>
          </div>
          ${
            loinc.unit
              ? `
            <div class="loinc-detail">
              <strong>Unit:</strong> ${loinc.unit}
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  private async handleLOINCSearch(query: string): Promise<void> {
    if (!query.trim()) {
      this.loadLOINCCodes();
      return;
    }

    try {
      const results = await labService.searchLOINCCodes(query);

      const loincList = this.container.querySelector("#loincList");
      if (loincList) {
        loincList.innerHTML =
          results.length > 0
            ? results.map((loinc: any) => this.renderLOINCCard(loinc)).join("")
            : "<p>No LOINC codes found</p>";
      }
    } catch (error) {
      console.error("Error searching LOINC codes:", error);
    }
  }

  private async loadReferenceRanges(): Promise<void> {
    try {
      const ranges = await labService.getReferenceRanges();

      const rangesTab = this.container.querySelector("#rangesTab");
      if (rangesTab) {
        this.referenceRanges = new ReferenceRanges(rangesTab as HTMLElement);
        this.referenceRanges.setRanges(ranges);
      }
    } catch (error) {
      console.error("Error loading reference ranges:", error);
    }
  }

  private async loadCommonPanels(): Promise<void> {
    try {
      const panels = await labService.getCommonPanels();

      const panelsTab = this.container.querySelector("#panelsTab");
      if (panelsTab) {
        panelsTab.innerHTML = `
          <div class="common-panels">
            ${Object.entries(panels)
              .map(
                ([key, panel]: [string, any]) => `
              <div class="panel-card">
                <h3>${panel.name}</h3>
                <div class="panel-code">Code: ${panel.code}</div>
                <div class="panel-tests">
                  <strong>Included Tests:</strong>
                  <ul>
                    ${panel.tests.map((testCode: string) => `<li>${testCode}</li>`).join("")}
                  </ul>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `;
      }
    } catch (error) {
      console.error("Error loading common panels:", error);
    }
  }

  private switchTab(tab: string): void {
    // Update tab buttons
    const tabBtns = this.container.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });

    // Update tab panes
    const tabPanes = this.container.querySelectorAll(".tab-pane");
    tabPanes.forEach((pane) => {
      pane.classList.toggle("active", pane.id === `${tab}Tab`);
    });

    // Load tab content if not already loaded
    if (tab === "ranges" && !this.referenceRanges) {
      this.loadReferenceRanges();
    } else if (tab === "panels") {
      const panelsTab = this.container.querySelector("#panelsTab");
      if (panelsTab && !panelsTab.innerHTML) {
        this.loadCommonPanels();
      }
    }
  }

  private attachEventListeners(): void {
    const tabBtns = this.container.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  destroy(): void {
    if (this.referenceRanges) {
      this.referenceRanges.destroy();
    }
    this.container.innerHTML = "";
  }
}
