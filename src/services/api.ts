import { ResponseData } from '@/types';
import axios from 'axios';
import type { AxiosResponse, AxiosInstance, AxiosError } from 'axios';

// ================================
// AXIOS INSTANCE CONFIGURATION
// ================================

const DEFAULT_SERVER_API_URL: string = process.env.DEFAULT_SERVER_API_URL || "http://localhost:3001";
const SERVER_API_URLS: string[] = JSON.parse(process.env.SERVER_API_URLS || `[${DEFAULT_SERVER_API_URL}]`);

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

const apiClient: AxiosInstance = axios.create({
  baseURL: `${await searchBaseURL()}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
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
    // Store auth token if provided in response
    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // // Clear auth data
      // localStorage.removeItem('auth_token');
      // localStorage.removeItem('user_data');
      
      // // Redirect to login
      // window.location.href = '/login';
    }

    // Handle 403 Forbidden - Admin status issue
    if (error.response?.status === 403) {
      console.error('Access Forbidden:', error.response.data);
    }

    return Promise.reject(error);
  }
);

const vigenereCipher = (input: string, key: string, mode: 'encode' | 'decode'): string => {
    const keyLength = key.length;
    let output = '';

    for (let i = 0; i < input.length; i++) {
        const keyChar = key[i % keyLength];
        const keyOffset = parseInt(keyChar, 10);

        const inputAscii = input.charCodeAt(i);

        let newAscii: number;
        if (mode === 'encode') {
            newAscii = (inputAscii + keyOffset) % 256;
        } else {
            newAscii = (inputAscii - keyOffset + 256) % 256;
        }

        output += String.fromCharCode(newAscii);
    }

    return output;
};

const decodePayload = <T>(encodedPayload: string, key: string): T | null => {
    try {
        // 1. Dekode dari Base64 untuk mendapatkan string yang diacak
        const scrambledString = atob(encodedPayload);

        // 2. Terapkan Vigenère Cipher untuk membalikkan acakan
        const jsonString = vigenereCipher(scrambledString, key, 'decode');

        // 3. Parse string JSON kembali menjadi objek
        return JSON.parse(jsonString) as T;

    } catch (error) {
        console.error("Gagal men-decode payload:", error);
        return null; // Gagal decode
    }
};

const proccessResponseData = async <T>(request: Promise<AxiosResponse<ResponseData>>): Promise<T | null> => {
    try {
        const response = await request;
        
        // Gunakan destructuring agar lebih ringkas
        const { d, k } = response.data; 

        // Sekarang kita teruskan tipe generic <T> ke decodePayload
        return decodePayload<T>(d, k);
    
    } catch (error) {
        console.error("Gagal memproses respons:", error);
        // Lempar kembali error agar bisa ditangkap oleh pemanggil
        throw error;
    }
}

export const decodeErrorResponse = (error: any): string => {
    // Cek apakah ini adalah error dari Axios dan memiliki body respons
    if (axios.isAxiosError(error) && error.response?.data) {
        
        // Cek apakah body respons memiliki format terenkripsi kita {d, k}
        const encodedData = error.response.data as { d: string; k: string };
        if (encodedData.d && encodedData.k) {
            // Lakukan decode payload error
            const decodedPayload = decodePayload<{ message: string; errors?: any }>(
                encodedData.d,
                encodedData.k
            );

            // Jika ada 'errors' (untuk validasi), format pesannya
            if (decodedPayload?.errors) {
                const firstErrorKey = Object.keys(decodedPayload.errors)[0];
                const firstErrorMessage = decodedPayload.errors[firstErrorKey][0];
                return firstErrorMessage; // Contoh: "The password field is required."
            }

            // Jika tidak ada 'errors', kembalikan pesan utamanya
            if (decodedPayload?.message) {
                return decodedPayload.message; // Contoh: "Kredensial tidak cocok."
            }
        }
    }

    // Fallback jika error bukan dari Axios atau formatnya tidak dikenali
    return "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";
};

// ================================
// HOME SERVICE
// ================================

export const homeService = {
  async getHome() {
    return proccessResponseData<any>(apiClient.post('/home'));
  }
};

// ================================
// CSRF SERVICE
// ================================

export const csrfService = {
  async getCsrfToken() {
    return apiClient.get('/csrf-cookie');
  }
};

// ================================
// AUTH SERVICE
// ================================

export const authService = {
  async login(credentials: { login_identifier: string; password: string; remember?: boolean }) {
    const response = await proccessResponseData<any>(apiClient.post('/auth/login', credentials));
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  async logout() {
    const response = await proccessResponseData<any>(apiClient.post('/auth/logout', {}));
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    return response;
  },

  async registerStart(data: { email: string; phone: string }) {
    return proccessResponseData<any>(apiClient.post('/auth/register/start', data));
  },

  async registerVerifyOtp(data: { email: string; otp_code: string }) {
    const response = await proccessResponseData<any>(apiClient.post('/auth/register/verify', data));
    
    return response;
  },

  async register(data: { email: string; password: string; password_confirmation: string }) {
    const response = await proccessResponseData<any>(apiClient.post('/auth/register', data));
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    if (response.data.user) {
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  async passwordResetRequest(email: string) {
    return proccessResponseData<any>(apiClient.post('/auth/password-reset/request', { email }));
  },

  async passwordResetVerify(data: { email: string; token: string; otp_code: string }) {
    return proccessResponseData<any>(apiClient.post('/auth/password-reset/verify', data));
  },

  async passwordResetConfirm(data: { email: string; token: string; password: string; password_confirmation: string }) {
    return proccessResponseData<any>(apiClient.post('/auth/password-reset/confirm', data));
  }
};

// ================================
// REPORT SERVICE
// ================================

export const regionService = {
  async getRegencies() {
    return proccessResponseData<any>(apiClient.post(`/regencies`));
  },
}

export const reportService = {
  async createReport(formData: FormData) {
    return proccessResponseData<any>(apiClient.post('/report/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }));
  },

  async searchReports(params: string) {
    return proccessResponseData<any>(apiClient.post(params ? `/report/track?${params}` : '/reports/track'));
  },

  async getReportDetail(reportId: string | number) {
    return proccessResponseData<any>(apiClient.post(`/report/${reportId}/track`, {}));
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
    return proccessResponseData<any>(apiClient.post('/admin/dashboard', filters));
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
    return proccessResponseData<any>(apiClient.post('/admin/analytics', filters));
  },

  async filterAnalytics(filters: object) {
    return proccessResponseData<any>(apiClient.post('/admin/analytics', filters));
  },

  async exportAnalytics(format: 'csv' | 'xlsx', filters: object) {
    return proccessResponseData<any>(apiClient.post('/admin/analytics/export-reports', {
      format,
      ...filters
    }, {
      responseType: 'blob'
    }));
  }
};

// ================================
// ADMIN PROFILE SERVICE
// ================================

export const adminProfileService = {
  async getProfile() {
    return proccessResponseData<any>(apiClient.post('/admin/profile', {}));
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
    
    return proccessResponseData<any>(apiClient.post('/admin/profile/update-info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }));
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return proccessResponseData<any>(apiClient.post('/admin/profile/update-password', data));
  },

  async changeContact(data: {
    email?: string;
    phone?: string;
  }) {
    return proccessResponseData<any>(apiClient.post('/admin/profile/request-email-change', data));
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
