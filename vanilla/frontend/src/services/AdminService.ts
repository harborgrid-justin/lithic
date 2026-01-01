/**
 * AdminService - Frontend service for admin API calls
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export class AdminService {
  private accessToken: string | null = null;

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  /**
   * Clear access token
   */
  clearAccessToken(): void {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: 'include', // Include cookies for refresh token
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry request with new token
        return this.request(endpoint, options);
      } else {
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // ============================================
  // Authentication
  // ============================================

  async login(email: string, password: string, mfaToken?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, mfaToken }),
    });

    const data = await response.json();

    if (data.success && data.accessToken) {
      this.setAccessToken(data.accessToken);
    }

    return data;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearAccessToken();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        this.setAccessToken(data.accessToken);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/auth/me');
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<any> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: { oldPassword, newPassword },
    });
  }

  // ============================================
  // MFA Management
  // ============================================

  async setupMFA(): Promise<any> {
    return this.request('/auth/mfa/setup', { method: 'POST' });
  }

  async enableMFA(token: string): Promise<any> {
    return this.request('/auth/mfa/enable', {
      method: 'POST',
      body: { token },
    });
  }

  async disableMFA(token: string): Promise<any> {
    return this.request('/auth/mfa/disable', {
      method: 'POST',
      body: { token },
    });
  }

  async getMFAStatus(): Promise<any> {
    return this.request('/auth/mfa/status');
  }

  async regenerateBackupCodes(): Promise<any> {
    return this.request('/auth/mfa/backup-codes/regenerate', { method: 'POST' });
  }

  // ============================================
  // User Management
  // ============================================

  async getUsers(params?: { limit?: number; offset?: number; search?: string }): Promise<any> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/admin/users${query ? '?' + query : ''}`);
  }

  async getUser(userId: string): Promise<any> {
    return this.request(`/admin/users/${userId}`);
  }

  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles?: string[];
  }): Promise<any> {
    return this.request('/admin/users', {
      method: 'POST',
      body: userData,
    });
  }

  async updateUser(userId: string, updates: any): Promise<any> {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async activateUser(userId: string): Promise<any> {
    return this.request(`/admin/users/${userId}/activate`, { method: 'POST' });
  }

  async deactivateUser(userId: string): Promise<any> {
    return this.request(`/admin/users/${userId}/deactivate`, { method: 'POST' });
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<any> {
    return this.request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: { newPassword },
    });
  }

  async terminateUserSessions(userId: string): Promise<any> {
    return this.request(`/admin/users/${userId}/sessions`, { method: 'DELETE' });
  }

  // ============================================
  // Role Management
  // ============================================

  async getRoles(): Promise<any> {
    return this.request('/admin/roles');
  }

  async assignRole(userId: string, roleName: string): Promise<any> {
    return this.request(`/admin/users/${userId}/roles`, {
      method: 'POST',
      body: { roleName },
    });
  }

  async revokeRole(userId: string, roleName: string): Promise<any> {
    return this.request(`/admin/users/${userId}/roles/${roleName}`, {
      method: 'DELETE',
    });
  }

  async getPermissions(): Promise<any> {
    return this.request('/admin/permissions');
  }

  // ============================================
  // Audit Logs
  // ============================================

  async getAuditLogs(filters?: any): Promise<any> {
    const query = new URLSearchParams(filters).toString();
    return this.request(`/admin/audit-logs${query ? '?' + query : ''}`);
  }

  async getAuditStatistics(): Promise<any> {
    return this.request('/admin/audit-logs/statistics');
  }

  async exportAuditLogs(startDate: string, endDate: string, format: 'json' | 'csv'): Promise<any> {
    const response = await fetch(`${API_BASE}/admin/audit-logs/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAccessToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({ startDate, endDate, format }),
    });

    if (format === 'csv') {
      const blob = await response.blob();
      return blob;
    }

    return response.json();
  }

  // ============================================
  // Organization Management
  // ============================================

  async getOrganization(organizationId: string): Promise<any> {
    return this.request(`/admin/organizations/${organizationId}`);
  }

  async updateOrganization(organizationId: string, updates: any): Promise<any> {
    return this.request(`/admin/organizations/${organizationId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  // ============================================
  // Statistics
  // ============================================

  async getSessionStatistics(): Promise<any> {
    return this.request('/admin/sessions/statistics');
  }

  async getMFAStatistics(): Promise<any> {
    return this.request('/admin/mfa/statistics');
  }

  // ============================================
  // Session Management
  // ============================================

  async getSessions(): Promise<any> {
    return this.request('/auth/sessions');
  }

  async terminateSession(sessionId: string): Promise<any> {
    return this.request(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  }
}

// Export singleton instance
const adminService = new AdminService();
export default adminService;
