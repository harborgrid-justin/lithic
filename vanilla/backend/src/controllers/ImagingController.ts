import { ImagingService } from '../services/ImagingService';
import { DicomService } from '../services/DicomService';

export interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

export class ImagingController {
  private imagingService: ImagingService;
  private dicomService: DicomService;

  constructor() {
    this.imagingService = new ImagingService();
    this.dicomService = new DicomService();
  }

  // ============================================
  // ORDER METHODS
  // ============================================

  async getOrders(filters: any) {
    return await this.imagingService.findOrders(filters);
  }

  async getOrderById(orderId: string) {
    return await this.imagingService.findOrderById(orderId);
  }

  async createOrder(orderData: any, user: User) {
    const order = {
      ...orderData,
      status: 'PENDING',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    return await this.imagingService.createOrder(order);
  }

  async updateOrder(orderId: string, updates: any, user: User) {
    const updateData = {
      ...updates,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    };
    return await this.imagingService.updateOrder(orderId, updateData);
  }

  async cancelOrder(orderId: string, user: User) {
    return await this.imagingService.updateOrder(orderId, {
      status: 'CANCELLED',
      cancelledBy: user.id,
      cancelledAt: new Date().toISOString(),
    });
  }

  async scheduleOrder(orderId: string, scheduledDateTime: string, modalityId: string, user: User) {
    return await this.imagingService.scheduleOrder(orderId, {
      scheduledDateTime,
      modalityId,
      status: 'SCHEDULED',
      scheduledBy: user.id,
    });
  }

  async startOrder(orderId: string, user: User) {
    return await this.imagingService.updateOrder(orderId, {
      status: 'IN_PROGRESS',
      startedBy: user.id,
      startedAt: new Date().toISOString(),
    });
  }

  async completeOrder(orderId: string, user: User) {
    return await this.imagingService.updateOrder(orderId, {
      status: 'COMPLETED',
      completedBy: user.id,
      completedAt: new Date().toISOString(),
    });
  }

  async getOrderHistory(orderId: string) {
    return await this.imagingService.getOrderAuditTrail(orderId);
  }

  // ============================================
  // STUDY METHODS
  // ============================================

  async searchStudies(filters: any) {
    return await this.imagingService.searchStudies(filters);
  }

  async getStudyByUID(studyInstanceUID: string) {
    return await this.imagingService.findStudyByUID(studyInstanceUID);
  }

  async createStudy(studyData: any, user: User) {
    const study = {
      ...studyData,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      readingStatus: 'UNREAD',
    };
    return await this.imagingService.createStudy(study);
  }

  async updateStudy(studyInstanceUID: string, updates: any, user: User) {
    const updateData = {
      ...updates,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    };
    return await this.imagingService.updateStudy(studyInstanceUID, updateData);
  }

  async getStudySeries(studyInstanceUID: string) {
    return await this.imagingService.getStudySeries(studyInstanceUID);
  }

  async getSeriesInstances(studyInstanceUID: string, seriesInstanceUID: string) {
    return await this.imagingService.getSeriesInstances(studyInstanceUID, seriesInstanceUID);
  }

  async getStudyMetadata(studyInstanceUID: string) {
    return await this.dicomService.getStudyMetadata(studyInstanceUID);
  }

  async compareStudies(currentStudyUID: string, compareStudyUIDs: string[]) {
    return await this.imagingService.compareStudies(currentStudyUID, compareStudyUIDs);
  }

  async getPriorStudies(studyInstanceUID: string, limit: number = 5) {
    return await this.imagingService.findPriorStudies(studyInstanceUID, limit);
  }

  async deleteStudy(studyInstanceUID: string, user: User) {
    return await this.imagingService.archiveStudy(studyInstanceUID, user.id);
  }

  async createStudyShareLink(studyInstanceUID: string, expiresIn: number, user: User) {
    return await this.imagingService.generateShareLink(studyInstanceUID, expiresIn, user.id);
  }

  // ============================================
  // REPORT METHODS
  // ============================================

  async getReports(filters: any) {
    return await this.imagingService.findReports(filters);
  }

  async getReportById(reportId: string) {
    return await this.imagingService.findReportById(reportId);
  }

  async getReportByStudyUID(studyInstanceUID: string) {
    return await this.imagingService.findReportByStudyUID(studyInstanceUID);
  }

  async createReport(reportData: any, user: User) {
    const report = {
      ...reportData,
      radiologistId: user.id,
      radiologistName: user.name,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      version: 1,
    };
    return await this.imagingService.createReport(report);
  }

  async updateReport(reportId: string, updates: any, user: User) {
    const updateData = {
      ...updates,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    };
    return await this.imagingService.updateReport(reportId, updateData);
  }

  async signReport(reportId: string, signature: string, user: User) {
    return await this.imagingService.signReport(reportId, {
      status: 'FINAL',
      signedBy: user.id,
      signedByName: user.name,
      signedAt: new Date().toISOString(),
      signature,
    });
  }

  async addReportAddendum(reportId: string, addendumText: string, reason: string, user: User) {
    return await this.imagingService.addAddendum(reportId, {
      addendumText,
      reason,
      addedBy: user.id,
      addedByName: user.name,
      addedAt: new Date().toISOString(),
    });
  }

  async correctReport(
    reportId: string,
    correctedFindings: string,
    correctedImpression: string,
    correctionReason: string,
    user: User
  ) {
    return await this.imagingService.correctReport(reportId, {
      correctedFindings,
      correctedImpression,
      correctionReason,
      correctedBy: user.id,
      correctedByName: user.name,
      correctedAt: new Date().toISOString(),
      status: 'CORRECTED',
    });
  }

  async getReportHistory(reportId: string) {
    return await this.imagingService.getReportVersionHistory(reportId);
  }

  async generateReportPDF(reportId: string) {
    return await this.imagingService.generateReportPDF(reportId);
  }

  async notifyCriticalResult(
    reportId: string,
    notifyTo: string,
    notificationMethod: string,
    user: User
  ) {
    return await this.imagingService.sendCriticalResultNotification(reportId, {
      notifyTo,
      notificationMethod,
      notifiedBy: user.id,
      notifiedAt: new Date().toISOString(),
    });
  }

  async getReportTemplates(modality?: string) {
    return await this.imagingService.getReportTemplates(modality);
  }

  async saveVoiceDictation(reportId: string, transcription: string, audioUrl: string, user: User) {
    return await this.imagingService.saveVoiceDictation(reportId, {
      transcription,
      audioUrl,
      dictatedBy: user.id,
      dictatedAt: new Date().toISOString(),
    });
  }

  // ============================================
  // WORKLIST METHODS
  // ============================================

  async getWorklist(filters: any) {
    return await this.imagingService.getWorklist(filters);
  }

  async getWorklistItem(itemId: string) {
    return await this.imagingService.findWorklistItemById(itemId);
  }

  async createWorklistItem(itemData: any, user: User) {
    const item = {
      ...itemData,
      status: 'SCHEDULED',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    return await this.imagingService.createWorklistItem(item);
  }

  async updateWorklistItem(itemId: string, updates: any, user: User) {
    const updateData = {
      ...updates,
      updatedBy: user.id,
      updatedAt: new Date().toISOString(),
    };
    return await this.imagingService.updateWorklistItem(itemId, updateData);
  }

  async startWorklistItem(itemId: string, user: User) {
    return await this.imagingService.updateWorklistItem(itemId, {
      status: 'IN_PROGRESS',
      startedBy: user.id,
      startedAt: new Date().toISOString(),
    });
  }

  async completeWorklistItem(itemId: string, completionNotes: string, user: User) {
    return await this.imagingService.updateWorklistItem(itemId, {
      status: 'COMPLETED',
      completedBy: user.id,
      completedAt: new Date().toISOString(),
      completionNotes,
    });
  }

  async cancelWorklistItem(itemId: string, reason: string, user: User) {
    return await this.imagingService.updateWorklistItem(itemId, {
      status: 'CANCELLED',
      cancelledBy: user.id,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
    });
  }

  async getTodayWorklist(modality?: string) {
    const today = new Date().toISOString().split('T')[0];
    return await this.imagingService.getWorklist({
      scheduledDate: today,
      modality,
    });
  }

  async getTechnicianWorklist(technicianId: string) {
    return await this.imagingService.getWorklist({
      technicianId,
      status: ['SCHEDULED', 'IN_PROGRESS'],
    });
  }

  async getRadiologistWorklist(radiologistId: string) {
    return await this.imagingService.getRadiologistReadingList(radiologistId);
  }

  async assignWorklistItem(
    itemId: string,
    assigneeId: string,
    assigneeType: 'TECHNICIAN' | 'RADIOLOGIST',
    user: User
  ) {
    const updateData: any = {
      assignedBy: user.id,
      assignedAt: new Date().toISOString(),
    };

    if (assigneeType === 'TECHNICIAN') {
      updateData.technicianId = assigneeId;
    } else {
      updateData.radiologistId = assigneeId;
    }

    return await this.imagingService.updateWorklistItem(itemId, updateData);
  }

  async getWorklistStats(filters: any) {
    return await this.imagingService.getWorklistStatistics(filters);
  }

  async bulkScheduleOrders(orderIds: string[], schedulingRules: any, user: User) {
    return await this.imagingService.bulkScheduleOrders(orderIds, schedulingRules, user.id);
  }
}
