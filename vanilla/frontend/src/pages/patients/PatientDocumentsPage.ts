/**
 * PatientDocumentsPage - Manage patient documents
 */

import PatientService from '../../services/PatientService';
import { Patient, Document } from '../../types/Patient';

export class PatientDocumentsPage {
  private patientId: string;
  private patient: Patient | null = null;
  private documents: Document[] = [];

  constructor(patientId: string) {
    this.patientId = patientId;
    this.loadPatient();
  }

  /**
   * Load patient data
   */
  private async loadPatient(): Promise<void> {
    try {
      const response = await PatientService.getPatientById(this.patientId);

      if (response.success && response.data) {
        this.patient = response.data;
        this.documents = this.patient.documents || [];
        this.initializePage();
      } else {
        throw new Error(response.error || 'Patient not found');
      }
    } catch (error) {
      console.error('Failed to load patient:', error);
      alert('Failed to load patient. Please try again.');
      window.location.href = '/patients';
    }
  }

  /**
   * Initialize page structure
   */
  private initializePage(): void {
    if (!this.patient) return;

    document.body.innerHTML = `
      <div class="documents-page">
        <header class="page-header">
          <div class="header-left">
            <button class="btn-back" id="backBtn">← Back to Patient</button>
            <h1>Documents - ${this.patient.firstName} ${this.patient.lastName}</h1>
          </div>
          <div class="header-actions">
            <button class="btn-primary" id="uploadBtn">+ Upload Document</button>
          </div>
        </header>

        <div class="page-content">
          <div id="documentsContainer"></div>
          <div id="uploadModal" class="modal" style="display: none;">
            <div class="modal-content">
              <h3>Upload Document</h3>
              <form id="uploadForm">
                <div class="form-group">
                  <label for="docType">Document Type *</label>
                  <select id="docType" name="type" required>
                    <option value="">Select type...</option>
                    <option value="consent">Consent Form</option>
                    <option value="insurance_card">Insurance Card</option>
                    <option value="id">ID Document</option>
                    <option value="medical_records">Medical Records</option>
                    <option value="lab_results">Lab Results</option>
                    <option value="imaging">Imaging</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="docName">Document Name *</label>
                  <input type="text" id="docName" name="name" required>
                </div>

                <div class="form-group">
                  <label for="docDescription">Description</label>
                  <textarea id="docDescription" name="description" rows="3"></textarea>
                </div>

                <div class="form-group">
                  <label for="docFile">File *</label>
                  <input type="file" id="docFile" name="file" required>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn-primary">Upload</button>
                  <button type="button" class="btn-secondary" id="cancelUpload">Cancel</button>
                </div>

                <div class="form-message" id="uploadMessage"></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderDocuments();
    this.attachEventListeners();
  }

  /**
   * Render documents list
   */
  private renderDocuments(): void {
    const container = document.getElementById('documentsContainer');
    if (!container) return;

    if (this.documents.length === 0) {
      container.innerHTML = `
        <div class="no-documents">
          <p>No documents uploaded yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="documents-grid">
        ${this.documents.map(doc => this.renderDocumentCard(doc)).join('')}
      </div>
    `;
  }

  /**
   * Render a single document card
   */
  private renderDocumentCard(doc: Document): string {
    const uploadDate = new Date(doc.uploadedAt).toLocaleDateString();
    const fileSize = this.formatFileSize(doc.size);
    const icon = this.getDocumentIcon(doc.type);

    return `
      <div class="document-card">
        <div class="doc-icon">${icon}</div>
        <div class="doc-info">
          <h4>${doc.name}</h4>
          <p class="doc-type">${doc.type.replace(/_/g, ' ')}</p>
          ${doc.description ? `<p class="doc-description">${doc.description}</p>` : ''}
          <div class="doc-meta">
            <span>Uploaded: ${uploadDate}</span>
            <span>Size: ${fileSize}</span>
            <span>By: ${doc.uploadedBy}</span>
          </div>
          <div class="doc-security">
            <span class="encryption-badge ${doc.encryptionStatus}">
              ${doc.encryptionStatus === 'encrypted' ? '🔒 Encrypted' : '🔓 Not Encrypted'}
            </span>
          </div>
        </div>
        <div class="doc-actions">
          <button class="btn-view" data-url="${doc.fileUrl}">View</button>
          <button class="btn-download" data-url="${doc.fileUrl}">Download</button>
        </div>
      </div>
    `;
  }

  /**
   * Get document icon based on type
   */
  private getDocumentIcon(type: Document['type']): string {
    const icons: Record<string, string> = {
      consent: '📝',
      insurance_card: '💳',
      id: '🪪',
      medical_records: '📋',
      lab_results: '🧪',
      imaging: '🔬',
      other: '📄',
    };
    return icons[type] || '📄';
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const backBtn = document.getElementById('backBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const cancelUpload = document.getElementById('cancelUpload');
    const uploadForm = document.getElementById('uploadForm');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = `/patients/${this.patientId}`;
      });
    }

    if (uploadBtn && uploadModal) {
      uploadBtn.addEventListener('click', () => {
        uploadModal.style.display = 'flex';
      });
    }

    if (cancelUpload && uploadModal) {
      cancelUpload.addEventListener('click', () => {
        uploadModal.style.display = 'none';
      });
    }

    if (uploadForm) {
      uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleUpload();
      });
    }

    // Attach view/download handlers
    const viewButtons = document.querySelectorAll('.btn-view');
    const downloadButtons = document.querySelectorAll('.btn-download');

    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = (e.target as HTMLElement).getAttribute('data-url');
        if (url) window.open(url, '_blank');
      });
    });

    downloadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = (e.target as HTMLElement).getAttribute('data-url');
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = '';
          a.click();
        }
      });
    });
  }

  /**
   * Handle document upload
   */
  private async handleUpload(): Promise<void> {
    const form = document.getElementById('uploadForm') as HTMLFormElement;
    const formData = new FormData(form);
    const messageEl = document.getElementById('uploadMessage');
    const modal = document.getElementById('uploadModal');

    if (!messageEl) return;

    try {
      messageEl.className = 'form-message loading';
      messageEl.textContent = 'Uploading document...';

      // In a real application, you would upload the file to a server
      // For now, we'll simulate the upload
      const file = (formData.get('file') as File);
      const documentData = {
        type: formData.get('type') as Document['type'],
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        fileUrl: URL.createObjectURL(file), // Simulated URL
        mimeType: file.type,
        size: file.size,
        uploadedBy: 'current-user',
        encryptionStatus: 'encrypted' as const,
      };

      const response = await PatientService.addDocument(this.patientId, documentData);

      if (response.success && response.data) {
        messageEl.className = 'form-message success';
        messageEl.textContent = 'Document uploaded successfully';

        // Update local documents list
        this.documents = response.data.documents || [];

        // Close modal and refresh
        setTimeout(() => {
          if (modal) modal.style.display = 'none';
          form.reset();
          this.renderDocuments();
        }, 1500);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      messageEl.className = 'form-message error';
      messageEl.textContent = error instanceof Error ? error.message : 'Upload failed';
    }
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  const pathParts = window.location.pathname.split('/');
  const patientId = pathParts[2];

  if (patientId) {
    new PatientDocumentsPage(patientId);
  }
});
