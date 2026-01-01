/**
 * DashboardGrid - Drag-and-drop dashboard grid layout
 * Lithic Healthcare Platform - Vanilla TypeScript
 */

export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  content: HTMLElement;
}

export interface DashboardGridConfig {
  columns: number;
  rowHeight: number;
  gap: number;
  items: GridItem[];
  isDraggable?: boolean;
  isResizable?: boolean;
  onLayoutChange?: (items: GridItem[]) => void;
}

export class DashboardGrid {
  private container: HTMLElement;
  private config: DashboardGridConfig;
  private gridItems: Map<string, GridItem> = new Map();
  private draggedItem: GridItem | null = null;
  private dragStartPos = { x: 0, y: 0 };

  constructor(container: HTMLElement, config: DashboardGridConfig) {
    this.container = container;
    this.config = {
      isDraggable: true,
      isResizable: true,
      ...config,
    };

    config.items.forEach((item) => this.gridItems.set(item.id, item));
    this.render();
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'dashboard-grid';
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      min-height: 600px;
    `;

    this.gridItems.forEach((item) => {
      const element = this.createGridItem(item);
      this.container.appendChild(element);
    });
  }

  private createGridItem(item: GridItem): HTMLElement {
    const element = document.createElement('div');
    element.dataset.id = item.id;
    element.className = 'grid-item';

    const { left, top, width, height } = this.calculatePosition(item);

    element.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      height: ${height}px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s;
      cursor: ${this.config.isDraggable ? 'move' : 'default'};
    `;

    // Drag handle
    if (this.config.isDraggable) {
      const handle = document.createElement('div');
      handle.className = 'drag-handle';
      handle.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        border-bottom: 1px solid #e9ecef;
        z-index: 10;
      `;

      const gripIcon = document.createElement('div');
      gripIcon.innerHTML = '⋮⋮';
      gripIcon.style.cssText = `
        color: #999;
        font-size: 16px;
        letter-spacing: 2px;
      `;

      handle.appendChild(gripIcon);
      element.appendChild(handle);

      handle.addEventListener('mousedown', (e) => this.handleDragStart(e, item));
    }

    // Content
    const content = document.createElement('div');
    content.className = 'grid-item-content';
    content.style.cssText = `
      padding: ${this.config.isDraggable ? '48px' : '16px'} 16px 16px 16px;
      height: 100%;
      overflow: auto;
    `;

    if (item.content) {
      content.appendChild(item.content);
    }

    element.appendChild(content);

    // Resize handle
    if (this.config.isResizable) {
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      resizeHandle.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: nwse-resize;
      `;

      resizeHandle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M20 15 L15 20 M20 10 L10 20 M20 5 L5 20" stroke="#999" stroke-width="2"/>
        </svg>
      `;

      resizeHandle.addEventListener('mousedown', (e) => this.handleResizeStart(e, item));
      element.appendChild(resizeHandle);
    }

    // Hover effect
    element.addEventListener('mouseenter', () => {
      element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    return element;
  }

  private calculatePosition(item: GridItem): {
    left: number;
    top: number;
    width: number;
    height: number;
  } {
    const containerWidth = this.container.clientWidth;
    const columnWidth = (containerWidth - (this.config.columns - 1) * this.config.gap) / this.config.columns;

    return {
      left: item.x * (columnWidth + this.config.gap),
      top: item.y * (this.config.rowHeight + this.config.gap),
      width: item.w * columnWidth + (item.w - 1) * this.config.gap,
      height: item.h * this.config.rowHeight + (item.h - 1) * this.config.gap,
    };
  }

  private handleDragStart(e: MouseEvent, item: GridItem): void {
    if (!this.config.isDraggable) return;

    e.preventDefault();
    this.draggedItem = item;
    this.dragStartPos = { x: e.clientX, y: e.clientY };

    document.addEventListener('mousemove', this.handleDragMove);
    document.addEventListener('mouseup', this.handleDragEnd);
  }

  private handleDragMove = (e: MouseEvent): void => {
    if (!this.draggedItem) return;

    const deltaX = e.clientX - this.dragStartPos.x;
    const deltaY = e.clientY - this.dragStartPos.y;

    const containerWidth = this.container.clientWidth;
    const columnWidth = (containerWidth - (this.config.columns - 1) * this.config.gap) / this.config.columns;

    const deltaColumns = Math.round(deltaX / (columnWidth + this.config.gap));
    const deltaRows = Math.round(deltaY / (this.config.rowHeight + this.config.gap));

    if (deltaColumns !== 0 || deltaRows !== 0) {
      const newX = Math.max(0, Math.min(this.config.columns - this.draggedItem.w, this.draggedItem.x + deltaColumns));
      const newY = Math.max(0, this.draggedItem.y + deltaRows);

      if (newX !== this.draggedItem.x || newY !== this.draggedItem.y) {
        this.draggedItem.x = newX;
        this.draggedItem.y = newY;
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        this.render();
      }
    }
  };

  private handleDragEnd = (): void => {
    document.removeEventListener('mousemove', this.handleDragMove);
    document.removeEventListener('mouseup', this.handleDragEnd);

    if (this.draggedItem && this.config.onLayoutChange) {
      this.config.onLayoutChange(Array.from(this.gridItems.values()));
    }

    this.draggedItem = null;
  };

  private handleResizeStart(e: MouseEvent, item: GridItem): void {
    if (!this.config.isResizable) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = item.w;
    const startH = item.h;

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const containerWidth = this.container.clientWidth;
      const columnWidth = (containerWidth - (this.config.columns - 1) * this.config.gap) / this.config.columns;

      const deltaColumns = Math.round(deltaX / (columnWidth + this.config.gap));
      const deltaRows = Math.round(deltaY / (this.config.rowHeight + this.config.gap));

      if (deltaColumns !== 0 || deltaRows !== 0) {
        item.w = Math.max(1, Math.min(this.config.columns - item.x, startW + deltaColumns));
        item.h = Math.max(1, startH + deltaRows);
        this.render();
      }
    };

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);

      if (this.config.onLayoutChange) {
        this.config.onLayoutChange(Array.from(this.gridItems.values()));
      }
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }

  public addItem(item: GridItem): void {
    this.gridItems.set(item.id, item);
    this.render();

    if (this.config.onLayoutChange) {
      this.config.onLayoutChange(Array.from(this.gridItems.values()));
    }
  }

  public removeItem(id: string): void {
    this.gridItems.delete(id);
    this.render();

    if (this.config.onLayoutChange) {
      this.config.onLayoutChange(Array.from(this.gridItems.values()));
    }
  }

  public updateItem(id: string, updates: Partial<GridItem>): void {
    const item = this.gridItems.get(id);
    if (item) {
      Object.assign(item, updates);
      this.render();

      if (this.config.onLayoutChange) {
        this.config.onLayoutChange(Array.from(this.gridItems.values()));
      }
    }
  }

  public getLayout(): GridItem[] {
    return Array.from(this.gridItems.values());
  }
}
