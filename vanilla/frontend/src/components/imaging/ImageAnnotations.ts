export class ImageAnnotations {
  private container: HTMLElement | null = null;
  private annotations: any[] = [];
  private onAnnotationAdd?: (annotation: any) => void;
  private onAnnotationDelete?: (index: number) => void;

  constructor() {}

  render(container: HTMLElement) {
    this.container = container;

    container.innerHTML = `
      <div class="annotation-tools">
        <div class="tool-buttons">
          <button class="tool-btn" data-tool="text" title="Text Annotation">
            <span class="tool-icon">T</span>
            <span class="tool-label">Text</span>
          </button>
          <button class="tool-btn" data-tool="arrow" title="Arrow">
            <span class="tool-icon">→</span>
            <span class="tool-label">Arrow</span>
          </button>
          <button class="tool-btn" data-tool="rectangle" title="Rectangle">
            <span class="tool-icon">□</span>
            <span class="tool-label">Rectangle</span>
          </button>
          <button class="tool-btn" data-tool="freehand" title="Freehand Drawing">
            <span class="tool-icon">✏️</span>
            <span class="tool-label">Draw</span>
          </button>
        </div>

        <div class="annotations-list">
          <h4>Annotations</h4>
          <div id="annotations-container">
            ${this.renderAnnotationsList()}
          </div>
        </div>

        <div class="annotation-settings">
          <div class="setting-group">
            <label>Color:</label>
            <div class="color-picker">
              <button class="color-btn" data-color="#FFFF00" style="background: #FFFF00"></button>
              <button class="color-btn" data-color="#00FF00" style="background: #00FF00"></button>
              <button class="color-btn" data-color="#FF0000" style="background: #FF0000"></button>
              <button class="color-btn" data-color="#00FFFF" style="background: #00FFFF"></button>
              <button class="color-btn" data-color="#FF00FF" style="background: #FF00FF"></button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderAnnotationsList(): string {
    if (this.annotations.length === 0) {
      return '<div class="empty-state">No annotations</div>';
    }

    return `
      <ul class="annotation-items">
        ${this.annotations.map((a, index) => this.createAnnotationItem(a, index)).join('')}
      </ul>
    `;
  }

  private createAnnotationItem(annotation: any, index: number): string {
    let label = annotation.type;
    if (annotation.type === 'text') {
      label = annotation.text.substring(0, 20);
    }

    return `
      <li class="annotation-item" data-index="${index}">
        <div class="annotation-info">
          <span class="annotation-type">${annotation.type}</span>
          <span class="annotation-label">${label}</span>
        </div>
        <div class="annotation-actions">
          <button class="btn-icon" data-action="edit" data-index="${index}">✏️</button>
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

    // Color picker
    this.container.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = (e.currentTarget as HTMLElement).dataset.color;
        this.setColor(color!);
      });
    });

    // Actions
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const index = parseInt(target.dataset.index || '0');

      if (target.dataset.action === 'edit') {
        this.editAnnotation(index);
      } else if (target.dataset.action === 'delete') {
        this.deleteAnnotation(index);
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

    console.log('Activated annotation tool:', tool);
  }

  private setColor(color: string) {
    // Deactivate all colors
    this.container?.querySelectorAll('.color-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Activate selected color
    const colorBtn = this.container?.querySelector(`[data-color="${color}"]`);
    colorBtn?.classList.add('active');

    console.log('Set annotation color:', color);
  }

  addAnnotation(annotation: any) {
    this.annotations.push(annotation);
    this.updateList();

    if (this.onAnnotationAdd) {
      this.onAnnotationAdd(annotation);
    }
  }

  private editAnnotation(index: number) {
    const annotation = this.annotations[index];
    if (annotation.type === 'text') {
      const newText = prompt('Edit text:', annotation.text);
      if (newText) {
        annotation.text = newText;
        this.updateList();
      }
    }
  }

  private deleteAnnotation(index: number) {
    this.annotations.splice(index, 1);
    this.updateList();

    if (this.onAnnotationDelete) {
      this.onAnnotationDelete(index);
    }
  }

  private updateList() {
    const listContainer = document.getElementById('annotations-container');
    if (listContainer) {
      listContainer.innerHTML = this.renderAnnotationsList();
    }
  }

  getAnnotations() {
    return this.annotations;
  }

  setAnnotations(annotations: any[]) {
    this.annotations = annotations;
    this.updateList();
  }
}
