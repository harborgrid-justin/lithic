// Vitals Chart Component - Vanilla TypeScript (Simple line chart)
export class VitalsChart {
  private container: HTMLElement;
  private vitals: any[] = [];
  private vitalType: string = 'temperature';

  constructor(containerId: string) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
  }

  setVitals(vitals: any[], vitalType: string = 'temperature'): void {
    this.vitals = vitals;
    this.vitalType = vitalType;
    this.render();
  }

  private render(): void {
    if (this.vitals.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No vital signs data</div>';
      return;
    }

    const chartHTML = this.renderChart();
    const legendHTML = this.renderLegend();

    this.container.innerHTML = `
      <div class="vitals-chart">
        <div class="chart-controls">
          <label>View:</label>
          <select id="vital-type-select">
            <option value="temperature" ${this.vitalType === 'temperature' ? 'selected' : ''}>Temperature</option>
            <option value="pulse" ${this.vitalType === 'pulse' ? 'selected' : ''}>Pulse</option>
            <option value="bloodPressure" ${this.vitalType === 'bloodPressure' ? 'selected' : ''}>Blood Pressure</option>
            <option value="oxygenSaturation" ${this.vitalType === 'oxygenSaturation' ? 'selected' : ''}>O2 Saturation</option>
            <option value="weight" ${this.vitalType === 'weight' ? 'selected' : ''}>Weight</option>
          </select>
        </div>
        ${chartHTML}
        ${legendHTML}
      </div>
    `;

    this.attachEventListeners();
  }

  private renderChart(): string {
    const data = this.getChartData();
    if (data.length === 0) {
      return '<div class="empty-state">No data for selected vital type</div>';
    }

    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 80;
      return `${x},${y}`;
    }).join(' ');

    return `
      <div class="chart-container">
        <svg viewBox="0 0 100 100" class="line-chart">
          <!-- Grid lines -->
          <line x1="0" y1="20" x2="100" y2="20" stroke="#e0e0e0" stroke-width="0.2"/>
          <line x1="0" y1="40" x2="100" y2="40" stroke="#e0e0e0" stroke-width="0.2"/>
          <line x1="0" y1="60" x2="100" y2="60" stroke="#e0e0e0" stroke-width="0.2"/>
          <line x1="0" y1="80" x2="100" y2="80" stroke="#e0e0e0" stroke-width="0.2"/>
          <line x1="0" y1="100" x2="100" y2="100" stroke="#e0e0e0" stroke-width="0.2"/>

          <!-- Data line -->
          <polyline
            points="${points}"
            fill="none"
            stroke="#2563eb"
            stroke-width="0.5"
          />

          <!-- Data points -->
          ${data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - min) / range) * 80;
            return `<circle cx="${x}" cy="${y}" r="1" fill="#2563eb" class="data-point" data-value="${d.value}" data-date="${d.date}"/>`;
          }).join('')}
        </svg>
        <div class="chart-labels">
          <span class="label-max">${max.toFixed(1)}</span>
          <span class="label-min">${min.toFixed(1)}</span>
        </div>
      </div>
    `;
  }

  private renderLegend(): string {
    const latestVital = this.vitals[0];
    if (!latestVital) return '';

    const date = new Date(latestVital.recordedAt).toLocaleString();
    const value = this.getVitalValue(latestVital);

    return `
      <div class="chart-legend">
        <div><strong>Latest Reading:</strong> ${value}</div>
        <div><strong>Recorded:</strong> ${date}</div>
      </div>
    `;
  }

  private getChartData(): Array<{ date: string; value: number }> {
    return this.vitals.map(vital => ({
      date: vital.recordedAt,
      value: this.getVitalNumericValue(vital),
    })).filter(d => d.value !== null).reverse();
  }

  private getVitalNumericValue(vital: any): number {
    switch (this.vitalType) {
      case 'temperature':
        return vital.temperature || 0;
      case 'pulse':
        return vital.pulse || 0;
      case 'bloodPressure':
        return vital.bloodPressureSystolic || 0;
      case 'oxygenSaturation':
        return vital.oxygenSaturation || 0;
      case 'weight':
        return vital.weight || 0;
      default:
        return 0;
    }
  }

  private getVitalValue(vital: any): string {
    switch (this.vitalType) {
      case 'temperature':
        return `${vital.temperature} °${vital.temperatureUnit}`;
      case 'pulse':
        return `${vital.pulse} bpm`;
      case 'bloodPressure':
        return `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`;
      case 'oxygenSaturation':
        return `${vital.oxygenSaturation}%`;
      case 'weight':
        return `${vital.weight} ${vital.weightUnit}`;
      default:
        return 'N/A';
    }
  }

  private attachEventListeners(): void {
    const select = this.container.querySelector('#vital-type-select') as HTMLSelectElement;
    select?.addEventListener('change', (e) => {
      this.vitalType = (e.target as HTMLSelectElement).value;
      this.render();
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default VitalsChart;
