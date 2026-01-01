import { ImagingService } from '../../services/ImagingService';

export class CompareStudies {
  private imagingService: ImagingService;
  private currentStudyUID: string = '';
  private compareStudyUID: string = '';

  constructor() {
    this.imagingService = new ImagingService();
  }

  async render(container: HTMLElement, currentStudyUID: string, compareStudyUID: string) {
    this.currentStudyUID = currentStudyUID;
    this.compareStudyUID = compareStudyUID;

    const currentStudy = await this.imagingService.getStudy(currentStudyUID);
    const compareStudy = await this.imagingService.getStudy(compareStudyUID);

    container.innerHTML = `
      <div class="compare-studies">
        <div class="compare-header">
          <h3>Study Comparison</h3>
          <button class="btn btn-sm btn-secondary" data-action="close-compare">Close Comparison</button>
        </div>

        <div class="compare-info">
          <div class="study-column">
            <h4>Current Study</h4>
            <div class="study-details">
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${this.formatDate(currentStudy.studyDate)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Description:</span>
                <span class="value">${currentStudy.studyDescription}</span>
              </div>
              <div class="detail-row">
                <span class="label">Series:</span>
                <span class="value">${currentStudy.numberOfSeries}</span>
              </div>
            </div>
          </div>

          <div class="study-column">
            <h4>Comparison Study</h4>
            <div class="study-details">
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${this.formatDate(compareStudy.studyDate)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Description:</span>
                <span class="value">${compareStudy.studyDescription}</span>
              </div>
              <div class="detail-row">
                <span class="label">Series:</span>
                <span class="value">${compareStudy.numberOfSeries}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="compare-tools">
          <div class="tool-group">
            <label>Sync:</label>
            <input type="checkbox" id="sync-scroll" checked>
            <label for="sync-scroll">Scroll</label>
            <input type="checkbox" id="sync-window">
            <label for="sync-window">Window/Level</label>
            <input type="checkbox" id="sync-zoom">
            <label for="sync-zoom">Zoom</label>
          </div>

          <div class="tool-group">
            <button class="btn btn-sm" data-action="sync-now">Sync Now</button>
            <button class="btn btn-sm" data-action="swap-views">Swap Views</button>
          </div>
        </div>

        <div class="comparison-findings">
          <h4>Key Differences</h4>
          <div id="differences-container">
            <div class="loading">Analyzing differences...</div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(container);
    await this.loadDifferences();
  }

  private async loadDifferences() {
    try {
      const comparison = await this.imagingService.compareStudies(
        this.currentStudyUID,
        [this.compareStudyUID]
      );

      const container = document.getElementById('differences-container');
      if (!container) return;

      if (comparison.differences && comparison.differences.length > 0) {
        container.innerHTML = `
          <ul class="differences-list">
            ${comparison.differences.map((diff: any) => this.createDifferenceItem(diff)).join('')}
          </ul>
        `;
      } else {
        container.innerHTML = '<div class="empty-state">No significant differences detected</div>';
      }
    } catch (error) {
      console.error('Error loading differences:', error);
    }
  }

  private createDifferenceItem(diff: any): string {
    const iconMap: Record<string, string> = {
      'INCREASED': '📈',
      'DECREASED': '📉',
      'NEW': '🆕',
      'RESOLVED': '✅',
      'STABLE': '➖',
      'MODERATE': '⚠️',
    };

    return `
      <li class="difference-item ${this.getSeverityClass(diff.significance)}">
        <div class="difference-icon">${iconMap[diff.significance] || '•'}</div>
        <div class="difference-content">
          <div class="difference-finding">${diff.finding}</div>
          ${diff.location ? `<div class="difference-location">Location: ${diff.location}</div>` : ''}
          <div class="difference-significance">
            <span class="badge badge-${this.getSeverityColor(diff.significance)}">${diff.significance}</span>
          </div>
        </div>
      </li>
    `;
  }

  private attachEventListeners(container: HTMLElement) {
    const closeBtn = container.querySelector('[data-action="close-compare"]');
    closeBtn?.addEventListener('click', () => {
      // TODO: Exit comparison mode
      console.log('Close comparison');
    });

    const syncNowBtn = container.querySelector('[data-action="sync-now"]');
    syncNowBtn?.addEventListener('click', () => {
      this.syncViewports();
    });

    const swapBtn = container.querySelector('[data-action="swap-views"]');
    swapBtn?.addEventListener('click', () => {
      this.swapViews();
    });

    // Sync checkboxes
    const syncScroll = container.querySelector('#sync-scroll') as HTMLInputElement;
    const syncWindow = container.querySelector('#sync-window') as HTMLInputElement;
    const syncZoom = container.querySelector('#sync-zoom') as HTMLInputElement;

    syncScroll?.addEventListener('change', () => this.toggleSync('scroll', syncScroll.checked));
    syncWindow?.addEventListener('change', () => this.toggleSync('window', syncWindow.checked));
    syncZoom?.addEventListener('change', () => this.toggleSync('zoom', syncZoom.checked));
  }

  private syncViewports() {
    console.log('Syncing viewports');
    // TODO: Synchronize viewport state
  }

  private swapViews() {
    console.log('Swapping views');
    // TODO: Swap left and right viewports
  }

  private toggleSync(type: string, enabled: boolean) {
    console.log(`Toggle ${type} sync:`, enabled);
    // TODO: Enable/disable sync for specific feature
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private getSeverityClass(significance: string): string {
    const classes: Record<string, string> = {
      'CRITICAL': 'severity-critical',
      'SIGNIFICANT': 'severity-significant',
      'MODERATE': 'severity-moderate',
      'MINOR': 'severity-minor',
    };
    return classes[significance] || '';
  }

  private getSeverityColor(significance: string): string {
    const colors: Record<string, string> = {
      'CRITICAL': 'danger',
      'SIGNIFICANT': 'warning',
      'MODERATE': 'info',
      'MINOR': 'secondary',
    };
    return colors[significance] || 'secondary';
  }
}
