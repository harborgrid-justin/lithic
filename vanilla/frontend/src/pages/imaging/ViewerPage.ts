import { ImagingService } from '../../services/ImagingService';
import { DicomViewer } from '../../components/imaging/DicomViewer';
import { MeasurementTools } from '../../components/imaging/MeasurementTools';
import { ImageAnnotations } from '../../components/imaging/ImageAnnotations';
import { CompareStudies } from '../../components/imaging/CompareStudies';

export class ViewerPage {
  private container: HTMLElement;
  private imagingService: ImagingService;
  private studyInstanceUID: string;
  private dicomViewer: DicomViewer;
  private measurementTools: MeasurementTools;
  private annotations: ImageAnnotations;
  private compareStudies?: CompareStudies;
  private currentSeriesUID?: string;
  private compareStudyUID?: string;

  constructor(container: HTMLElement, studyInstanceUID: string, params?: URLSearchParams) {
    this.container = container;
    this.imagingService = new ImagingService();
    this.studyInstanceUID = studyInstanceUID;
    this.currentSeriesUID = params?.get('series') || undefined;
    this.compareStudyUID = params?.get('compare') || undefined;

    this.dicomViewer = new DicomViewer();
    this.measurementTools = new MeasurementTools();
    this.annotations = new ImageAnnotations();

    if (this.compareStudyUID) {
      this.compareStudies = new CompareStudies();
    }
  }

  async render() {
    this.container.innerHTML = '';
    this.container.className = 'viewer-page';

    const wrapper = document.createElement('div');
    wrapper.className = 'viewer-layout';
    wrapper.innerHTML = `
      <!-- Top Toolbar -->
      <div class="viewer-toolbar">
        <div class="toolbar-left">
          <button class="btn btn-icon" data-action="back" title="Back">←</button>
          <div class="study-info">
            <span id="patient-name" class="patient-name">Loading...</span>
            <span id="study-description" class="study-description"></span>
          </div>
        </div>

        <div class="toolbar-center">
          <div class="tool-group">
            <button class="btn btn-icon ${this.activeToolClass('pan')}" data-tool="pan" title="Pan">🖐️</button>
            <button class="btn btn-icon ${this.activeToolClass('zoom')}" data-tool="zoom" title="Zoom">🔍</button>
            <button class="btn btn-icon ${this.activeToolClass('window')}" data-tool="window" title="Window/Level">🎚️</button>
            <button class="btn btn-icon ${this.activeToolClass('measure')}" data-tool="measure" title="Measure">📏</button>
            <button class="btn btn-icon ${this.activeToolClass('angle')}" data-tool="angle" title="Angle">📐</button>
            <button class="btn btn-icon ${this.activeToolClass('annotate')}" data-tool="annotate" title="Annotate">✏️</button>
          </div>

          <div class="separator"></div>

          <div class="tool-group">
            <button class="btn btn-icon" data-action="invert" title="Invert">🔄</button>
            <button class="btn btn-icon" data-action="reset" title="Reset">↺</button>
            <button class="btn btn-icon" data-action="rotate-left" title="Rotate Left">↶</button>
            <button class="btn btn-icon" data-action="rotate-right" title="Rotate Right">↷</button>
          </div>

          <div class="separator"></div>

          <div class="tool-group">
            <button class="btn btn-icon" data-action="fullscreen" title="Fullscreen">⛶</button>
            <button class="btn btn-icon" data-action="compare" title="Compare Studies">📊</button>
            <button class="btn btn-icon" data-action="layout" title="Layout">⊞</button>
          </div>
        </div>

        <div class="toolbar-right">
          <button class="btn btn-secondary" data-action="report">Create Report</button>
          <button class="btn btn-primary" data-action="save">Save</button>
        </div>
      </div>

      <!-- Main Viewer Area -->
      <div class="viewer-main">
        <!-- Series/Thumbnail Panel -->
        <div class="viewer-sidebar left">
          <div class="sidebar-header">
            <h3>Series</h3>
          </div>
          <div id="series-list" class="series-list">
            <div class="loading">Loading series...</div>
          </div>
        </div>

        <!-- Central Viewing Area -->
        <div class="viewer-content">
          ${this.compareStudyUID ? `
            <div class="viewer-grid compare-layout">
              <div class="viewport-container">
                <div class="viewport-header">Current Study</div>
                <div id="viewer-main" class="viewport"></div>
              </div>
              <div class="viewport-container">
                <div class="viewport-header">Comparison Study</div>
                <div id="viewer-compare" class="viewport"></div>
              </div>
            </div>
          ` : `
            <div id="viewer-main" class="viewport"></div>
          `}

          <!-- Image Navigation -->
          <div class="image-navigation">
            <button class="btn btn-icon" data-action="prev-image">◀</button>
            <div class="image-info">
              <span id="current-image">1</span> / <span id="total-images">1</span>
            </div>
            <button class="btn btn-icon" data-action="next-image">▶</button>
            <input type="range" id="image-slider" class="image-slider" min="1" max="1" value="1">
          </div>

          <!-- Viewport Info Overlay -->
          <div class="viewport-info">
            <div class="info-top-left">
              <div id="patient-info"></div>
              <div id="study-info"></div>
            </div>
            <div class="info-top-right">
              <div id="series-info"></div>
              <div id="image-info"></div>
            </div>
            <div class="info-bottom-left">
              <div id="window-level">W: <span id="ww">400</span> L: <span id="wc">40</span></div>
              <div id="zoom-level">Zoom: <span id="zoom">100</span>%</div>
            </div>
            <div class="info-bottom-right">
              <div id="pixel-value"></div>
            </div>
          </div>
        </div>

        <!-- Tools/Measurements Panel -->
        <div class="viewer-sidebar right">
          <div class="sidebar-tabs">
            <button class="tab-btn active" data-tab="measurements">Measurements</button>
            <button class="tab-btn" data-tab="annotations">Annotations</button>
            <button class="tab-btn" data-tab="presets">Presets</button>
          </div>

          <div class="sidebar-content">
            <div id="tab-measurements" class="tab-panel active"></div>
            <div id="tab-annotations" class="tab-panel"></div>
            <div id="tab-presets" class="tab-panel">
              ${this.renderWindowPresets()}
            </div>
          </div>
        </div>
      </div>

      <!-- Cine Controls (for multi-frame) -->
      <div class="cine-controls" style="display: none;">
        <button class="btn btn-icon" data-action="cine-play">▶️</button>
        <button class="btn btn-icon" data-action="cine-pause">⏸️</button>
        <button class="btn btn-icon" data-action="cine-stop">⏹️</button>
        <input type="range" id="cine-speed" min="1" max="60" value="30">
        <span id="cine-fps">30 fps</span>
      </div>
    `;

    this.container.appendChild(wrapper);
    await this.attachEventListeners();
    await this.loadStudyAndSeries();
    this.initializeViewer();
  }

  private activeToolClass(tool: string): string {
    return 'active'; // TODO: Track active tool state
  }

  private renderWindowPresets(): string {
    const presets = [
      { name: 'Soft Tissue', ww: 400, wc: 40 },
      { name: 'Lung', ww: 1500, wc: -600 },
      { name: 'Bone', ww: 2000, wc: 300 },
      { name: 'Brain', ww: 80, wc: 40 },
      { name: 'Liver', ww: 150, wc: 30 },
      { name: 'Abdomen', ww: 350, wc: 50 },
    ];

    return `
      <div class="presets-list">
        ${presets.map(p => `
          <button class="preset-btn" data-ww="${p.ww}" data-wc="${p.wc}">
            ${p.name}<br>
            <small>W:${p.ww} L:${p.wc}</small>
          </button>
        `).join('')}
      </div>
    `;
  }

  private async loadStudyAndSeries() {
    try {
      const study = await this.imagingService.getStudy(this.studyInstanceUID);
      const series = await this.imagingService.getStudySeries(this.studyInstanceUID);

      // Update study info in header
      const patientName = document.getElementById('patient-name');
      const studyDesc = document.getElementById('study-description');
      if (patientName) patientName.textContent = study.patientName;
      if (studyDesc) studyDesc.textContent = study.studyDescription || '';

      // Render series list
      await this.renderSeriesList(series);

      // Load first series if not specified
      if (!this.currentSeriesUID && series.length > 0) {
        this.currentSeriesUID = series[0].seriesInstanceUID;
      }

      // Load the series
      if (this.currentSeriesUID) {
        await this.loadSeries(this.currentSeriesUID);
      }
    } catch (error) {
      console.error('Error loading study:', error);
      this.showError('Failed to load study');
    }
  }

  private async renderSeriesList(series: any[]) {
    const container = document.getElementById('series-list');
    if (!container) return;

    container.innerHTML = series.map(s => `
      <div class="series-item ${s.seriesInstanceUID === this.currentSeriesUID ? 'active' : ''}"
           data-series-uid="${s.seriesInstanceUID}">
        <div class="series-thumbnail">
          <div class="series-number">${s.seriesNumber}</div>
        </div>
        <div class="series-details">
          <div class="series-desc">${s.seriesDescription || 'Unnamed'}</div>
          <div class="series-meta">
            <span class="badge badge-sm">${s.modality}</span>
            <span>${s.numberOfInstances} images</span>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.series-item').forEach(item => {
      item.addEventListener('click', () => {
        const seriesUID = item.getAttribute('data-series-uid');
        if (seriesUID) this.loadSeries(seriesUID);
      });
    });
  }

  private async loadSeries(seriesInstanceUID: string) {
    try {
      this.currentSeriesUID = seriesInstanceUID;

      const instances = await this.imagingService.getSeriesInstances(
        this.studyInstanceUID,
        seriesInstanceUID
      );

      // Update viewer with instances
      const viewerContainer = document.getElementById('viewer-main');
      if (viewerContainer) {
        await this.dicomViewer.loadSeries(viewerContainer, instances);
      }

      // Update image count
      const totalImages = document.getElementById('total-images');
      if (totalImages) totalImages.textContent = instances.length.toString();

      // Update slider
      const slider = document.getElementById('image-slider') as HTMLInputElement;
      if (slider) {
        slider.max = instances.length.toString();
        slider.value = '1';
      }
    } catch (error) {
      console.error('Error loading series:', error);
      this.showError('Failed to load series');
    }
  }

  private initializeViewer() {
    const measurementsContainer = document.getElementById('tab-measurements');
    const annotationsContainer = document.getElementById('tab-annotations');

    if (measurementsContainer) {
      this.measurementTools.render(measurementsContainer);
    }

    if (annotationsContainer) {
      this.annotations.render(annotationsContainer);
    }
  }

  private async attachEventListeners() {
    // Back button
    const backBtn = this.container.querySelector('[data-action="back"]');
    backBtn?.addEventListener('click', () => {
      window.location.href = `#/imaging/studies/${this.studyInstanceUID}`;
    });

    // Tool buttons
    this.container.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = (e.target as HTMLElement).dataset.tool;
        this.activateTool(tool!);
      });
    });

    // Action buttons
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      if (action === 'invert') this.dicomViewer.invert();
      if (action === 'reset') this.dicomViewer.reset();
      if (action === 'rotate-left') this.dicomViewer.rotate(-90);
      if (action === 'rotate-right') this.dicomViewer.rotate(90);
      if (action === 'fullscreen') this.toggleFullscreen();
      if (action === 'prev-image') this.previousImage();
      if (action === 'next-image') this.nextImage();
      if (action === 'report') this.createReport();
    });

    // Window presets
    this.container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const ww = parseInt(target.dataset.ww || '400');
        const wc = parseInt(target.dataset.wc || '40');
        this.dicomViewer.setWindowLevel(ww, wc);
      });
    });

    // Image slider
    const slider = document.getElementById('image-slider') as HTMLInputElement;
    slider?.addEventListener('input', (e) => {
      const index = parseInt((e.target as HTMLInputElement).value) - 1;
      this.dicomViewer.goToImage(index);
    });

    // Tab switching
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.target as HTMLElement).dataset.tab;
        this.switchTab(tab!);
      });
    });
  }

  private activateTool(tool: string) {
    // Deactivate all tools
    this.container.querySelectorAll('[data-tool]').forEach(btn => {
      btn.classList.remove('active');
    });

    // Activate selected tool
    const toolBtn = this.container.querySelector(`[data-tool="${tool}"]`);
    toolBtn?.classList.add('active');

    // Set tool on viewer
    this.dicomViewer.setTool(tool);
  }

  private previousImage() {
    this.dicomViewer.previousImage();
  }

  private nextImage() {
    this.dicomViewer.nextImage();
  }

  private toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  private switchTab(tabName: string) {
    // Update tab buttons
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = this.container.querySelector(`[data-tab="${tabName}"]`);
    activeBtn?.classList.add('active');

    // Update tab panels
    this.container.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`tab-${tabName}`);
    activePanel?.classList.add('active');
  }

  private createReport() {
    window.location.href = `#/imaging/reports/new?study=${this.studyInstanceUID}`;
  }

  private showError(message: string) {
    alert(message);
  }

  destroy() {
    this.dicomViewer.destroy();
    this.container.innerHTML = '';
  }
}
