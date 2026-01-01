/**
 * DICOM Service
 * Handles DICOM operations, PACS integration, and image processing
 */

export interface DicomTag {
  tag: string;
  vr: string;
  value: any;
  name: string;
}

export interface DicomMetadata {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  patientName: string;
  patientID: string;
  patientBirthDate: string;
  patientSex: string;
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  seriesDescription: string;
  modality: string;
  manufacturerModelName?: string;
  institutionName?: string;
  stationName?: string;
  bodyPartExamined?: string;
  rows: number;
  columns: number;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  pixelRepresentation: number;
  photometricInterpretation: string;
  samplesPerPixel: number;
  windowCenter?: number | number[];
  windowWidth?: number | number[];
  rescaleIntercept?: number;
  rescaleSlope?: number;
  instanceNumber: number;
  numberOfFrames?: number;
  frameRate?: number;
  sliceThickness?: number;
  sliceLocation?: number;
  imagePositionPatient?: number[];
  imageOrientationPatient?: number[];
  pixelSpacing?: number[];
  kvp?: number;
  exposure?: number;
  exposureTime?: number;
  xRayTubeCurrent?: number;
  [key: string]: any;
}

export interface ViewportSettings {
  windowCenter: number;
  windowWidth: number;
  invert: boolean;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  zoom: number;
  pan: { x: number; y: number };
  colormap?: string;
}

export interface MeasurementData {
  type:
    | "length"
    | "area"
    | "angle"
    | "rectangle"
    | "ellipse"
    | "point"
    | "arrow";
  coordinates: number[][];
  value?: number;
  unit?: string;
  text?: string;
}

export interface AnnotationData {
  type: "arrow" | "text" | "freehand" | "rectangle" | "circle" | "polygon";
  coordinates: number[][];
  text?: string;
  color: string;
  thickness: number;
}

export interface PACSConfiguration {
  aeTitle: string;
  host: string;
  port: number;
  protocol: "DICOM" | "DICOMweb";
  qidoUrl?: string;
  wadoUrl?: string;
  stowUrl?: string;
  username?: string;
  password?: string;
  enabled: boolean;
}

export interface DicomNode {
  aeTitle: string;
  host: string;
  port: number;
  description: string;
}

class DicomService {
  private baseUrl = "/api/imaging/dicom";
  private pacsConfig: PACSConfiguration | null = null;

  // PACS Configuration
  async getPACSConfiguration(): Promise<PACSConfiguration> {
    const response = await fetch(`${this.baseUrl}/config`);
    if (!response.ok) throw new Error("Failed to fetch PACS configuration");
    this.pacsConfig = await response.json();
    return this.pacsConfig;
  }

  async updatePACSConfiguration(
    config: Partial<PACSConfiguration>,
  ): Promise<PACSConfiguration> {
    const response = await fetch(`${this.baseUrl}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error("Failed to update PACS configuration");
    this.pacsConfig = await response.json();
    return this.pacsConfig;
  }

  async testPACSConnection(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/test-connection`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to test PACS connection");
    return response.json();
  }

  // DICOM Queries (C-FIND / QIDO-RS)
  async findStudies(params: {
    patientID?: string;
    patientName?: string;
    accessionNumber?: string;
    studyDate?: string;
    modality?: string;
  }): Promise<DicomMetadata[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}/find/studies?${queryParams}`);
    if (!response.ok) throw new Error("Failed to query studies");
    return response.json();
  }

  async findSeries(studyInstanceUID: string): Promise<DicomMetadata[]> {
    const response = await fetch(
      `${this.baseUrl}/find/series?studyInstanceUID=${studyInstanceUID}`,
    );
    if (!response.ok) throw new Error("Failed to query series");
    return response.json();
  }

  async findInstances(
    studyInstanceUID: string,
    seriesInstanceUID: string,
  ): Promise<DicomMetadata[]> {
    const response = await fetch(
      `${this.baseUrl}/find/instances?studyInstanceUID=${studyInstanceUID}&seriesInstanceUID=${seriesInstanceUID}`,
    );
    if (!response.ok) throw new Error("Failed to query instances");
    return response.json();
  }

  // DICOM Retrieve (C-MOVE / WADO-RS)
  async retrieveStudy(
    studyInstanceUID: string,
    destination?: string,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/retrieve/study`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyInstanceUID, destination }),
    });
    if (!response.ok) throw new Error("Failed to retrieve study");
  }

  async retrieveSeries(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    destination?: string,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/retrieve/series`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studyInstanceUID,
        seriesInstanceUID,
        destination,
      }),
    });
    if (!response.ok) throw new Error("Failed to retrieve series");
  }

  // WADO-URI / WADO-RS (Web Access to DICOM Objects)
  getImageUrl(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
    frame?: number,
  ): string {
    const params = new URLSearchParams({
      studyInstanceUID,
      seriesInstanceUID,
      sopInstanceUID,
    });
    if (frame !== undefined) params.append("frame", frame.toString());
    return `${this.baseUrl}/wado?${params}`;
  }

  getThumbnailUrl(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
    size: number = 200,
  ): string {
    const params = new URLSearchParams({
      studyInstanceUID,
      seriesInstanceUID,
      sopInstanceUID,
      size: size.toString(),
    });
    return `${this.baseUrl}/thumbnail?${params}`;
  }

  // DICOM Metadata
  async getMetadata(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
  ): Promise<DicomMetadata> {
    const response = await fetch(
      `${this.baseUrl}/metadata?studyInstanceUID=${studyInstanceUID}&seriesInstanceUID=${seriesInstanceUID}&sopInstanceUID=${sopInstanceUID}`,
    );
    if (!response.ok) throw new Error("Failed to fetch DICOM metadata");
    return response.json();
  }

  async getDicomTags(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
  ): Promise<DicomTag[]> {
    const response = await fetch(
      `${this.baseUrl}/tags?studyInstanceUID=${studyInstanceUID}&seriesInstanceUID=${seriesInstanceUID}&sopInstanceUID=${sopInstanceUID}`,
    );
    if (!response.ok) throw new Error("Failed to fetch DICOM tags");
    return response.json();
  }

  // DICOM Store (C-STORE / STOW-RS)
  async storeInstance(file: File, studyInstanceUID?: string): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    if (studyInstanceUID) formData.append("studyInstanceUID", studyInstanceUID);

    const response = await fetch(`${this.baseUrl}/store`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to store DICOM instance");
  }

  async storeMultiple(files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(`${this.baseUrl}/store/multiple`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to store DICOM instances");
  }

  // Image Processing
  applyWindowLevel(
    imageData: ImageData,
    windowCenter: number,
    windowWidth: number,
    rescaleSlope: number = 1,
    rescaleIntercept: number = 0,
  ): ImageData {
    const data = imageData.data;
    const windowMin = windowCenter - windowWidth / 2;
    const windowMax = windowCenter + windowWidth / 2;

    for (let i = 0; i < data.length; i += 4) {
      const pixelValue = data[i] * rescaleSlope + rescaleIntercept;
      let displayValue = 0;

      if (pixelValue <= windowMin) {
        displayValue = 0;
      } else if (pixelValue >= windowMax) {
        displayValue = 255;
      } else {
        displayValue = ((pixelValue - windowMin) / windowWidth) * 255;
      }

      data[i] = displayValue; // R
      data[i + 1] = displayValue; // G
      data[i + 2] = displayValue; // B
      // Alpha channel (i+3) remains unchanged
    }

    return imageData;
  }

  invertImage(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]; // R
      data[i + 1] = 255 - data[i + 1]; // G
      data[i + 2] = 255 - data[i + 2]; // B
    }
    return imageData;
  }

  // Measurement Utilities
  calculateDistance(
    point1: number[],
    point2: number[],
    pixelSpacing?: number[],
  ): number {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    const pixels = Math.sqrt(dx * dx + dy * dy);

    if (pixelSpacing && pixelSpacing.length >= 2) {
      // Convert to mm
      const mmX = dx * pixelSpacing[0];
      const mmY = dy * pixelSpacing[1];
      return Math.sqrt(mmX * mmX + mmY * mmY);
    }

    return pixels;
  }

  calculateArea(points: number[][], pixelSpacing?: number[]): number {
    if (points.length < 3) return 0;

    // Shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i][0] * points[j][1];
      area -= points[j][0] * points[i][1];
    }
    area = Math.abs(area / 2);

    if (pixelSpacing && pixelSpacing.length >= 2) {
      // Convert to mm²
      area = area * pixelSpacing[0] * pixelSpacing[1];
    }

    return area;
  }

  calculateAngle(point1: number[], vertex: number[], point2: number[]): number {
    const vector1 = [point1[0] - vertex[0], point1[1] - vertex[1]];
    const vector2 = [point2[0] - vertex[0], point2[1] - vertex[1]];

    const dot = vector1[0] * vector2[0] + vector1[1] * vector2[1];
    const mag1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2);
    const mag2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2);

    const angle = Math.acos(dot / (mag1 * mag2));
    return (angle * 180) / Math.PI; // Convert to degrees
  }

  // Hounsfield Units (for CT)
  calculateHU(
    pixelValue: number,
    rescaleSlope: number,
    rescaleIntercept: number,
  ): number {
    return pixelValue * rescaleSlope + rescaleIntercept;
  }

  // SUV Calculation (for PET)
  calculateSUV(
    pixelValue: number,
    patientWeight: number,
    injectedDose: number,
    scanTime: string,
    injectionTime: string,
    halfLife: number = 6586.2, // F-18 half-life in seconds
  ): number {
    const scanDateTime = new Date(scanTime).getTime();
    const injectionDateTime = new Date(injectionTime).getTime();
    const elapsedTime = (scanDateTime - injectionDateTime) / 1000; // in seconds

    // Decay correction
    const decayedDose =
      injectedDose * Math.exp((-Math.LN2 * elapsedTime) / halfLife);

    // SUV = (activity concentration * patient weight) / injected dose
    return (pixelValue * patientWeight * 1000) / decayedDose;
  }

  // Presets for common window/level settings
  getWindowLevelPresets(modality: string): {
    [key: string]: { center: number; width: number };
  } {
    const presets: { [key: string]: any } = {
      CT: {
        "Soft Tissue": { center: 40, width: 400 },
        Lung: { center: -600, width: 1500 },
        Liver: { center: 80, width: 150 },
        Bone: { center: 400, width: 1800 },
        Brain: { center: 40, width: 80 },
        Subdural: { center: 75, width: 150 },
        Stroke: { center: 35, width: 40 },
        "Temporal Bone": { center: 600, width: 2800 },
        "C-Spine": { center: 40, width: 400 },
      },
      MR: {
        Default: { center: 128, width: 256 },
      },
      CR: {
        Default: { center: 2048, width: 4096 },
      },
      DX: {
        Default: { center: 2048, width: 4096 },
      },
    };

    return presets[modality] || { Default: { center: 128, width: 256 } };
  }

  // DICOM Print (Basic Grayscale Print Management)
  async printStudy(
    studyInstanceUID: string,
    printer: DicomNode,
    copies: number = 1,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyInstanceUID, printer, copies }),
    });
    if (!response.ok) throw new Error("Failed to print study");
  }

  // Export
  async exportStudy(
    studyInstanceUID: string,
    format: "DICOM" | "JPEG" | "PNG" | "NIfTI",
  ): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/export?studyInstanceUID=${studyInstanceUID}&format=${format}`,
    );
    if (!response.ok) throw new Error("Failed to export study");
    return response.blob();
  }

  // Anonymization
  async anonymizeStudy(
    studyInstanceUID: string,
    options?: {
      keepPatientAge?: boolean;
      keepPatientSex?: boolean;
      keepStudyDate?: boolean;
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/anonymize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyInstanceUID, options }),
    });
    if (!response.ok) throw new Error("Failed to anonymize study");
    const result = await response.json();
    return result.newStudyInstanceUID;
  }

  // Worklist (Modality Worklist - C-FIND)
  async getModalityWorklist(params: {
    scheduledDate?: string;
    modality?: string;
    scheduledStationAETitle?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}/worklist?${queryParams}`);
    if (!response.ok) throw new Error("Failed to fetch modality worklist");
    return response.json();
  }

  // MPPS (Modality Performed Procedure Step)
  async sendMPPS(data: {
    studyInstanceUID: string;
    status: "IN_PROGRESS" | "COMPLETED" | "DISCONTINUED";
    performedProcedureStepStartDate?: string;
    performedProcedureStepStartTime?: string;
    performedProcedureStepEndDate?: string;
    performedProcedureStepEndTime?: string;
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/mpps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to send MPPS");
  }
}

export const dicomService = new DicomService();
export default dicomService;
