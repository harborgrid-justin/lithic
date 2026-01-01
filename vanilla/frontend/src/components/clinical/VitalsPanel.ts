// Vitals Panel Component - Vanilla TypeScript
export class VitalsPanel {
  private container: HTMLElement;
  private onSubmit?: (data: any) => void;

  constructor(containerId: string, onSubmit?: (data: any) => void) {
    const element = document.getElementById(containerId);
    if (!element) throw new Error(`Element with id ${containerId} not found`);
    this.container = element;
    this.onSubmit = onSubmit;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="vitals-panel">
        <form id="vitals-form" class="vitals-form">
          <div class="vitals-grid">
            <div class="vital-item">
              <label for="temperature">Temperature</label>
              <div class="input-group">
                <input type="number" id="temperature" name="temperature" step="0.1" placeholder="98.6">
                <select id="temperatureUnit" name="temperatureUnit">
                  <option value="F">°F</option>
                  <option value="C">°C</option>
                </select>
              </div>
            </div>

            <div class="vital-item">
              <label for="pulse">Pulse</label>
              <div class="input-group">
                <input type="number" id="pulse" name="pulse" placeholder="72">
                <span class="unit">bpm</span>
              </div>
            </div>

            <div class="vital-item">
              <label for="respiratoryRate">Respiratory Rate</label>
              <div class="input-group">
                <input type="number" id="respiratoryRate" name="respiratoryRate" placeholder="16">
                <span class="unit">/min</span>
              </div>
            </div>

            <div class="vital-item">
              <label for="bloodPressure">Blood Pressure</label>
              <div class="input-group bp-group">
                <input type="number" id="bloodPressureSystolic" name="bloodPressureSystolic" placeholder="120">
                <span>/</span>
                <input type="number" id="bloodPressureDiastolic" name="bloodPressureDiastolic" placeholder="80">
                <span class="unit">mmHg</span>
              </div>
            </div>

            <div class="vital-item">
              <label for="oxygenSaturation">O2 Saturation</label>
              <div class="input-group">
                <input type="number" id="oxygenSaturation" name="oxygenSaturation" min="0" max="100" placeholder="98">
                <span class="unit">%</span>
              </div>
            </div>

            <div class="vital-item">
              <label for="weight">Weight</label>
              <div class="input-group">
                <input type="number" id="weight" name="weight" step="0.1" placeholder="150">
                <select id="weightUnit" name="weightUnit">
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div class="vital-item">
              <label for="height">Height</label>
              <div class="input-group">
                <input type="number" id="height" name="height" step="0.1" placeholder="68">
                <select id="heightUnit" name="heightUnit">
                  <option value="in">in</option>
                  <option value="cm">cm</option>
                </select>
              </div>
            </div>

            <div class="vital-item">
              <label for="painLevel">Pain Level (0-10)</label>
              <div class="input-group">
                <input type="number" id="painLevel" name="painLevel" min="0" max="10" placeholder="0">
                <span class="unit">/10</span>
              </div>
            </div>
          </div>

          <div class="vital-item full-width">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" rows="3" placeholder="Additional notes..."></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Record Vitals</button>
            <button type="button" class="btn btn-secondary" id="clear-btn">Clear</button>
          </div>
        </form>

        <div id="bmi-display" class="bmi-display" style="display:none;">
          <strong>BMI:</strong> <span id="bmi-value">--</span>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = this.container.querySelector('#vitals-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(form);
    });

    const clearBtn = this.container.querySelector('#clear-btn');
    clearBtn?.addEventListener('click', () => {
      form?.reset();
      this.hideBMI();
    });

    // Calculate BMI on weight/height change
    const weightInput = this.container.querySelector('#weight') as HTMLInputElement;
    const heightInput = this.container.querySelector('#height') as HTMLInputElement;
    const weightUnit = this.container.querySelector('#weightUnit') as HTMLSelectElement;
    const heightUnit = this.container.querySelector('#heightUnit') as HTMLSelectElement;

    [weightInput, heightInput, weightUnit, heightUnit].forEach(element => {
      element?.addEventListener('change', () => this.calculateBMI());
    });
  }

  private handleSubmit(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const data: any = {};

    formData.forEach((value, key) => {
      if (value) {
        data[key] = key.includes('Unit') ? value : parseFloat(value as string);
      }
    });

    if (this.onSubmit) {
      this.onSubmit(data);
    }
  }

  private calculateBMI(): void {
    const weight = parseFloat((this.container.querySelector('#weight') as HTMLInputElement)?.value || '0');
    const height = parseFloat((this.container.querySelector('#height') as HTMLInputElement)?.value || '0');
    const weightUnit = (this.container.querySelector('#weightUnit') as HTMLSelectElement)?.value;
    const heightUnit = (this.container.querySelector('#heightUnit') as HTMLSelectElement)?.value;

    if (weight > 0 && height > 0) {
      // Convert to kg and meters
      const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight;
      const heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;

      const bmi = weightKg / (heightM * heightM);
      this.showBMI(bmi);
    } else {
      this.hideBMI();
    }
  }

  private showBMI(bmi: number): void {
    const bmiDisplay = this.container.querySelector('#bmi-display') as HTMLElement;
    const bmiValue = this.container.querySelector('#bmi-value') as HTMLElement;

    if (bmiDisplay && bmiValue) {
      bmiValue.textContent = bmi.toFixed(1);
      bmiDisplay.style.display = 'block';

      // Color code based on BMI ranges
      if (bmi < 18.5) {
        bmiValue.className = 'bmi-underweight';
      } else if (bmi < 25) {
        bmiValue.className = 'bmi-normal';
      } else if (bmi < 30) {
        bmiValue.className = 'bmi-overweight';
      } else {
        bmiValue.className = 'bmi-obese';
      }
    }
  }

  private hideBMI(): void {
    const bmiDisplay = this.container.querySelector('#bmi-display') as HTMLElement;
    if (bmiDisplay) {
      bmiDisplay.style.display = 'none';
    }
  }

  reset(): void {
    const form = this.container.querySelector('#vitals-form') as HTMLFormElement;
    form?.reset();
    this.hideBMI();
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}

export default VitalsPanel;
