/**
 * Time Slot Picker Component
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export class TimeSlotPicker {
  private container: HTMLElement;
  private selectedSlot: Date | null = null;
  private onSlotSelect?: (slot: Date) => void;

  constructor(container: HTMLElement, options?: {
    onSlotSelect?: (slot: Date) => void;
  }) {
    this.container = container;
    this.onSlotSelect = options?.onSlotSelect;
  }

  async render(providerId: string, date: Date): Promise<void> {
    // Fetch available slots
    const slots = await this.fetchAvailableSlots(providerId, date);

    this.container.innerHTML = `
      <div class="time-slot-picker">
        <h4>Available Time Slots</h4>
        <div class="slots-grid">
          ${slots.map(slot => `
            <button class="time-slot ${this.isSlotSelected(slot) ? 'selected' : ''}"
                    data-time="${slot.toISOString()}"
                    ${!slot ? 'disabled' : ''}>
              ${this.formatTime(slot)}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private async fetchAvailableSlots(providerId: string, date: Date): Promise<Date[]> {
    // Mock implementation - replace with actual API call
    const slots: Date[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slot = new Date(date);
        slot.setHours(hour, minute, 0, 0);
        slots.push(slot);
      }
    }

    return slots;
  }

  private attachEventListeners(): void {
    this.container.querySelectorAll('.time-slot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timeStr = (e.currentTarget as HTMLElement).dataset.time;
        if (timeStr) {
          this.selectedSlot = new Date(timeStr);
          this.highlightSelected();
          if (this.onSlotSelect) {
            this.onSlotSelect(this.selectedSlot);
          }
        }
      });
    });
  }

  private highlightSelected(): void {
    this.container.querySelectorAll('.time-slot').forEach(btn => {
      btn.classList.remove('selected');
    });
    const selectedBtn = this.container.querySelector(`[data-time="${this.selectedSlot?.toISOString()}"]`);
    selectedBtn?.classList.add('selected');
  }

  private isSlotSelected(slot: Date): boolean {
    return this.selectedSlot?.getTime() === slot.getTime();
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  destroy(): void {}
}
