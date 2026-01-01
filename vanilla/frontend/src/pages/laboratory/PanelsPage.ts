/**
 * Panels Page
 * Manage laboratory test panels
 */

import { labService } from '../../services/LaboratoryService';
import { LabPanelBuilder } from '../../components/laboratory/LabPanelBuilder';

export class PanelsPage {
  private container: HTMLElement;
  private panelBuilder: LabPanelBuilder | null = null;
  private showBuilder: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="panels-page">
        <div class="page-header">
          <h1>Laboratory Panels</h1>
          <button type="button" class="btn btn-primary" id="createPanelBtn">Create Panel</button>
        </div>

        <div id="panelsContent">
          <div id="panelsList" class="panels-list"></div>
          <div id="panelBuilder" class="panel-builder-section" style="display: none;"></div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    await this.loadPanels();
    this.attachEventListeners();
  }

  private async loadPanels(): Promise<void> {
    try {
      const panels = await labService.getPanels();

      const panelsListContainer = this.container.querySelector('#panelsList');
      if (panelsListContainer) {
        panelsListContainer.innerHTML = panels.length > 0
          ? panels.map((panel: any) => this.renderPanelCard(panel)).join('')
          : '<p>No panels found</p>';
      }
    } catch (error) {
      console.error('Error loading panels:', error);
    }
  }

  private renderPanelCard(panel: any): string {
    return `
      <div class="panel-card">
        <div class="panel-header">
          <h3>${panel.name}</h3>
          <span class="panel-code">${panel.code}</span>
        </div>
        <div class="panel-body">
          <p>${panel.description}</p>
          <div class="panel-meta">
            <span class="meta-item">
              <strong>Category:</strong> ${panel.category}
            </span>
            <span class="meta-item">
              <strong>Tests:</strong> ${panel.tests.length}
            </span>
            ${panel.turnaroundTime ? `
              <span class="meta-item">
                <strong>TAT:</strong> ${panel.turnaroundTime}h
              </span>
            ` : ''}
          </div>
          <div class="panel-tests">
            <strong>Included Tests:</strong>
            <ul>
              ${panel.tests.slice(0, 5).map((testCode: string) => `
                <li>${testCode}</li>
              `).join('')}
              ${panel.tests.length > 5 ? `<li>... and ${panel.tests.length - 5} more</li>` : ''}
            </ul>
          </div>
        </div>
        <div class="panel-actions">
          <button type="button" class="btn btn-secondary" data-panel-id="${panel.id}">View Details</button>
          <button type="button" class="btn btn-primary" data-panel-id="${panel.id}">Create Order</button>
        </div>
      </div>
    `;
  }

  private async showPanelBuilder(): Promise<void> {
    try {
      const loincCodes = await labService.getLOINCCodes();

      const panelBuilderContainer = this.container.querySelector('#panelBuilder');
      const panelsListContainer = this.container.querySelector('#panelsList');

      if (panelBuilderContainer && panelsListContainer) {
        (panelBuilderContainer as HTMLElement).style.display = 'block';
        (panelsListContainer as HTMLElement).style.display = 'none';

        this.panelBuilder = new LabPanelBuilder(panelBuilderContainer as HTMLElement, {
          onSave: (panelData) => this.handleSavePanel(panelData)
        });
        this.panelBuilder.setAvailableTests(loincCodes);
      }

      this.showBuilder = true;
      this.updateCreateButton();
    } catch (error) {
      console.error('Error showing panel builder:', error);
    }
  }

  private hidePanelBuilder(): void {
    const panelBuilderContainer = this.container.querySelector('#panelBuilder');
    const panelsListContainer = this.container.querySelector('#panelsList');

    if (panelBuilderContainer && panelsListContainer) {
      (panelBuilderContainer as HTMLElement).style.display = 'none';
      (panelsListContainer as HTMLElement).style.display = 'block';
    }

    if (this.panelBuilder) {
      this.panelBuilder.destroy();
      this.panelBuilder = null;
    }

    this.showBuilder = false;
    this.updateCreateButton();
  }

  private async handleSavePanel(panelData: any): Promise<void> {
    try {
      await labService.createPanel(panelData);
      alert('Panel created successfully!');
      this.hidePanelBuilder();
      this.loadPanels();
    } catch (error: any) {
      console.error('Error saving panel:', error);
      alert('Error saving panel: ' + error.message);
    }
  }

  private updateCreateButton(): void {
    const createBtn = this.container.querySelector('#createPanelBtn');
    if (createBtn) {
      createBtn.textContent = this.showBuilder ? 'Cancel' : 'Create Panel';
    }
  }

  private attachEventListeners(): void {
    const createPanelBtn = this.container.querySelector('#createPanelBtn');

    if (createPanelBtn) {
      createPanelBtn.addEventListener('click', () => {
        if (this.showBuilder) {
          this.hidePanelBuilder();
        } else {
          this.showPanelBuilder();
        }
      });
    }
  }

  destroy(): void {
    if (this.panelBuilder) {
      this.panelBuilder.destroy();
    }
    this.container.innerHTML = '';
  }
}
