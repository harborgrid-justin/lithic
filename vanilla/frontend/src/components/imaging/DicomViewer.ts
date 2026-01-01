export class DicomViewer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private instances: any[] = [];
  private currentIndex: number = 0;
  private currentTool: string = 'pan';

  // Image properties
  private imageData: ImageData | null = null;
  private pixelData: Uint8Array | null = null;
  private width: number = 0;
  private height: number = 0;

  // Viewport state
  private scale: number = 1.0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private rotation: number = 0;
  private inverted: boolean = false;

  // Window/Level
  private windowWidth: number = 400;
  private windowCenter: number = 40;

  // Interaction state
  private isDragging: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;

  // Measurements and annotations
  private measurements: any[] = [];
  private annotations: any[] = [];

  constructor() {}

  async loadSeries(container: HTMLElement, instances: any[]) {
    this.instances = instances;
    this.currentIndex = 0;

    // Create canvas if not exists
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'dicom-canvas';
      this.ctx = this.canvas.getContext('2d');
      container.appendChild(this.canvas);

      // Set canvas size
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;

      this.attachEventListeners();
    }

    // Load first instance
    if (instances.length > 0) {
      await this.loadInstance(0);
    }
  }

  async loadInstance(index: number) {
    if (index < 0 || index >= this.instances.length) return;

    this.currentIndex = index;
    const instance = this.instances[index];

    try {
      // In production, fetch actual DICOM pixel data
      // For now, create mock image data
      this.width = instance.columns || 512;
      this.height = instance.rows || 512;

      // Create mock pixel data (simulated medical image)
      this.pixelData = this.generateMockDicomPixelData(this.width, this.height);

      // Apply window/level
      this.applyWindowLevel();

      // Render
      this.render();
    } catch (error) {
      console.error('Error loading instance:', error);
    }
  }

  private generateMockDicomPixelData(width: number, height: number): Uint8Array {
    // Generate simulated CT/MRI-like image
    const data = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;

        // Create some anatomical-looking structures
        const centerX = width / 2;
        const centerY = height / 2;
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        // Circular structure (simulating organ)
        if (distFromCenter < 150) {
          data[idx] = 180 + Math.random() * 40;
        } else if (distFromCenter < 200) {
          data[idx] = 140 + Math.random() * 30;
        } else {
          data[idx] = 40 + Math.random() * 30;
        }

        // Add some noise for realism
        data[idx] += (Math.random() - 0.5) * 20;
        data[idx] = Math.max(0, Math.min(255, data[idx]));
      }
    }

    return data;
  }

  private applyWindowLevel() {
    if (!this.pixelData || !this.canvas || !this.ctx) return;

    const windowMin = this.windowCenter - this.windowWidth / 2;
    const windowMax = this.windowCenter + this.windowWidth / 2;

    // Create ImageData
    this.imageData = this.ctx.createImageData(this.width, this.height);
    const data = this.imageData.data;

    for (let i = 0; i < this.pixelData.length; i++) {
      let pixel = this.pixelData[i];

      // Apply window/level
      let value: number;
      if (pixel <= windowMin) {
        value = 0;
      } else if (pixel >= windowMax) {
        value = 255;
      } else {
        value = ((pixel - windowMin) / this.windowWidth) * 255;
      }

      // Apply inversion
      if (this.inverted) {
        value = 255 - value;
      }

      const idx = i * 4;
      data[idx] = value;     // R
      data[idx + 1] = value; // G
      data[idx + 2] = value; // B
      data[idx + 3] = 255;   // A
    }
  }

  private render() {
    if (!this.canvas || !this.ctx || !this.imageData) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    // Apply transformations
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.rotate(this.rotation * Math.PI / 180);
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(-this.width / 2 + this.offsetX, -this.height / 2 + this.offsetY);

    // Create temporary canvas for image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.putImageData(this.imageData, 0, 0);
      this.ctx.drawImage(tempCanvas, 0, 0);
    }

    // Restore context
    this.ctx.restore();

    // Render measurements and annotations
    this.renderMeasurements();
    this.renderAnnotations();
  }

  private renderMeasurements() {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#00FF00';

    this.measurements.forEach(measurement => {
      if (measurement.type === 'length') {
        this.drawLine(measurement.x1, measurement.y1, measurement.x2, measurement.y2);
        const length = this.calculateDistance(measurement.x1, measurement.y1, measurement.x2, measurement.y2);
        this.ctx!.fillText(`${length.toFixed(2)} mm`, measurement.x2 + 5, measurement.y2);
      } else if (measurement.type === 'angle') {
        this.drawAngle(measurement);
      }
    });

    this.ctx.restore();
  }

  private renderAnnotations() {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = '14px Arial';

    this.annotations.forEach(annotation => {
      if (annotation.type === 'text') {
        this.ctx!.fillText(annotation.text, annotation.x, annotation.y);
      } else if (annotation.type === 'arrow') {
        this.drawArrow(annotation.x1, annotation.y1, annotation.x2, annotation.y2);
      }
    });

    this.ctx.restore();
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number) {
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private drawArrow(x1: number, y1: number, x2: number, y2: number) {
    if (!this.ctx) return;

    const headLength = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    this.ctx.stroke();
  }

  private drawAngle(measurement: any) {
    if (!this.ctx) return;

    const { x1, y1, x2, y2, x3, y3 } = measurement;

    // Draw lines
    this.drawLine(x1, y1, x2, y2);
    this.drawLine(x2, y2, x3, y3);

    // Calculate and display angle
    const angle = this.calculateAngle(x1, y1, x2, y2, x3, y3);
    this.ctx.fillText(`${angle.toFixed(1)}°`, x2 + 10, y2 - 10);
  }

  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    // In real implementation, convert to mm using pixel spacing
    const pixelDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const pixelSpacing = 0.5; // Mock pixel spacing in mm
    return pixelDistance * pixelSpacing;
  }

  private calculateAngle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
    const angle1 = Math.atan2(y1 - y2, x1 - x2);
    const angle2 = Math.atan2(y3 - y2, x3 - x2);
    let angle = (angle2 - angle1) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  }

  private attachEventListeners() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.lastX = e.offsetX;
    this.lastY = e.offsetY;
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = e.offsetX - this.lastX;
    const deltaY = e.offsetY - this.lastY;

    if (this.currentTool === 'pan') {
      this.offsetX += deltaX / this.scale;
      this.offsetY += deltaY / this.scale;
      this.render();
    } else if (this.currentTool === 'window') {
      this.windowWidth += deltaX;
      this.windowCenter += deltaY;
      this.windowWidth = Math.max(1, this.windowWidth);
      this.applyWindowLevel();
      this.render();

      // Update UI
      this.updateWindowLevelDisplay();
    }

    this.lastX = e.offsetX;
    this.lastY = e.offsetY;
  }

  private handleMouseUp(e: MouseEvent) {
    this.isDragging = false;
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();

    if (this.currentTool === 'zoom') {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale *= delta;
      this.scale = Math.max(0.1, Math.min(10, this.scale));
      this.render();
      this.updateZoomDisplay();
    } else {
      // Scroll through images
      if (e.deltaY > 0) {
        this.nextImage();
      } else {
        this.previousImage();
      }
    }
  }

  private updateWindowLevelDisplay() {
    const wwEl = document.getElementById('ww');
    const wcEl = document.getElementById('wc');
    if (wwEl) wwEl.textContent = Math.round(this.windowWidth).toString();
    if (wcEl) wcEl.textContent = Math.round(this.windowCenter).toString();
  }

  private updateZoomDisplay() {
    const zoomEl = document.getElementById('zoom');
    if (zoomEl) zoomEl.textContent = Math.round(this.scale * 100).toString();
  }

  // Public methods
  setTool(tool: string) {
    this.currentTool = tool;
  }

  setWindowLevel(windowWidth: number, windowCenter: number) {
    this.windowWidth = windowWidth;
    this.windowCenter = windowCenter;
    this.applyWindowLevel();
    this.render();
    this.updateWindowLevelDisplay();
  }

  invert() {
    this.inverted = !this.inverted;
    this.applyWindowLevel();
    this.render();
  }

  rotate(degrees: number) {
    this.rotation = (this.rotation + degrees) % 360;
    this.render();
  }

  reset() {
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotation = 0;
    this.inverted = false;
    this.render();
  }

  nextImage() {
    if (this.currentIndex < this.instances.length - 1) {
      this.loadInstance(this.currentIndex + 1);
      this.updateImageCounter();
    }
  }

  previousImage() {
    if (this.currentIndex > 0) {
      this.loadInstance(this.currentIndex - 1);
      this.updateImageCounter();
    }
  }

  goToImage(index: number) {
    this.loadInstance(index);
    this.updateImageCounter();
  }

  private updateImageCounter() {
    const currentEl = document.getElementById('current-image');
    if (currentEl) currentEl.textContent = (this.currentIndex + 1).toString();
  }

  addMeasurement(measurement: any) {
    this.measurements.push(measurement);
    this.render();
  }

  addAnnotation(annotation: any) {
    this.annotations.push(annotation);
    this.render();
  }

  getMeasurements() {
    return this.measurements;
  }

  getAnnotations() {
    return this.annotations;
  }

  destroy() {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }
}
