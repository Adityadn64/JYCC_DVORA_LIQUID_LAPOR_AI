import {
  AuthUser,
  ErrorResultResponseData,
  ResponseData,
  SuccessResultResponseData,
} from "../types";
import axios from "axios";
import type { AxiosResponse, AxiosInstance, AxiosError } from "axios";

// ================================
// ENCRYPTION KEYS
// ================================

const VITE_K1 = import.meta.env.VITE_K1 || "^UAFU!Tce1$P^jX$2xdfF6s6t0x7Wtlv"; // VITE_K1: React->Express (encrypt)
const VITE_K4 = import.meta.env.VITE_K4 || "Kg6$F5ptNZ2%qcRGav!QhZr*LXLpO6Zr"; // VITE_K4: Express->React (decrypt)

// ================================
// AXIOS INSTANCE CONFIGURATION
// ================================

const isIPV4URL: boolean = window.location.href.includes("192");

const setAPIURL = (apiURI: string | string[]): string | string[] => {
  const originURI = window.location.origin;
  const originURIFilter = originURI
    .replace("3000", "3001")
    .replace("https", "http");

  console.log({ apiURI, originURI, originURIFilter });

  let newAPIUri = apiURI;

  if (isIPV4URL) {
    if (Array.isArray(apiURI)) {
      newAPIUri = originURIFilter;
    } else if (typeof apiURI === "string") {
      newAPIUri = originURIFilter;
    }
  }

  return newAPIUri;
};

const DEFAULT_SERVER_API_URL: string = setAPIURL(
  process.env.DEFAULT_SERVER_API_URL || "http://localhost:3001"
) as string;

const SERVER_API_URLS: string[] = setAPIURL(
  JSON.parse(process.env.SERVER_API_URLS || `["${DEFAULT_SERVER_API_URL}"]`)
) as string[];

console.log({ DEFAULT_SERVER_API_URL });
console.log({ SERVER_API_URLS });

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
};

// ================================
// CSRF TOKEN UTILITIES
// ================================

const getCsrfTokenFromCookie = (): string | null => {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "XSRF-TOKEN") {
      return decodeURIComponent(value);
    }
  }
  return null;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: `${DEFAULT_SERVER_API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    Authorization: `Bearer ${
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") || ""
        : ""
    }`,
  },
  withCredentials: true,
});

// ================================
// ENCRYPTION/DECRYPTION UTILITIES
// ================================

const toHex = (b: Buffer) => {
  let hex = "";
  for (const byte of b) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
};

const normalizeKey = (key: string): Uint8Array => {
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(key);

  if (keyBytes.length < 32) {
    throw Error("keyBytes length must be more than 32");
  } else if (keyBytes.length > 32) {
    keyBytes = keyBytes.slice(0, 32);
    console.log("key truncated to 32 bytes (python-style).");
  }

  return keyBytes;
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const base64ToBuffer = (cleaned: string): ArrayBuffer => {
  const binary_string = atob(cleaned);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
  return bytes.buffer;
};

const cleanBase64 = (s: string): string => {
  if (!s) return s;
  s = s.replace(/\s+/g, "");
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return s;
};

export const aesEncrypt = async (
  text: string,
  key: string
): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const keyBytes = normalizeKey(key);

  // @ts-ignore
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as any,
    "AES-CBC",
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    data
  );

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  return bufferToBase64(result.buffer);
};

export const aesDecrypt = async <T>(
  encrypted: string,
  key: string
): Promise<T | null> => {
  try {
    const keyBytes = normalizeKey(key);

    const cleaned = cleanBase64(encrypted);

    const combined = new Uint8Array(base64ToBuffer(cleaned));

    const combinedU8 = new Uint8Array(combined);
    const iv = combinedU8.slice(0, 16);
    const ciphertext = combinedU8.slice(16);

    // @ts-ignore
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as any,
      "AES-CBC",
      false,
      ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      ciphertext
    );
    const result = JSON.parse(new TextDecoder().decode(decrypted));

    console.log({ result });

    return result as T;
  } catch (err: any) {
    console.error("AES Decrypt error:", err.name ?? err, err.message ?? err);
    throw err;
  }
};

const encodePayloadToExpress = async (data: any): Promise<string> => {
  try {
    const jsonString = JSON.stringify(data);
    return await aesEncrypt(jsonString, VITE_K1.toString());
  } catch (error) {
    console.error("Gagal men-encode payload ke Express:", error);
    throw error;
  }
};

const decodePayloadFromExpress = async <T>(
  encodedPayload: string
): Promise<T | null> => {
  try {
    const decrypted = await aesDecrypt<SuccessResultResponseData>(
      encodedPayload,
      VITE_K4.toString()
    );
    return decrypted as T;
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
        const decodedPayload = await aesDecrypt<ErrorResultResponseData>(
          encodedData.d,
          VITE_K4.toString()
        );

        console.log({ decodedPayload });

        if (decodedPayload?.errors) {
          let formattedMessages: string[] = [];

          for (const [key, messages] of Object.entries(decodedPayload.errors)) {
            // Capitalize huruf pertama key (misal: phone -> Phone)
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1);

            // Pastikan messages adalah array, lalu gabung
            const messageContent = Array.isArray(messages)
              ? messages.join(" ")
              : messages;
            formattedMessages.push(`${fieldName} -> ${messageContent}`);
          }
          return formattedMessages.join("\n");
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
    if (typeof window !== "undefined") {
      const authToken = localStorage.getItem("auth_token");
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      if (config.url && config.url.includes("get-file")) {
        config.responseType = "blob";
      }
    }

    // Attach CSRF token from cookies
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      config.headers["X-XSRF-TOKEN"] = csrfToken;
    }

    // Encrypt request data if it's a POST/PUT/PATCH request with data
    if (
      config.data &&
      !(config.data instanceof FormData) &&
      ["post", "put", "patch"].includes(config.method?.toLowerCase() || "")
    ) {
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
    const contentType = response.headers["content-type"];

    if (
      contentType &&
      (contentType.startsWith("image/") || contentType.startsWith("video/"))
    ) {
      console.log({ contentType });
      return response;
    }

    if (response.data && response.data.d) {
      try {
        const data = response.data.d;

        const decrypted = await decodePayloadFromExpress<any>(data);

        // Store auth token if provided
        if (decrypted?.data?.token && typeof window !== "undefined") {
          localStorage.setItem("auth_token", decrypted.data.token);
        }

        // Store user data if provided
        if (decrypted?.data?.user && typeof window !== "undefined") {
          localStorage.setItem(
            "user_data",
            JSON.stringify(decrypted.data.user)
          );
        }

        // Replace response data with decrypted data
        response.data = decrypted || response.data;
      } catch (error) {
        console.error("Failed to decrypt response:", error);
      }
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    // if (error.response?.status === 401 && typeof window !== "undefined") {
    //   localStorage.removeItem("auth_token");
    //   localStorage.removeItem("user_data");
    //   if (!window.location.href.includes("/login"))
    //     window.location.href = "/login";
    // }

    // // Handle 403 Forbidden
    // if (error.response?.status === 403) {
    //   console.error("Access Forbidden:", error.response.data);
    //   setTimeout(() => {
    //     window.location.href = "/admin/dashboard";
    //   }, 3000);
    // }

    return Promise.reject(error);
  }
);

export const allService = {
  async verifyAdmin() {
    const response = await apiClient.post("/admin");
    return response.data;
  },

  async getBlobFile(filePath: string) {
    const response = await apiClient.post("/get-file", { datapd: filePath });
    return response.data;
  },
};

// ================================
// HOME SERVICE
// ================================

export const homeService = {
  async getHome() {
    const response = await apiClient.post("/home");
    return response.data;
  },
};

// ================================
// CSRF SERVICE
// ================================

export const csrfService = {
  async getCsrfToken() {
    const response = await apiClient.get("/csrf-cookie");
    return response;
  },

  getCurrentToken(): string | null {
    return getCsrfTokenFromCookie();
  },
};

// ================================
// AUTH SERVICE
// ================================

export const authService = {
  async login(credentials: {
    login_identifier: string;
    password: string;
    remember?: boolean;
  }) {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  async logout() {
    const response = await apiClient.post("/auth/logout", {});

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
    }

    return response.data;
  },

  async getRegisterOptions() {
    const response = await apiClient.post("/auth/register");
    return response.data;
  },

  async registerStart(formData: FormData) {
    const response = await apiClient.post("/auth/register/send", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async registerVerifyToken(data: {
    full_name: string;
    email: string;
    phone: string;
    nip: string;
    password: string;
    role: "system_admin" | "base_admin" | "";
    service_code: string | null;
    kta_scan_path: string;
    email_token: string;
    phone_otp: string;
  }) {
    const response = await apiClient.post("/auth/register/verify", data);
    return response.data;
  },

  async passwordResetRequest(data: {
    email?: string;
    phone?: string;
    nip: string;
  }) {
    const response = await apiClient.post("/auth/password-reset/request", data);
    return response.data;
  },

  async passwordResetVerify(data: {
    email?: string;
    phone?: string;
    token: string;
  }) {
    const response = await apiClient.post("/auth/password-reset/verify", data);
    return response.data;
  },

  async passwordResetConfirm(data: {
    email?: string;
    phone?: string;
    password: string;
    token: string;
  }) {
    const response = await apiClient.post("/auth/password-reset/confirm", data);
    return response.data;
  },
};

// ================================
// REGION SERVICE
// ================================

export const regionService = {
  async getRegencies() {
    const response = await apiClient.post("/regencies");
    return response.data;
  },
};

// ================================
// REPORT SERVICE
// ================================

export const reportService = {
  async createReport(formData: FormData) {
    const response = await apiClient.post("/report/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async searchReports(filters: object) {
    const response = await apiClient.post("/reports/track", filters);
    return response.data;
  },

  async getReportDetail(reportId: string | number) {
    const response = await apiClient.post(`/report/${reportId}/track`, {});
    return response.data;
  },

  async addComment(data: {
    report_id: string;
    status: string;
    comment: string;
  }) {
    const response = await apiClient.post("/report/add-comment", data);
    return response.data;
  },

  async changeStatus(data: {
    report_id: number;
    statuses_idx: number;
    visibility: boolean;
  }) {
    const response = await apiClient.post("/report/change-status", data);
    return response.data;
  },

  async changeAdmin(data: { report_id: number; new_admin_id: number }) {
    const response = await apiClient.post("/report/change-admin", data);
    return response.data;
  },
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
    const response = await apiClient.post("/admin/dashboard", filters);
    return response.data;
  },
};

// ================================
// ADMIN ANALYTICS SERVICE
// ================================

export const adminAnalyticsService = {
  async getAnalytics(
    filters: {
      date_start?: string;
      date_end?: string;
      category?: string;
      status?: string;
      service_code?: string;
      assignee_admin_id?: string;
      priority?: string;
      location?: string;
    } = {}
  ) {
    const response = await apiClient.post("/admin/analytics", filters);
    return response.data;
  },

  async filterAnalytics(filters: object) {
    const response = await apiClient.post("/admin/analytics", filters);
    return response.data;
  },

  async exportAnalytics(format: "csv" | "xlsx", filters: object) {
    const response = await apiClient.post(
      "/admin/analytics/export-reports",
      {
        format,
        ...filters,
      },
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};

// ================================
// ADMIN PROFILE SERVICE
// ================================

export const adminProfileService = {
  async getProfile() {
    const response = await apiClient.post("/admin/profile", {});
    return response.data;
  },

  async updateProfilePicture(data: {
    profile_picture: File;
    password: string;
  }) {
    const formData = new FormData();
    formData.append("profile_picture", data.profile_picture);
    formData.append("password", data.password);

    const response = await apiClient.post(
      "/admin/profile/update-picture",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async updateFullName(data: { full_name: string; password: string }) {
    const response = await apiClient.post(
      "/admin/profile/update-full-name",
      data
    );
    return response.data;
  },

  async updateNip(data: { nip: string; password: string }) {
    const response = await apiClient.post("/admin/profile/update-nip", data);
    return response.data;
  },

  async changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
    logout_other_devices: boolean;
  }) {
    const response = await apiClient.post(
      "/admin/profile/update-password",
      data
    );
    return response.data;
  },

  async changeContact(data: {
    new_email?: string;
    new_phone?: string;
    password: string;
  }) {
    let responses = [];

    if (data.new_email) {
      responses.push(
        await this.changeEmail({
          new_email: data.new_email,
          password: data.password,
        })
      );
    }
    if (data.new_phone) {
      responses.push(
        await this.changePhone({
          new_phone: data.new_phone,
          password: data.password,
        })
      );
    }

    return responses[0];
  },

  async changeEmail(data: { new_email: string; password: string }) {
    const response = await apiClient.post(
      "/admin/profile/request-email-change",
      data
    );
    return response.data;
  },

  async changePhone(data: { new_phone: string; password: string }) {
    const response = await apiClient.post(
      "/admin/profile/request-phone-change",
      data
    );
    return response.data;
  },

  async verifyEmailChange(data: { token: string; new_email: string }) {
    const response = await apiClient.post(
      "/admin/profile/verify-email-change",
      data
    );
    return response.data;
  },

  async verifyPhoneChange(data: { otp: string; new_phone: string }) {
    const response = await apiClient.post(
      "/admin/profile/verify-phone-change",
      data
    );
    return response.data;
  },

  async checkPassword(data: { password: string }) {
    const response = await apiClient.post(
      "/admin/profile/check-password",
      data
    );
    return response.data;
  },

  async updateKta(data: { kta_scan: File; password: string }) {
    const formData = new FormData();
    formData.append("kta_scan", data.kta_scan);
    formData.append("password", data.password);

    const response = await apiClient.post(
      "/admin/profile/update-kta",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async exportProfile() {
    return apiClient.post(
      "/admin/profile/export-profile",
      {},
      {
        responseType: "blob",
      }
    );
  },

  async deactivateSelf() {
    const response = await apiClient.post("/admin/profile/deactivate-self", {});
    return response.data;
  },
};

// ================================
// ADMIN MANAGE SERVICE
// ================================

export const adminManageService = {
  // DIPERBAIKI: Menggunakan GET dan params untuk filter
  async getAdmins(params: object) {
    const response = await apiClient.post("/admin/manage", { ...params });
    return response.data;
  },

  // Fungsi ini mungkin tidak lagi diperlukan jika create ditangani oleh modal/halaman lain
  // async createAdmin(data: object) { ... },

  async updateAdmin(id: string | number, data: FormData) {
    // Penting: Gunakan FormData untuk update yang mungkin menyertakan file
    // Laravel secara otomatis menangani _method=PUT dari POST dengan FormData
    return apiClient.post(`/admin/manage/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // DIPERBAIKI: Nama fungsi disesuaikan
  async toggleStatus(id: string | number) {
    return apiClient.post(`/admin/manage/${id}/toggle-status`);
  },

  // DIPERBAIKI: Nama fungsi disesuaikan
  async sendPasswordReset(id: string | number) {
    return apiClient.post(`/admin/manage/${id}/send-reset`);
  },

  // DITAMBAHKAN: Fungsi yang hilang untuk halaman 'pending'
  async accept(id: string | number) {
    return apiClient.post(`/admin/manage/${id}/accept`);
  },

  // DITAMBAHKAN: Fungsi yang hilang untuk halaman 'pending'
  async reject(id: string | number) {
    // Sesuai controller, ini adalah DELETE. Kita bisa POST dengan _method=DELETE
    // atau setup rute DELETE di Laravel. Asumsi controller menangani POST untuk kesederhanaan.
    return apiClient.post(`/admin/manage/${id}/reject`);
  },

  // DITAMBAHKAN: Fungsi untuk drawer aktivitas
  async getActivity(id: string | number) {
    const response = await apiClient.post(`/admin/manage/${id}/activity`);
    return response.data;
  },
};

// ================================
// ADMIN PERFORMANCE SERVICE
// ================================

export const adminPerformanceService = {
  async getPerformance(filters: object) {
    const response = await apiClient.post("/admin/performance", filters);
    return response.data;
  },

  async exportPerformance(format: "csv" | "xlsx", filters?: object) {
    return apiClient.post(
      "/admin/performance/export",
      {
        format,
        ...filters,
      },
      {
        responseType: "blob",
      }
    );
  },
};

export default apiClient;
