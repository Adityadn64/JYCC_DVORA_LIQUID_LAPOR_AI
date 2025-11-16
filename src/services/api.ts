import { AuthUser, ResponseData } from '@/types';
import axios from 'axios';
import type { AxiosResponse, AxiosInstance, AxiosError } from 'axios';

// ================================
// ENCRYPTION KEYS
// ================================

const K1 = process.env.K1 || '^UAFU!Tce1$P^jX$2xdfF6s6t0x7Wtlv'; // K1: React->Express (encrypt)
const K4 = process.env.K4 || 'Kg6$F5ptNZ2%qcRGav!QhZr*LXLpO6Zr'; // K4: Express->React (decrypt)

// ================================
// AXIOS INSTANCE CONFIGURATION
// ================================

const DEFAULT_SERVER_API_URL: string = process.env.NEXT_PUBLIC_DEFAULT_SERVER_API_URL || "http://localhost:3001";
const SERVER_API_URLS: string[] = JSON.parse(
  process.env.NEXT_PUBLIC_SERVER_API_URLS || `["${DEFAULT_SERVER_API_URL}"]`
);

const searchBaseURL = async () => {
  for (const url of SERVER_API_URLS) {
    try {
      const response = await axios.get(url);
      if (response.status === 200) {
        return url;
      }
    } catch (error) {
      continue;
    }
  }

  return DEFAULT_SERVER_API_URL;
}

// ================================
// CSRF TOKEN UTILITIES
// ================================

const getCsrfTokenFromCookie = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: `${DEFAULT_SERVER_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
  },
  withCredentials: true
});

// ================================
// ENCRYPTION/DECRYPTION UTILITIES
// ================================

const normalizeKey = (key: string): Uint8Array => {
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(key);

  if (keyBytes.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(keyBytes);
    padded.fill(0x20, keyBytes.length); // pad with space (0x20)
    keyBytes = padded;
  } else if (keyBytes.length > 32) {
    keyBytes = keyBytes.slice(0, 32);
  }
  return keyBytes;
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes.buffer;
};

const cleanBase64 = (s: string): string => {
  if (!s) return s;
  s = s.replace(/\s+/g, '');
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  return s;
};

export const aesEncrypt = async (text: string, key: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const keyBytes = normalizeKey(key);

  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes as BufferSource, 'AES-CBC', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, data);

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  return bufferToBase64(result.buffer);
};

export const aesDecrypt = async (encrypted: string, key: string): Promise<string> => {
  try {
    const cleaned = cleanBase64(encrypted);
    const combined = new Uint8Array(base64ToBuffer(cleaned));
    if (combined.length < 17) throw new Error('combined data too short');
    const iv = combined.slice(0, 16);
    const ciphertext = combined.slice(16);
    if (ciphertext.length % 16 !== 0) throw new Error('ciphertext length not multiple of 16 (possible base64 corruption)');

    const keyBytes = normalizeKey(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes as BufferSource, 'AES-CBC', false, ['decrypt']);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err: any) {
    console.error('AES Decrypt error:', err.name ?? err, err.message ?? err);
    throw err;
  }
};

const encodePayloadToExpress = async (data: any): Promise<string> => {
  try {
    const jsonString = JSON.stringify(data);
    return await aesEncrypt(jsonString, K1);
  } catch (error) {
    console.error("Gagal men-encode payload ke Express:", error);
    throw error;
  }
};

const decodePayloadFromExpress = async <T>(encodedPayload: string): Promise<T | null> => {
  try {
    const decrypted = await aesDecrypt(encodedPayload, K4);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("Gagal men-decode payload dari Express:", error);
    return null;
  }
};

export const decodeErrorResponse = async (error: any): Promise<string> => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const encodedData = error.response.data as { d: string };
    if (encodedData.d) {
      try {
        const decodedPayload = await decodePayloadFromExpress<{ message: string; errors?: any }>(
          encodedData.d
        );

        if (decodedPayload?.errors) {
          const firstErrorKey = Object.keys(decodedPayload.errors)[0];
          const firstErrorMessage = decodedPayload.errors[firstErrorKey][0];
          return firstErrorMessage;
        }

        if (decodedPayload?.message) {
          return decodedPayload.message;
        }
      } catch (decodeError) {
        console.error("Gagal decode error response:", decodeError);
      }
    }
  }

  return "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";
};

// ================================
// REQUEST INTERCEPTOR
// ================================

apiClient.interceptors.request.use(
  async (config) => {
    // Get Bearer token from localStorage
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }

    // Attach CSRF token from cookies
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // Encrypt request data if it's a POST/PUT/PATCH request with data
    if (config.data && ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
      const encrypted = await encodePayloadToExpress(config.data);
      config.data = { d: encrypted };
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
  async (response) => {
    console.log({apiClientResponse: response});
    if (response.data && response.data.d) {
      try {
        const decrypted = await decodePayloadFromExpress<any>(response.data.d);
        
        // Store auth token if provided
        if (decrypted?.data?.token && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', decrypted.data.token);
        }

        // Store user data if provided
        if (decrypted?.data?.user && typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(decrypted.data.user));
        }

        // Replace response data with decrypted data
        response.data = decrypted || response.data;
      } catch (error) {
        console.error('Failed to decrypt response:', error);
      }
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
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
    const response = await apiClient.post('/home');
    return response;
  }
};

// ================================
// CSRF SERVICE
// ================================

export const csrfService = {
  async getCsrfToken() {
    const response = await apiClient.get('/csrf-cookie');
    return response;
  },

  getCurrentToken(): string | null {
    return getCsrfTokenFromCookie();
  }
};

// ================================
// AUTH SERVICE
// ================================

export const authService = {
  async login(credentials: { login_identifier: string; password: string; remember?: boolean }) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async logout() {
    const response = await apiClient.post('/auth/logout', {});
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    
    return response.data;
  },

  async registerStart(data: { email: string; phone: string }) {
    const response = await apiClient.post('/auth/register/start', data);
    return response.data;
  },

  async registerVerifyOtp(data: { email: string; otp_code: string }) {
    const response = await apiClient.post('/auth/register/verify', data);
    return response.data;
  },

  async register(data: { email: string; password: string; password_confirmation: string }) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async passwordResetRequest(email: string) {
    const response = await apiClient.post('/auth/password-reset/request', { email });
    return response.data;
  },

  async passwordResetVerify(data: { email: string; token: string; otp_code: string }) {
    const response = await apiClient.post('/auth/password-reset/verify', data);
    return response.data;
  },

  async passwordResetConfirm(data: { email: string; token: string; password: string; password_confirmation: string }) {
    const response = await apiClient.post('/auth/password-reset/confirm', data);
    return response.data;
  }
};

// ================================
// REGION SERVICE
// ================================

export const regionService = {
  async getRegencies() {
    const response = await apiClient.post('/regencies');
    return response.data;
  },
}

// ================================
// REPORT SERVICE
// ================================

export const reportService = {
  async createReport(formData: FormData) {
    const response = await apiClient.post('/report/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async searchReports(params: string) {
    const response = await apiClient.post(params ? `/reports/track?${params}` : '/reports/track');
    return response.data;
  },

  async getReportDetail(reportId: string | number) {
    const response = await apiClient.post(`/report/${reportId}/track`, {});
    return response.data;
  }
};

// ================================
// ADMIN DASHBOARD SERVICE
// ================================

export const adminDashboardService = {
  async getDashboardData(filters: {
    page?: number;
    search_term?: string;
    search_location?: string;
    search_priority?: string;
    search_admin?: string;
    search_id?: string;
    sort?: string;
  }) {
    const response = await apiClient.post('/admin/dashboard', filters);
    return response.data;
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
    const response = await apiClient.post('/admin/analytics', filters);
    return response.data;
  },

  async filterAnalytics(filters: object) {
    const response = await apiClient.post('/admin/analytics', filters);
    return response.data;
  },

  async exportAnalytics(format: 'csv' | 'xlsx', filters: object) {
    const response = await apiClient.post('/admin/analytics/export-reports', {
      format,
      ...filters
    }, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// ================================
// ADMIN PROFILE SERVICE
// ================================

export const adminProfileService = {
  async getProfile() {
    const response = await apiClient.post('/admin/profile', {});
    return response.data;
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

    const response = await apiClient.post('/admin/profile/update-info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async updateFullName(data: {
    full_name: string;
    password: string;
  }) {
    const response = await apiClient.post('/admin/profile/update-full-name', data);
    return response.data;
  },

  async updateNip(data: {
    nip: string;
    password: string;
  }) {
    const response = await apiClient.post('/admin/profile/update-nip', data);
    return response.data;
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    const response = await apiClient.post('/admin/profile/update-password', data);
    return response.data;
  },

  async changeContact(data: {
    new_email?: string;
    new_phone?: string;
    password: string;
  }) {
    let responses = [];

    if (data.new_email) {
      responses.push(await this.changeEmail({ new_email: data.new_email, password: data.password }));
    }
    if (data.new_phone) {
      responses.push(await this.changePhone({ new_phone: data.new_phone, password: data.password }));
    }

    return responses[0];
  },

  async changeEmail(data: {
    new_email: string;
    password: string;
  }) {
    const response = await apiClient.post('/admin/profile/request-email-change', data);
    return response.data;
  },

  async changePhone(data: {
    new_phone: string;
    password: string;
  }) {
    const response = await apiClient.post('/admin/profile/request-phone-change', data);
    return response.data;
  },

  async verifyEmailChange(data: { otp: string }) {
    const response = await apiClient.post('/admin/profile/verify-email-change', data);
    return response.data;
  },

  async verifyPhoneChange(data: { otp_phone: string }) {
    const response = await apiClient.post('/admin/profile/verify-phone-change', data);
    return response.data;
  },

  async updateKta(data: { kta_scan: File }) {
    const formData = new FormData();
    formData.append('kta_scan', data.kta_scan);

    const response = await apiClient.post('/admin/profile/update-kta', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async exportProfile() {
    return apiClient.post('/admin/profile/export-profile', {}, {
      responseType: 'blob'
    });
  },

  async deactivateSelf() {
    const response = await apiClient.post('/admin/profile/deactivate-self', {});
    return response.data;
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