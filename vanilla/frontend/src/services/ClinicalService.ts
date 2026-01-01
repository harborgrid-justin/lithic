// Frontend Clinical Service - API Client
const API_BASE_URL = "/api/clinical";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ClinicalService {
  // ============ Encounters ============

  static async createEncounter(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/encounters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getEncounterById(encounterId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/encounters/${encounterId}`);
    return this.handleResponse(response);
  }

  static async getEncountersByPatient(patientId: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/encounters/patient/${patientId}`,
    );
    return this.handleResponse(response);
  }

  static async getEncountersByProvider(
    providerId: string,
    status?: string,
  ): Promise<any[]> {
    const url = status
      ? `${API_BASE_URL}/encounters/provider/${providerId}?status=${status}`
      : `${API_BASE_URL}/encounters/provider/${providerId}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  static async getEncounterSummary(encounterId: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/encounters/${encounterId}/summary`,
    );
    return this.handleResponse(response);
  }

  static async updateEncounter(encounterId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/encounters/${encounterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async startEncounter(encounterId: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/encounters/${encounterId}/start`,
      {
        method: "POST",
      },
    );
    return this.handleResponse(response);
  }

  static async completeEncounter(encounterId: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/encounters/${encounterId}/complete`,
      {
        method: "POST",
      },
    );
    return this.handleResponse(response);
  }

  static async signEncounter(encounterId: string, signData: any): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/encounters/${encounterId}/sign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signData),
      },
    );
    return this.handleResponse(response);
  }

  static async getDashboardStats(providerId: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/encounters/dashboard/stats?providerId=${providerId}`,
    );
    return this.handleResponse(response);
  }

  // ============ Clinical Notes ============

  static async createNote(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getNoteById(noteId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`);
    return this.handleResponse(response);
  }

  static async getNotesByEncounter(encounterId: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/notes/encounter/${encounterId}`,
    );
    return this.handleResponse(response);
  }

  static async getNotesByPatient(patientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/notes/patient/${patientId}`);
    return this.handleResponse(response);
  }

  static async updateNote(noteId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async signNote(noteId: string, signData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signData),
    });
    return this.handleResponse(response);
  }

  static async addAddendum(noteId: string, addendumText: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/addendum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addendumText }),
    });
    return this.handleResponse(response);
  }

  static async getTemplates(type?: string): Promise<any[]> {
    const url = type
      ? `${API_BASE_URL}/notes/templates/list?type=${type}`
      : `${API_BASE_URL}/notes/templates/list`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  // ============ Vitals ============

  static async recordVitals(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/vitals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getVitalsByEncounter(encounterId: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/vitals/encounter/${encounterId}`,
    );
    return this.handleResponse(response);
  }

  static async getVitalsByPatient(
    patientId: string,
    limit?: number,
  ): Promise<any[]> {
    const url = limit
      ? `${API_BASE_URL}/vitals/patient/${patientId}?limit=${limit}`
      : `${API_BASE_URL}/vitals/patient/${patientId}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  // ============ Problems ============

  static async createProblem(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/problems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getProblemsByPatient(
    patientId: string,
    activeOnly = true,
  ): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/problems/patient/${patientId}?activeOnly=${activeOnly}`,
    );
    return this.handleResponse(response);
  }

  static async updateProblem(problemId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/problems/${problemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // ============ Allergies ============

  static async createAllergy(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/allergies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getAllergiesByPatient(
    patientId: string,
    activeOnly = true,
  ): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/allergies/patient/${patientId}?activeOnly=${activeOnly}`,
    );
    return this.handleResponse(response);
  }

  static async updateAllergy(allergyId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/allergies/${allergyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // ============ Medications ============

  static async createMedication(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/medications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getMedicationsByPatient(
    patientId: string,
    activeOnly = true,
  ): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/medications/patient/${patientId}?activeOnly=${activeOnly}`,
    );
    return this.handleResponse(response);
  }

  static async updateMedication(medicationId: string, data: any): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/medications/${medicationId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  // ============ Orders ============

  static async createOrder(data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async getOrdersByEncounter(encounterId: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/orders/encounter/${encounterId}`,
    );
    return this.handleResponse(response);
  }

  static async getOrdersByPatient(patientId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/orders/patient/${patientId}`);
    return this.handleResponse(response);
  }

  static async updateOrder(orderId: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async signOrder(orderId: string, signData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signData),
    });
    return this.handleResponse(response);
  }

  // ============ Code Searches ============

  static async searchICD10(query: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/problems/icd10/search?query=${encodeURIComponent(query)}`,
    );
    return this.handleResponse(response);
  }

  static async searchCPT(query: string): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/orders/cpt/search?query=${encodeURIComponent(query)}`,
    );
    return this.handleResponse(response);
  }

  // ============ Helper Methods ============

  private static async handleResponse<T>(response: Response): Promise<T> {
    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "An error occurred");
    }

    return result.data as T;
  }
}

export default ClinicalService;
