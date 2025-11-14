import axios, { AxiosInstance, AxiosError } from 'axios';

// ================================
// AXIOS INSTANCE CONFIGURATION
// ================================

const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// ================================
// REQUEST INTERCEPTOR
// ================================

apiClient.interceptors.request.use(
  (config) => {
    // Get Bearer token from localStorage
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Get CSRF token from localStorage
    const csrfToken = localStorage.getItem('csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ================================
// RESPONSE INTERCEPTOR
// ================================

apiClient.interceptors.response.use(
  (response) => {
    // Store CSRF token if provided in response
    if (response.data?.csrf_token) {
      localStorage.setItem('csrf_token', response.data.csrf_token);
    }

    // Store auth token if provided in response
    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('csrf_token');
      localStorage.removeItem('user_data');
      
      // Redirect to login
      window.location.href = '/login';
    }

    // Handle 403 Forbidden - Admin status issue
    if (error.response?.status === 403) {
      console.error('Access Forbidden:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// ================================
// HOME SERVICE
// ================================

export const homeService = {
  async getHome() {
    return apiClient.get('/');
  }
};

// ================================
// CSRF SERVICE
// ================================

export const csrfService = {
  async getCsrfToken() {
    return apiClient.get('/csrf-token');
  }
};

// ================================
// AUTH SERVICE
// ================================

export const authService = {
  async login(credentials: { login_identifier: string; password: string; remember?: boolean }) {
    const response = await apiClient.post('/auth/login', credentials);
    
    // Store token and user data
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    if (response.data.csrf_token) {
      localStorage.setItem('csrf_token', response.data.csrf_token);
    }
    if (response.data.user) {
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout', {});
    
    // Clear all stored data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('user_data');
    
    return response;
  },

  async registerStart(data: { email: string; phone: string }) {
    return apiClient.post('/auth/register/start', data);
  },

  async registerVerifyOtp(data: { email: string; otp_code: string }) {
    const response = await apiClient.post('/auth/register/verify', data);
    
    if (response.data.csrf_token) {
      localStorage.setItem('csrf_token', response.data.csrf_token);
    }
    
    return response;
  },

  async register(data: { email: string; password: string; password_confirmation: string }) {
    const response = await apiClient.post('/auth/register', data);
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  async passwordResetRequest(email: string) {
    return apiClient.post('/auth/password-reset/request', { email });
  },

  async passwordResetVerify(data: { email: string; token: string; otp_code: string }) {
    return apiClient.post('/auth/password-reset/verify', data);
  },

  async passwordResetConfirm(data: { email: string; token: string; password: string; password_confirmation: string }) {
    return apiClient.post('/auth/password-reset/confirm', data);
  }
};

// ================================
// REPORT SERVICE
// ================================

export const reportService = {
  async createReport(formData: FormData) {
    return apiClient.post('/lapor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  async searchReports(searchTerm: string) {
    return apiClient.post('/lacak', { search_id: searchTerm });
  },

  async getReportDetail(reportId: string | number) {
    return apiClient.post(`/lacak/${reportId}`, {});
  }
};

// ================================
// ADMIN DASHBOARD SERVICE
// ================================

export const adminDashboardService = {
  async getStats() {
    return apiClient.post('/admin/dashboard', {});
  },

  async filterReports(filters: {
    search_term?: string;
    search_location?: string;
    search_priority?: string;
    search_admin?: string;
    search_id?: string;
    sort?: string;
  }) {
    return apiClient.post('/admin/dashboard', filters);
  }
};

// ================================
// ADMIN ANALYTICS SERVICE
// ================================

export const adminAnalyticsService = {
  async getAnalytics(filters: {
    date_start?: string;
    date_end?: string;
    category?: string;
    status?: string;
    service_code?: string;
    assignee_admin_id?: string;
    priority?: string;
    location?: string;
  } = {}) {
    return apiClient.post('/admin/analytics', filters);
  },

  async filterAnalytics(filters: object) {
    return apiClient.post('/admin/analytics', filters);
  },

  async exportAnalytics(format: 'csv' | 'xlsx', filters: object) {
    return apiClient.post('/admin/analytics/export-reports', {
      format,
      ...filters
    }, {
      responseType: 'blob'
    });
  }
};

// ================================
// ADMIN PROFILE SERVICE
// ================================

export const adminProfileService = {
  async getProfile() {
    return apiClient.post('/admin/profile', {});
  },

  async updateProfile(data: {
    full_name?: string;
    email?: string;
    phone?: string;
    profile_picture?: File;
  }) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    
    return apiClient.post('/admin/profile/update-info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return apiClient.post('/admin/profile/update-password', data);
  },

  async changeContact(data: {
    email?: string;
    phone?: string;
  }) {
    return apiClient.post('/admin/profile/request-email-change', data);
  }
};

// ================================
// ADMIN MANAGE SERVICE
// ================================

export const adminManageService = {
  async listAdmins(filters?: object) {
    return apiClient.post('/admin/manage', filters || {});
  },

  async createAdmin(data: {
    full_name: string;
    email: string;
    phone: string;
    nip?: string;
    service_code?: string;
  }) {
    return apiClient.post('/admin/manage', data);
  },

  async updateAdmin(id: string | number, data: object) {
    return apiClient.put(`/admin/manage/${id}`, data);
  },

  async deleteAdmin(id: string | number) {
    return apiClient.delete(`/admin/manage/${id}`);
  },

  async toggleAdminStatus(id: string | number) {
    return apiClient.post(`/admin/manage/${id}/toggle-status`, {});
  },

  async resetAdminPassword(id: string | number) {
    return apiClient.post(`/admin/manage/${id}/reset-password`, {});
  }
};

// ================================
// ADMIN PERFORMANCE SERVICE
// ================================

export const adminPerformanceService = {
  async getPerformance(filters?: object) {
    return apiClient.post('/admin/performance', filters || {});
  },

  async exportPerformance(format: 'csv' | 'xlsx', filters?: object) {
    return apiClient.post('/admin/performance/export', {
      format,
      ...filters
    }, {
      responseType: 'blob'
    });
  }
};

export default apiClient;
