import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import session from 'express-session';
import dotenv from 'dotenv';
import multer from 'multer';
import FormData from 'form-data';

dotenv.config();

const upload = multer();

const app = express();
const PORT = process.env.EXPRESS_PORT || 3001;

const IS_PRODUCTION: boolean = process.env.IS_PRODUCTION === 'true' || false;

const CLIENT_URLS: string[] = JSON.parse(process.env.CLIENT_URLS || `['http://localhost:3000']`);

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

// ================================
// MIDDLEWARE CONFIGURATION
// ================================

app.use(cors({
  origin: CLIENT_URLS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN', 'X-XSRF-TOKEN', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Body Parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'LA98qwr10_1egakoaw12UIYnghppo0_-1948',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

declare module 'express-session' {
  interface SessionData {
    auth_token: string; // Or the appropriate type for your token
  }
}

// ================================
// AXIOS INSTANCE FOR LARAVEL
// ================================

const laravelAPICSRF: AxiosInstance = axios.create({
  baseURL: DEFAULT_SERVER_API_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

const laravelAPI: AxiosInstance = axios.create({
  baseURL: `${DEFAULT_SERVER_API_URL}/api`,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

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

interface ResponseData {
  d: string;
  k: string;
}

const proccessResponseData = <T>(response: AxiosResponse<ResponseData>): T | null => {
    try {
        console.dir({data: response.data}, { depth: null, colors: true })
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

// ================================
// AUTH MIDDLEWARE
// ================================

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Extract token from Authorization header (Bearer token from React)
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  console.dir({token: token ? token.substring(0, 20) + '...' : null}, {depth: null, colors: true});

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  // Store token in session for Laravel requests
  (req.session as any).auth_token = token;

  next();
};

// ================================
// REQUEST/RESPONSE INTERCEPTORS
// ================================

// Attach token and CSRF to Laravel requests
laravelAPI.interceptors.request.use((config) => {
  // Note: Token and CSRF are attached per-request in the route handlers
  // This interceptor is kept for any global headers but tokens are handled per-request
  return config;
});

// Handle Laravel responses
laravelAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Let the client handle auth errors
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

app.get('/', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  return res.send('Express Backend is running');
});

app.post('/api/regencies', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/regencies');
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ================================
// CSRF TOKEN UTILITIES
// ================================

// Extract CSRF token from cookies
const extractCsrfToken = (cookieHeader?: string): string | null => {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// CSRF Middleware - attaches CSRF token to Laravel requests
const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const csrfToken = extractCsrfToken(req.headers.cookie as string);
  
  if (csrfToken) {
    // Store in request for later use
    (req as any).csrfToken = csrfToken;
  }
  
  next();
};

// Apply CSRF middleware to all routes
app.use(csrfMiddleware);

// ================================
// CSRF TOKEN ENDPOINT
// ================================

app.get('/api/csrf-cookie', async (req: Request, res: Response) => {
  try {
    // Call Laravel's Sanctum CSRF cookie endpoint
    const laravelResponse = await laravelAPICSRF.get('/sanctum/csrf-cookie');
    
    // Forward all Set-Cookie headers from Laravel to React
    const cookies = laravelResponse.headers['set-cookie'];
    if (cookies) {
      res.setHeader('Set-Cookie', cookies);
      
      // Extract and store CSRF token in session for later use
      const xsrfCookie = cookies.find((cookie: string) => cookie.startsWith('XSRF-TOKEN='));
      if (xsrfCookie) {
        const tokenMatch = xsrfCookie.match(/XSRF-TOKEN=([^;]+)/);
        if (tokenMatch) {
          const csrfToken = decodeURIComponent(tokenMatch[1]);
          (req.session as any).csrf_token = csrfToken;
          console.log('CSRF token stored in session:', csrfToken.substring(0, 20) + '...');
        }
      }
    }
    
    // 204 No Content is the correct response
    res.status(204).send();
  } catch (error: any) {
    console.error('Error fetching Sanctum CSRF cookie:', error.message);
    res.status(500).json({ message: 'Gagal melakukan handshake otentikasi.' });
  }
});

// ================================
// PUBLIC ENDPOINTS (No Auth Required)
// ================================

// HOME - Get home page data
app.post('/api/home', async (_req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/home');
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

app.post('/api/report/create', upload.any(), async (req: Request, res: Response) => {
  try {
    // Sekarang, berkat Multer, req.body berisi field teks dan req.files berisi file
    const form = new FormData();

    // Tambahkan semua field teks dari body yang sudah di-parse oleh Multer
    if (req.body && typeof req.body === 'object') {
      Object.entries(req.body).forEach(([key, value]) => {
        form.append(key, value as string);
      });
    }

    // Tambahkan semua file dari request yang sudah di-parse oleh Multer
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        // Gunakan buffer file dan nama file asli
        form.append(file.fieldname, file.buffer, file.originalname);
      });
    }

    // Safety check jika form kosong
    if (form.getBuffer().length === 0) {
      return res.status(400).json({ message: 'Request body tidak boleh kosong.' });
    }

    // Dapatkan panjang konten dan header yang benar untuk dikirim ke Laravel
    const contentLength = form.getLengthSync();

    const response = await laravelAPI.post('/report/create', form, {
      headers: {
        ...form.getHeaders(), // Ini akan mengatur Content-Type dengan boundary yang benar
        'Content-Length': contentLength,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error creating report:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REPORT - Search/Track reports
app.post('/api/reports/track', async (req: Request, res: Response) => {
  try {
    const filters = req.query || {};
    const response = await laravelAPI.post('/reports/track', filters);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REPORT - Get report detail
app.post('/api/report/:id/track', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post(`/report/${req.params.id}/track`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// LOGIN
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const laravelResponse = await laravelAPI.post('/auth/login', req.body);
    const parsedResponse = proccessResponseData<any>(laravelResponse);

    const token = parsedResponse.data?.token;

    if (parsedResponse.data.success && token) {
      req.session.auth_token = token;
      
      console.log('Token saved to Express session:', token);
    }

    res.status(laravelResponse.status).json(laravelResponse.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
});

// LOGOUT
app.post('/api/auth/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/auth/logout', {}, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`
      }
    });
    
    // Clear session
    (req.session as any).auth_token = null;
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REGISTER START
app.post('/api/auth/register/start', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/auth/register/send', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REGISTER VERIFY
app.post('/api/auth/register/verify', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/auth/register/verify/send', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REGISTER
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/auth/register', req.body);
    const parsedResponse = proccessResponseData<any>(response);
    
    // Store token if provided
    if (parsedResponse.data?.token) {
      (req.session as any).auth_token = parsedResponse.data.token;
    }
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// PASSWORD RESET REQUEST
app.post('/api/auth/password-reset/request', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/auth/forgot-password', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// PASSWORD RESET VERIFY
app.post('/api/auth/password-reset/verify', async (req: Request, res: Response) => {
  try {
    const { token, ...data } = req.body;
    const response = await laravelAPI.post(`/auth/reset-password/${token}`, data);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// PASSWORD RESET CONFIRM
app.post('/api/auth/password-reset/confirm', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/reset-password', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ================================
// PROTECTED ENDPOINTS (Auth Required)
// ================================

// ADMIN DASHBOARD
app.post('/api/admin/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/dashboard', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    console.dir({ error }, { depth: null, colors: true })
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN ANALYTICS
app.post('/api/admin/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/analytics', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN ANALYTICS EXPORT
app.post('/api/admin/analytics/export-reports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/analytics/export-reports', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN PROFILE
app.post('/api/admin/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/profile', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN PROFILE UPDATE INFO
app.post('/api/admin/profile/update-info', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.put('/admin/profile/update-info', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN PROFILE UPDATE PASSWORD
app.post('/api/admin/profile/update-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/profile/update-password', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN PROFILE REQUEST EMAIL CHANGE
app.post('/api/admin/profile/request-email-change', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/profile/request-email-change', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN MANAGE
app.post('/api/admin/manage', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/manage', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN MANAGE UPDATE
app.put('/api/admin/manage/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.put(`/admin/manage/${req.params.id}`, req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN MANAGE DELETE
app.delete('/api/admin/manage/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.delete(`/admin/manage/${req.params.id}`, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN MANAGE TOGGLE STATUS
app.post('/api/admin/manage/:id/toggle-status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post(`/admin/manage/${req.params.id}/toggle-status`, req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN MANAGE RESET PASSWORD
app.post('/api/admin/manage/:id/reset-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post(`/admin/manage/${req.params.id}/reset-password`, req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN PERFORMANCE
app.post('/api/admin/performance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.get('/admin/performance', {
      params: req.body,
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN PERFORMANCE EXPORT
app.post('/api/admin/performance/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/performance/export', req.body, {
      headers: {
        'Authorization': `Bearer ${(req.session as any).auth_token}`,
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ================================
// HEALTH CHECK
// ================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Express API Gateway is running'
  });
});

// ================================
// ERROR HANDLING
// ================================

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Express Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: !IS_PRODUCTION ? err : {}
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, async () => {
  const baseURL = await searchBaseURL();

  console.log(`
╔════════════════════════════════════════╗
║     EXPRESS API GATEWAY RUNNING        ║
╚════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}
🔗 React Frontend: http://localhost:3000
📡 Laravel Backend: http://${baseURL}
✅ CORS enabled for ${CLIENT_URLS.map(url => url.includes('http') ? url : 'http://' + url).join(', ')}

Endpoints:
  - POST /sanctum/csrf-token
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/register
  - POST /api/admin/*
  - And more...

Architecture:
  React (${!IS_PRODUCTION ? 'http://localhost:3000' : 'https://lapor-ai-jatim.vercel.app/'})
    ↓
  Express Gateway (${!IS_PRODUCTION ? 'http://localhost:3001' : 'https://lalex.vercel.app/'}) ← Hidden Implementation
    ↓
  Laravel Backend (${baseURL}) ← Hidden from Client
  `);
});

export default app;
