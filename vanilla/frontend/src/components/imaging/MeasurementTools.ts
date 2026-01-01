export class MeasurementTools {
  private container: HTMLElement | null = null;
  private measurements: any[] = [];
  private onMeasurementAdd?: (measurement: any) => void;
  private onMeasurementDelete?: (index: number) => void;

  constructor() {}

  render(container: HTMLElement) {
    this.container = container;

    container.innerHTML = `
      <div class="measurement-tools">
        <div class="tool-buttons">
          <button class="tool-btn" data-tool="length" title="Length Measurement">
            <span class="tool-icon">📏</span>
            <span class="tool-label">Length</span>
          </button>
          <button class="tool-btn" data-tool="angle" title="Angle Measurement">
            <span class="tool-icon">📐</span>
            <span class="tool-label">Angle</span>
          </button>
          <button class="tool-btn" data-tool="area" title="Area Measurement">
            <span class="tool-icon">⬜</span>
            <span class="tool-label">Area</span>
          </button>
          <button class="tool-btn" data-tool="ellipse" title="Ellipse ROI">
            <span class="tool-icon">⭕</span>
            <span class="tool-label">Ellipse</span>
          </button>
        </div>

        <div class="measurements-list">
          <h4>Measurements</h4>
          <div id="measurements-container">
            ${this.renderMeasurementsList()}
          </div>
        </div>

        <div class="measurement-stats">
          <div class="stat">
            <span class="stat-label">Total:</span>
            <span class="stat-value">${this.measurements.length}</span>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderMeasurementsList(): string {
    if (this.measurements.length === 0) {
      return '<div class="empty-state">No measurements</div>';
    }

    return `
      <ul class="measurement-items">
        ${this.measurements.map((m, index) => this.createMeasurementItem(m, index)).join('')}
      </ul>
    `;
  }

  private createMeasurementItem(measurement: any, index: number): string {
    let valueText = '';

    if (measurement.type === 'length') {
      valueText = `${measurement.value.toFixed(2)} mm`;
    } else if (measurement.type === 'angle') {
      valueText = `${measurement.value.toFixed(1)}°`;
    } else if (measurement.type === 'area') {
      valueText = `${measurement.value.toFixed(2)} mm²`;
    }

    return `
      <li class="measurement-item" data-index="${index}">
        <div class="measurement-info">
          <span class="measurement-type">${measurement.type}</span>
          <span class="measurement-value">${valueText}</span>
        </div>
        <div class="measurement-actions">
          <button class="btn-icon" data-action="delete" data-index="${index}">🗑️</button>
        </div>
      </li>
    `;
  }

  private attachEventListeners() {
    if (!this.container) return;

    // Tool buttons
    this.container.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = (e.currentTarget as HTMLElement).dataset.tool;
        this.activateTool(tool!);
      });
    });

    // Delete measurement
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.action === 'delete') {
        const index = parseInt(target.dataset.index || '0');
        this.deleteMeasurement(index);
      }
    });
  }

  private activateTool(tool: string) {
    // Deactivate all tools
    this.container?.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Activate selected tool
    const toolBtn = this.container?.querySelector(`[data-tool="${tool}"]`);
    toolBtn?.classList.add('active');

    // TODO: Set tool on viewer
    console.log('Activated tool:', tool);
  }

  addMeasurement(measurement: any) {
    this.measurements.push(measurement);
    this.updateList();

    if (this.onMeasurementAdd) {
      this.onMeasurementAdd(measurement);
    }
  }

  private deleteMeasurement(index: number) {
    this.measurements.splice(index, 1);
    this.updateList();

    if (this.onMeasurementDelete) {
      this.onMeasurementDelete(index);
    }
  }

  private updateList() {
    const listContainer = document.getElementById('measurements-container');
    if (listContainer) {
      listContainer.innerHTML = this.renderMeasurementsList();
    }

    // Update stats
    const statValue = this.container?.querySelector('.measurement-stats .stat-value');
    if (statValue) {
      statValue.textContent = this.measurements.length.toString();
    }
  }

  getMeasurements() {
    return this.measurements;
  }

  setMeasurements(measurements: any[]) {
    this.measurements = measurements;
    this.updateList();
  }
}
