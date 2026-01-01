/**
 * Barcode Scanner Component
 * Scan specimen barcodes using camera or manual entry
 */

export class BarcodeScanner {
  private container: HTMLElement;
  private onScan?: (barcode: string) => void;
  private isScanning: boolean = false;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;

  constructor(
    container: HTMLElement,
    options: { onScan?: (barcode: string) => void } = {},
  ) {
    this.container = container;
    this.onScan = options.onScan;
  }

  render(): void {
    const html = `
      <div class="barcode-scanner">
        <div class="scanner-header">
          <h3>Specimen Barcode Scanner</h3>
        </div>

        <div class="scanner-modes">
          <button type="button" class="mode-btn active" data-mode="manual">Manual Entry</button>
          <button type="button" class="mode-btn" data-mode="camera">Camera Scan</button>
        </div>

        <div class="scanner-content">
          <div class="manual-mode active" id="manualMode">
            <div class="form-group">
              <label for="barcodeInput">Enter Barcode</label>
              <input type="text" id="barcodeInput" placeholder="Scan or type barcode..." autofocus>
            </div>
            <button type="button" class="btn btn-primary" id="submitBarcode">Submit</button>
          </div>

          <div class="camera-mode" id="cameraMode">
            <div class="video-container">
              <video id="scannerVideo" autoplay playsinline></video>
              <div class="scanner-overlay">
                <div class="scanner-line"></div>
              </div>
            </div>
            <div class="camera-controls">
              <button type="button" class="btn btn-primary" id="startCamera">Start Camera</button>
              <button type="button" class="btn btn-secondary" id="stopCamera" style="display: none;">Stop Camera</button>
            </div>
            <div class="scanner-status" id="scannerStatus"></div>
          </div>
        </div>

        <div class="scanner-history">
          <h4>Recent Scans</h4>
          <div id="scanHistory" class="scan-list"></div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Mode switching
    const modeBtns = this.container.querySelectorAll(".mode-btn");
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        this.switchMode(mode || "manual");

        modeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Manual entry
    const barcodeInput = this.container.querySelector(
      "#barcodeInput",
    ) as HTMLInputElement;
    const submitBtn = this.container.querySelector("#submitBarcode");

    if (barcodeInput) {
      barcodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleManualScan(barcodeInput.value);
          barcodeInput.value = "";
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        if (barcodeInput) {
          this.handleManualScan(barcodeInput.value);
          barcodeInput.value = "";
        }
      });
    }

    // Camera controls
    const startCameraBtn = this.container.querySelector("#startCamera");
    const stopCameraBtn = this.container.querySelector("#stopCamera");

    if (startCameraBtn) {
      startCameraBtn.addEventListener("click", () => this.startCamera());
    }

    if (stopCameraBtn) {
      stopCameraBtn.addEventListener("click", () => this.stopCamera());
    }
  }

  private switchMode(mode: string): void {
    const manualMode = this.container.querySelector("#manualMode");
    const cameraMode = this.container.querySelector("#cameraMode");

    if (mode === "manual") {
      manualMode?.classList.add("active");
      cameraMode?.classList.remove("active");
      this.stopCamera();
    } else {
      manualMode?.classList.remove("active");
      cameraMode?.classList.add("active");
    }
  }

  private async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      this.video = this.container.querySelector("#scannerVideo");
      if (this.video) {
        this.video.srcObject = this.stream;
        this.isScanning = true;
      }

      // Show/hide buttons
      const startBtn = this.container.querySelector(
        "#startCamera",
      ) as HTMLElement;
      const stopBtn = this.container.querySelector(
        "#stopCamera",
      ) as HTMLElement;

      if (startBtn) startBtn.style.display = "none";
      if (stopBtn) stopBtn.style.display = "inline-block";

      this.updateStatus("Camera started. Position barcode in frame.");

      // In a real implementation, we would use a barcode detection library here
      // For now, we'll simulate barcode detection
      this.simulateBarcodeDetection();
    } catch (error) {
      console.error("Camera error:", error);
      this.updateStatus("Error accessing camera. Please check permissions.");
    }
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    this.isScanning = false;

    // Show/hide buttons
    const startBtn = this.container.querySelector(
      "#startCamera",
    ) as HTMLElement;
    const stopBtn = this.container.querySelector("#stopCamera") as HTMLElement;

    if (startBtn) startBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";

    this.updateStatus("");
  }

  private simulateBarcodeDetection(): void {
    // In a real implementation, this would use a barcode detection library
    // like ZXing or QuaggaJS to detect barcodes from the video stream
    // For demonstration, we'll show a message

    this.updateStatus(
      "Barcode scanning would be implemented using a library like ZXing or QuaggaJS",
    );
  }

  private handleManualScan(barcode: string): void {
    if (!barcode.trim()) return;

    this.addToHistory(barcode);

    if (this.onScan) {
      this.onScan(barcode);
    }
  }

  private handleCameraScan(barcode: string): void {
    this.addToHistory(barcode);
    this.updateStatus(`Barcode detected: ${barcode}`);

    if (this.onScan) {
      this.onScan(barcode);
    }

    // Auto-stop camera after successful scan
    setTimeout(() => {
      this.stopCamera();
    }, 1000);
  }

  private addToHistory(barcode: string): void {
    const historyContainer = this.container.querySelector("#scanHistory");
    if (!historyContainer) return;

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const historyItem = document.createElement("div");
    historyItem.className = "scan-item";
    historyItem.innerHTML = `
      <span class="scan-barcode">${barcode}</span>
      <span class="scan-time">${timestamp}</span>
    `;

    historyContainer.insertBefore(historyItem, historyContainer.firstChild);

    // Keep only last 10 scans
    while (historyContainer.children.length > 10) {
      historyContainer.removeChild(historyContainer.lastChild!);
    }
  }

  private updateStatus(message: string): void {
    const statusElement = this.container.querySelector("#scannerStatus");
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  destroy(): void {
    this.stopCamera();
    this.container.innerHTML = "";
  }
}
