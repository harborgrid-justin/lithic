/**
 * Signature Pad Service
 * Lithic Healthcare Platform v0.5
 *
 * Advanced signature capture with:
 * - Pressure-sensitive drawing
 * - Velocity tracking
 * - Biometric data collection
 * - Multiple export formats
 * - Signature validation
 */

import {
  SignaturePadOptions,
  SignaturePadData,
  SignaturePoint,
  BiometricData,
  BiometricStroke,
} from '@/types/esignature';

export class SignaturePad {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<SignaturePadOptions>;
  private points: SignaturePoint[] = [];
  private strokes: BiometricStroke[] = [];
  private currentStroke: SignaturePoint[] = [];
  private isDrawing = false;
  private lastPoint: SignaturePoint | null = null;
  private startTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    options: Partial<SignaturePadOptions> = {}
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    this.ctx = ctx;

    this.options = {
      width: options.width || 500,
      height: options.height || 200,
      backgroundColor: options.backgroundColor || '#FFFFFF',
      penColor: options.penColor || '#000000',
      penWidth: options.penWidth || 2,
      minPenWidth: options.minPenWidth || 0.5,
      maxPenWidth: options.maxPenWidth || 3.5,
      velocityFilterWeight: options.velocityFilterWeight || 0.7,
      dotSize: options.dotSize || 1.5,
      throttle: options.throttle || 16,
      minDistance: options.minDistance || 5,
      onBegin: options.onBegin,
      onEnd: options.onEnd,
      captureVelocity: options.captureVelocity !== false,
      capturePressure: options.capturePressure !== false,
    };

    this.initialize();
  }

  /**
   * Initialize the signature pad
   */
  private initialize(): void {
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;

    this.clear();

    // Add event listeners
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Prevent scrolling on touch devices
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
  }

  /**
   * Clear the signature pad
   */
  clear(): void {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.points = [];
    this.strokes = [];
    this.currentStroke = [];
    this.lastPoint = null;
  }

  /**
   * Check if signature pad is empty
   */
  isEmpty(): boolean {
    return this.points.length === 0;
  }

  /**
   * Get signature data
   */
  getData(): SignaturePadData {
    const bounds = this.calculateBounds();

    return {
      isEmpty: this.isEmpty(),
      points: this.points,
      bounds,
      metadata: {
        startTime: this.startTime,
        endTime: Date.now(),
        duration: Date.now() - this.startTime,
        pointCount: this.points.length,
        strokeCount: this.strokes.length,
      },
    };
  }

  /**
   * Get signature as data URL
   */
  toDataURL(type: 'image/png' | 'image/jpeg' | 'image/svg+xml' = 'image/png'): string {
    if (type === 'image/svg+xml') {
      return this.toSVG();
    }
    return this.canvas.toDataURL(type);
  }

  /**
   * Get signature as SVG
   */
  toSVG(): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.canvas.width}" height="${this.canvas.height}" viewBox="0 0 ${this.canvas.width} ${this.canvas.height}">
      <rect width="100%" height="100%" fill="${this.options.backgroundColor}"/>
      ${this.strokes.map((stroke) => this.strokeToSVGPath(stroke)).join('\n')}
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Get biometric data
   */
  getBiometricData(): BiometricData {
    const pressures: number[] = [];
    const speeds: number[] = [];
    const accelerations: number[] = [];

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i]!;
      pressures.push(point.pressure || 1);

      if (i > 0) {
        const prevPoint = this.points[i - 1]!;
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const dt = point.time - prevPoint.time;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        speeds.push(speed);

        if (i > 1) {
          const prevSpeed = speeds[i - 1]!;
          const acceleration = (speed - prevSpeed) / dt;
          accelerations.push(acceleration);
        }
      }
    }

    return {
      pressure: pressures,
      speed: speeds,
      acceleration: accelerations,
      duration: this.points.length > 0
        ? this.points[this.points.length - 1]!.time - this.points[0]!.time
        : 0,
      strokes: this.strokes,
      signatureHash: this.calculateSignatureHash(),
    };
  }

  /**
   * Load signature from data
   */
  fromData(data: SignaturePadData): void {
    this.clear();
    this.points = data.points;
    this.strokes = this.reconstructStrokes(data.points);
    this.redraw();
  }

  /**
   * Load signature from data URL
   */
  fromDataURL(dataUrl: string): void {
    const img = new Image();
    img.onload = () => {
      this.clear();
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  // Event handlers

  private handleMouseDown(event: MouseEvent): void {
    this.beginStroke(event.offsetX, event.offsetY, this.getPressure(event));
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDrawing) return;
    this.continueStroke(event.offsetX, event.offsetY, this.getPressure(event));
  }

  private handleMouseUp(event: MouseEvent): void {
    this.endStroke();
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;
    const rect = this.canvas.getBoundingClientRect();
    this.beginStroke(
      touch.clientX - rect.left,
      touch.clientY - rect.top,
      this.getPressure(touch)
    );
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isDrawing) return;
    const touch = event.touches[0];
    if (!touch) return;
    const rect = this.canvas.getBoundingClientRect();
    this.continueStroke(
      touch.clientX - rect.left,
      touch.clientY - rect.top,
      this.getPressure(touch)
    );
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.endStroke();
  }

  // Drawing methods

  private beginStroke(x: number, y: number, pressure: number): void {
    this.isDrawing = true;

    if (this.points.length === 0) {
      this.startTime = Date.now();
    }

    const point: SignaturePoint = {
      x,
      y,
      time: Date.now(),
      pressure,
    };

    this.lastPoint = point;
    this.currentStroke = [point];
    this.points.push(point);

    this.drawPoint(x, y, this.options.dotSize);

    if (this.options.onBegin) {
      this.options.onBegin();
    }
  }

  private continueStroke(x: number, y: number, pressure: number): void {
    if (!this.lastPoint) return;

    const point: SignaturePoint = {
      x,
      y,
      time: Date.now(),
      pressure,
    };

    // Calculate velocity if enabled
    if (this.options.captureVelocity) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const dt = point.time - this.lastPoint.time;

      if (dt > 0) {
        point.velocityX = dx / dt;
        point.velocityY = dy / dt;
      }
    }

    // Check minimum distance
    const distance = this.calculateDistance(this.lastPoint, point);
    if (distance < this.options.minDistance) {
      return;
    }

    this.currentStroke.push(point);
    this.points.push(point);

    // Draw line
    this.drawLine(this.lastPoint, point);

    this.lastPoint = point;
  }

  private endStroke(): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    if (this.currentStroke.length > 0) {
      // Convert stroke to biometric stroke
      const biometricStroke: BiometricStroke = {
        points: this.currentStroke.map((p) => ({
          x: p.x,
          y: p.y,
          pressure: p.pressure || 1,
          timestamp: p.time,
        })),
        pressure: this.currentStroke.map((p) => p.pressure || 1),
        timestamp: this.currentStroke.map((p) => p.time),
      };

      this.strokes.push(biometricStroke);
    }

    this.currentStroke = [];
    this.lastPoint = null;

    if (this.options.onEnd) {
      this.options.onEnd();
    }
  }

  private drawPoint(x: number, y: number, size: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.options.penColor;
    this.ctx.fill();
  }

  private drawLine(from: SignaturePoint, to: SignaturePoint): void {
    // Calculate line width based on velocity and pressure
    const velocity = this.calculateVelocity(from, to);
    const width = this.calculateLineWidth(velocity, to.pressure || 1);

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.strokeStyle = this.options.penColor;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
  }

  private redraw(): void {
    this.clear();

    for (const stroke of this.strokes) {
      for (let i = 0; i < stroke.points.length; i++) {
        const point = stroke.points[i]!;

        if (i === 0) {
          this.drawPoint(point.x, point.y, this.options.dotSize);
        } else {
          const prevPoint = stroke.points[i - 1]!;
          this.ctx.beginPath();
          this.ctx.moveTo(prevPoint.x, prevPoint.y);
          this.ctx.lineTo(point.x, point.y);
          this.ctx.strokeStyle = this.options.penColor;
          this.ctx.lineWidth = this.options.penWidth;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.stroke();
        }
      }
    }
  }

  // Helper methods

  private getPressure(event: MouseEvent | Touch): number {
    if (!this.options.capturePressure) return 1;

    // Pressure API is not widely supported yet
    // @ts-ignore
    return event.pressure || event.force || 1;
  }

  private calculateDistance(p1: SignaturePoint, p2: SignaturePoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateVelocity(from: SignaturePoint, to: SignaturePoint): number {
    const distance = this.calculateDistance(from, to);
    const time = to.time - from.time;
    return time > 0 ? distance / time : 0;
  }

  private calculateLineWidth(velocity: number, pressure: number): number {
    const minWidth = this.options.minPenWidth;
    const maxWidth = this.options.maxPenWidth;

    // Inverse relationship with velocity
    const velocityFactor = Math.max(0, 1 - velocity / 100);

    // Direct relationship with pressure
    const pressureFactor = pressure;

    const width = minWidth + (maxWidth - minWidth) * velocityFactor * pressureFactor;

    return Math.max(minWidth, Math.min(maxWidth, width));
  }

  private calculateBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    if (this.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, minY, maxX, maxY };
  }

  private strokeToSVGPath(stroke: BiometricStroke): string {
    if (stroke.points.length === 0) return '';

    const firstPoint = stroke.points[0]!;
    let path = `M ${firstPoint.x} ${firstPoint.y}`;

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i]!;
      path += ` L ${point.x} ${point.y}`;
    }

    return `<path d="${path}" stroke="${this.options.penColor}" stroke-width="${this.options.penWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  private reconstructStrokes(points: SignaturePoint[]): BiometricStroke[] {
    const strokes: BiometricStroke[] = [];
    let currentStroke: SignaturePoint[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i]!;

      if (i > 0) {
        const prevPoint = points[i - 1]!;
        const timeDiff = point.time - prevPoint.time;

        // New stroke if time gap is > 100ms
        if (timeDiff > 100) {
          if (currentStroke.length > 0) {
            strokes.push({
              points: currentStroke.map((p) => ({
                x: p.x,
                y: p.y,
                pressure: p.pressure || 1,
                timestamp: p.time,
              })),
              pressure: currentStroke.map((p) => p.pressure || 1),
              timestamp: currentStroke.map((p) => p.time),
            });
          }
          currentStroke = [];
        }
      }

      currentStroke.push(point);
    }

    // Add last stroke
    if (currentStroke.length > 0) {
      strokes.push({
        points: currentStroke.map((p) => ({
          x: p.x,
          y: p.y,
          pressure: p.pressure || 1,
          timestamp: p.time,
        })),
        pressure: currentStroke.map((p) => p.pressure || 1),
        timestamp: currentStroke.map((p) => p.time),
      });
    }

    return strokes;
  }

  private calculateSignatureHash(): string {
    // Simple hash based on points
    const pointsString = this.points
      .map((p) => `${p.x},${p.y},${p.time}`)
      .join('|');

    let hash = 0;
    for (let i = 0; i < pointsString.length; i++) {
      const char = pointsString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return hash.toString(36);
  }

  /**
   * Destroy the signature pad
   */
  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}

export default SignaturePad;
