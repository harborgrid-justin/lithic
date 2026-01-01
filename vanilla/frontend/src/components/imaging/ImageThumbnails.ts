export class ImageThumbnails {
  private container: HTMLElement | null = null;
  private thumbnails: any[] = [];
  private onSelect?: (index: number) => void;

  constructor() {}

  render(container: HTMLElement, instances: any[], onSelect?: (index: number) => void) {
    this.container = container;
    this.thumbnails = instances;
    this.onSelect = onSelect;

    container.innerHTML = `
      <div class="thumbnails-container">
        ${instances.map((instance, index) => this.createThumbnail(instance, index)).join('')}
      </div>
    `;

    this.attachEventListeners();
  }

  private createThumbnail(instance: any, index: number): string {
    return `
      <div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-index="${index}">
        <div class="thumbnail-image">
          <canvas class="thumbnail-canvas" id="thumb-${index}" width="100" height="100"></canvas>
        </div>
        <div class="thumbnail-label">${index + 1}</div>
      </div>
    `;
  }

  private attachEventListeners() {
    if (!this.container) return;

    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const thumbnailItem = target.closest('.thumbnail-item');

      if (thumbnailItem) {
        const index = parseInt(thumbnailItem.getAttribute('data-index') || '0');

        // Update active state
        this.container!.querySelectorAll('.thumbnail-item').forEach(item => {
          item.classList.remove('active');
        });
        thumbnailItem.classList.add('active');

        // Callback
        if (this.onSelect) {
          this.onSelect(index);
        }
      }
    });
  }

  setActive(index: number) {
    if (!this.container) return;

    this.container.querySelectorAll('.thumbnail-item').forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}
