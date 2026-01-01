/**
 * Specimens Page
 * Track and manage laboratory specimens
 */

import { labService } from "../../services/LaboratoryService";
import { BarcodeScanner } from "../../components/laboratory/BarcodeScanner";
import { SpecimenTracker } from "../../components/laboratory/SpecimenTracker";

export class SpecimensPage {
  private container: HTMLElement;
  private barcodeScanner: BarcodeScanner | null = null;
  private specimenTracker: SpecimenTracker | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async render(): Promise<void> {
    const html = `
      <div class="specimens-page">
        <div class="page-header">
          <h1>Specimen Tracking</h1>
        </div>

        <div class="specimens-content">
          <div class="scanner-section">
            <h2>Scan Specimen</h2>
            <div id="scannerContainer"></div>
          </div>

          <div class="specimen-detail-section">
            <h2>Specimen Details</h2>
            <div id="specimenDetailContainer">
              <p class="no-specimen">Scan a barcode to view specimen details</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.initializeScanner();
  }

  private initializeScanner(): void {
    const scannerContainer = this.container.querySelector("#scannerContainer");
    if (scannerContainer) {
      this.barcodeScanner = new BarcodeScanner(
        scannerContainer as HTMLElement,
        {
          onScan: (barcode) => this.handleScan(barcode),
        },
      );
      this.barcodeScanner.render();
    }
  }

  private async handleScan(barcode: string): Promise<void> {
    try {
      const specimen = await labService.getSpecimenByBarcode(barcode);
      const trackingHistory = await labService.getTrackingHistory(specimen.id);

      const detailContainer = this.container.querySelector(
        "#specimenDetailContainer",
      );
      if (detailContainer) {
        this.specimenTracker = new SpecimenTracker(
          detailContainer as HTMLElement,
        );
        this.specimenTracker.setSpecimen(specimen, trackingHistory);
      }
    } catch (error) {
      console.error("Error loading specimen:", error);
      alert("Specimen not found or error loading data");
    }
  }

  destroy(): void {
    if (this.barcodeScanner) {
      this.barcodeScanner.destroy();
    }
    if (this.specimenTracker) {
      this.specimenTracker.destroy();
    }
    this.container.innerHTML = "";
  }
}
