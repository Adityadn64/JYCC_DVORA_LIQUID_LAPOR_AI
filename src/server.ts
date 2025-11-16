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
import crypto from 'crypto';

dotenv.config();

const upload = multer();

const app = express();
const PORT = process.env.EXPRESS_PORT || 3001;

const IS_PRODUCTION: boolean = process.env.IS_PRODUCTION === 'true' || false;

const CLIENT_URLS: string[] = JSON.parse(process.env.CLIENT_URLS || `['http://localhost:3000']`);

const DEFAULT_SERVER_API_URL: string = process.env.DEFAULT_SERVER_API_URL || "http://localhost:8000";
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

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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
    auth_token: string;
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
  },
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

// ================================
// ENCRYPTION/DECRYPTION UTILITIES
// ================================

const K1 = process.env.K1 || '^UAFU!Tce1$P^jX$2xdfF6s6t0x7Wtlv'; // K1: React->Express (decrypt)
const K2 = process.env.K2 || 'hqhIYnZ$^puyLDd!73^EdubsLkdS02AJ'; // K2: Express->Laravel (encrypt)
const K3 = process.env.K3 || 'cZ2ZwEycENUWhO!i2e#6IWQEnj^l42Vn'; // K3: Laravel->Express (decrypt)
const K4 = process.env.K4 || 'Kg6$F5ptNZ2%qcRGav!QhZr*LXLpO6Zr'; // K4: Express->React (encrypt)

// Ensure keys are exactly 32 bytes for AES-256
const normalizeKey = (key: string): Buffer => {
    const normalized = key.padEnd(32, ' ').slice(0, 32);
    return Buffer.from(normalized, 'utf8');
};

const aesEncrypt = (text: string, key: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', normalizeKey(key), iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Combine IV and encrypted data, then base64 encode
    const combined = Buffer.concat([iv, encrypted]);
    return combined.toString('base64');
};

const aesDecrypt = (encrypted: string, key: string): string => {
    const combined = Buffer.from(encrypted, 'base64');
    const iv = combined.subarray(0, 16);
    const encryptedText = combined.subarray(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', normalizeKey(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
};

const decodePayloadFromLaravel = <T>(encodedPayload: string): T | null => {
    try {
        const decrypted = aesDecrypt(encodedPayload, K3);
        return JSON.parse(decrypted) as T;
    } catch (error) {
        console.error("Gagal men-decode payload dari Laravel:", error);
        return null;
    }
};

const encodePayloadToLaravel = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data);
        return aesEncrypt(jsonString, K2);
    } catch (error) {
        console.error("Gagal men-encode payload ke Laravel:", error);
        return '';
    }
};

const encodePayloadToReact = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data);
        return aesEncrypt(jsonString, K4);
    } catch (error) {
        console.error("Gagal men-encode payload ke React:", error);
        return '';
    }
};

const decodePayloadFromReact = <T>(encodedPayload: string): T | null => {
    try {
        const decrypted = aesDecrypt(encodedPayload, K1);
        return JSON.parse(decrypted) as T;
    } catch (error) {
        console.error("Gagal men-decode payload dari React:", error);
        return null;
    }
};

interface ResponseData {
  d: string;
}

const processResponseData = <T>(response: AxiosResponse<ResponseData>): T | null => {
    try {
        // Check if response has encrypted data
        if (!response.data || typeof response.data !== 'object') {
            console.error('Invalid response data format');
            return null;
        }

        const { d } = response.data;
        
        if (!d) {
            console.error('Missing encrypted data in response');
            return null;
        }

        return decodePayloadFromLaravel<T>(d);
    } catch (error) {
        console.error("Gagal memproses respons:", error);
        throw error;
    }
}

// ================================
// GENERIC ENCRYPTED ROUTE HANDLER
// ================================
const handleEncryptedRequest = async (
  req: Request, 
  res: Response,
  laravelRequest: (data: any) => Promise<AxiosResponse<any>>,
  handleRequest?: () => void,
  debug: boolean = false,
) => {
  try {
    if (debug) {
      console.log('=== Encrypted Request Debug ===');
      console.log('Request body:', req.body);
    }

    const decodedData = req.body && req.body.d ? decodePayloadFromReact<any>(req.body.d) : null;
    const encryptedData = decodedData ? { d: encodePayloadToLaravel(decodedData) } : {};

    if (debug) {
      console.log('Decoded data from React:', decodedData);
      console.log('Encrypted data to Laravel:', encryptedData);
    }

    const laravelResponse = await laravelRequest(encryptedData);

    if (debug) {
      console.log('Laravel response status:', laravelResponse.status);
      console.log('Laravel response data:', laravelResponse.data);
    }

    const decodedResponse = processResponseData<any>(laravelResponse);
    const encryptedResponse = encodePayloadToReact(decodedResponse);

    if (debug) {
      console.log('Decoded response from Laravel:', decodedResponse);
      console.log('Encrypted response to React:', { d: encryptedResponse });
    }

    if (handleRequest) handleRequest();

    return res.status(laravelResponse.status).json({ d: encryptedResponse });
  } catch (error: any) {
    if (handleRequest) handleRequest();

    if (debug) {
      console.error('Error in encrypted request handler:', error);
    }
    
    if (error.response) {
      const encryptedError = encodePayloadToReact(error.response.data);
      return res.status(error.response.status).json({ d: encryptedError });
    } else {
      console.error('Non-Axios Error:', error.message);
      const encryptedError = encodePayloadToReact({ success: false, message: 'Internal Server Error' });
      return res.status(500).json({ d: encryptedError });
    }
  }
};

// ================================
// AUTH MIDDLEWARE
// ================================

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  req.session.auth_token = token;
  next();
};

// ================================
// REQUEST/RESPONSE INTERCEPTORS
// ================================
laravelAPI.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

app.get('/', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('Express Backend is running');
});

// ================================
// CSRF TOKEN ENDPOINT
// ================================

app.get('/api/csrf-cookie', async (req: Request, res: Response) => {
  try {
    const laravelResponse = await laravelAPICSRF.get('/sanctum/csrf-cookie');
    const cookies = laravelResponse.headers['set-cookie'];
    if (cookies) {
      res.setHeader('Set-Cookie', cookies);
    }
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error fetching Sanctum CSRF cookie:', error.message);
    return res.status(500).json({ message: 'Gagal melakukan handshake otentikasi.' });
  }
});

// ================================
// PUBLIC ENDPOINTS
// ================================

app.post('/api/regencies', (req, res) => {
  return handleEncryptedRequest(req, res, (data) => laravelAPI.post('/regencies', data));
});

app.post('/api/home', async (req, res) => {
  return handleEncryptedRequest(req, res, (data) => laravelAPI.post('/home', data), () => {}, true);
});

// REPORT CREATE - Handles multipart/form-data, so NO encryption here
app.post('/api/report/create', upload.any(), async (req: Request, res: Response) => {
  try {
    const form = new FormData();
    if (req.body && typeof req.body === 'object') {
      Object.entries(req.body).forEach(([key, value]) => {
        form.append(key, value as string);
      });
    }
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        form.append(file.fieldname, file.buffer, file.originalname);
      });
    }

    if (form.getBuffer().length === 0) {
      return res.status(400).json({ message: 'Request body tidak boleh kosong.' });
    }

    const response = await laravelAPI.post('/report/create', form, {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error creating report:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data);
  }
});

app.post('/api/reports/track', (req, res) => {
    return handleEncryptedRequest(req, res, (data) => laravelAPI.post('/reports/track', data));
});

app.post('/api/report/:id/track', (req, res) => {
    const { id } = req.params;
    return handleEncryptedRequest(req, res, (data) => laravelAPI.post(`/report/${id}/track`, data));
});

// LOGIN
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const decodedData = req.body.d ? decodePayloadFromReact<any>(req.body.d) : req.body;
    const encryptedData = { d: encodePayloadToLaravel(decodedData) };

    const laravelResponse = await laravelAPI.post('/auth/login', encryptedData);
    
    const parsedResponse = processResponseData<any>(laravelResponse);
    const token = parsedResponse?.data?.token;

    if (parsedResponse?.data?.success && token) {
      req.session.auth_token = token;
      console.log('Token saved to Express session.');
    }

    const encryptedResponse = encodePayloadToReact(laravelResponse.data);
    return res.status(laravelResponse.status).json({ d: encryptedResponse });
  } catch (error: any) {
    if (error.response) {
      const encryptedError = encodePayloadToReact(error.response.data);
      return res.status(error.response.status).json({ d: encryptedError });
    } else {
      const encryptedError = encodePayloadToReact({ success: false, message: 'Internal Server Error' });
      return res.status(500).json({ d: encryptedError });
    }
  }
});

// LOGOUT
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  return handleEncryptedRequest(req, res, (data) => 
    laravelAPI.post('/auth/logout', data, {
      headers: { 'Authorization': `Bearer ${req.session.auth_token}` }
    })
  ), () => {
    req.session.auth_token = '';
  };
});

// REGISTER START
app.post('/api/auth/register/start', (req, res) => {
  return handleEncryptedRequest(req, res, (data) => laravelAPI.post('/auth/register/send', data));
});

// REGISTER VERIFY
app.post('/api/auth/register/verify', (req, res) => {
  return handleEncryptedRequest(req, res, (data) => laravelAPI.post('/auth/register/verify/send', data));
});

// REGISTER
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const decodedData = req.body.d ? decodePayloadFromReact<any>(req.body.d) : req.body;
    const encryptedData = { d: encodePayloadToLaravel(decodedData) };

    const laravelResponse = await laravelAPI.post('/auth/register', encryptedData);
    
    const parsedResponse = processResponseData<any>(laravelResponse);
    if (parsedResponse?.data?.token) {
      req.session.auth_token = parsedResponse.data.token;
    }

    const encryptedResponse = encodePayloadToReact(laravelResponse.data);
    return res.status(laravelResponse.status).json({ d: encryptedResponse });
  } catch (error: any) {
    if (error.response) {
      const encryptedError = encodePayloadToReact(error.response.data);
      return res.status(error.response.status).json({ d: encryptedError });
    } else {
      const encryptedError = encodePayloadToReact({ success: false, message: 'Internal Server Error' });
      return res.status(500).json({ d: encryptedError });
    }
  }
});

// PASSWORD RESET
app.post('/api/auth/password-reset/request', (req, res) => {
  return handleEncryptedRequest(req, res, (data) => laravelAPI.post('/auth/forgot-password', data));
});

app.post('/api/auth/password-reset/verify', (req, res) => {
    return handleEncryptedRequest(req, res, (data) => laravelAPI.post('/auth/reset-password', data));
});

app.post('/api/auth/password-reset/confirm', authMiddleware, (req, res) => {
  return handleEncryptedRequest(req, res, (data) => 
    laravelAPI.post('/reset-password', data, {
      headers: { 'Authorization': `Bearer ${req.session.auth_token}` }
    })
  );
});

// ================================
// PROTECTED ENDPOINTS (Auth Required)
// ================================

const createAuthHandler = (method: 'post' | 'put' | 'delete', url: string) => {
  return (req: Request, res: Response) => {
    const finalUrl = url.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => req.params[paramName]);
    return handleEncryptedRequest(req, res, (data) => 
      laravelAPI[method](finalUrl, data, {
        headers: { 'Authorization': `Bearer ${req.session.auth_token}` }
      })
    );
  };
};

// ADMIN DASHBOARD
app.post('/api/admin/dashboard', authMiddleware, createAuthHandler('post', '/admin/dashboard'));
app.post('/api/admin/analytics', authMiddleware, createAuthHandler('post', '/admin/analytics'));
app.post('/api/admin/analytics/export-reports', authMiddleware, createAuthHandler('post', '/admin/analytics/export-reports'));
app.post('/api/admin/profile', authMiddleware, createAuthHandler('post', '/admin/profile'));
app.post('/api/admin/profile/update-info', authMiddleware, createAuthHandler('post', '/admin/profile/update-info'));
app.post('/api/admin/profile/update-full-name', authMiddleware, createAuthHandler('post', '/admin/profile/update-full-name'));
app.post('/api/admin/profile/update-nip', authMiddleware, createAuthHandler('post', '/admin/profile/update-nip'));
app.post('/api/admin/profile/update-password', authMiddleware, createAuthHandler('post', '/admin/profile/update-password'));
app.post('/api/admin/profile/request-email-change', authMiddleware, createAuthHandler('post', '/admin/profile/request-email-change'));
app.post('/api/admin/profile/verify-email-change', authMiddleware, createAuthHandler('post', '/admin/profile/verify-email-change'));
app.post('/api/admin/profile/request-phone-change', authMiddleware, createAuthHandler('post', '/admin/profile/request-phone-change'));
app.post('/api/admin/profile/verify-phone-change', authMiddleware, createAuthHandler('post', '/admin/profile/verify-phone-change'));
app.post('/api/admin/profile/deactivate-self', authMiddleware, createAuthHandler('post', '/admin/profile/deactivate-self'));
app.post('/api/admin/manage', authMiddleware, createAuthHandler('post', '/admin/manage'));
app.put('/api/admin/manage/:id', authMiddleware, createAuthHandler('put', '/admin/manage/:id'));
app.delete('/api/admin/manage/:id', authMiddleware, createAuthHandler('delete', '/admin/manage/:id'));
app.post('/api/admin/manage/:id/toggle-status', authMiddleware, createAuthHandler('post', '/admin/manage/:id/toggle-status'));
app.post('/api/admin/manage/:id/reset-password', authMiddleware, createAuthHandler('post', '/admin/manage/:id/reset-password'));
app.post('/api/admin/performance', authMiddleware, createAuthHandler('post', '/admin/performance'));
app.post('/api/admin/performance/export', authMiddleware, createAuthHandler('post', '/admin/performance/export'));

// ADMIN PROFILE FILE UPLOADS - NO ENCRYPTION
app.post('/api/admin/profile/update-picture', authMiddleware, upload.single('profile_picture'), async (req: Request, res: Response) => {
  try {
    const form = new FormData();
    if (req.file) {
      form.append('profile_picture', req.file.buffer, req.file.originalname);
    }
    const response = await laravelAPI.post('/admin/profile/update-picture', form, {
      headers: {
        'Authorization': `Bearer ${req.session.auth_token}`,
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    res.json(response.data);
  } catch (error: any) {
    return res.status(error.response?.status || 500).json(error.response?.data);
  }
});

app.post('/api/admin/profile/update-kta', authMiddleware, upload.single('kta_scan'), async (req: Request, res: Response) => {
  try {
    const form = new FormData();
    if (req.file) {
      form.append('kta_scan', req.file.buffer, req.file.originalname);
    }
    const response = await laravelAPI.post('/admin/profile/update-kta', form, {
      headers: {
        'Authorization': `Bearer ${req.session.auth_token}`,
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    res.json(response.data);
  } catch (error: any) {
    return res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN PROFILE EXPORT - Stream response, NO encryption
app.post('/api/admin/profile/export-profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/profile/export-profile', req.body, {
      headers: { 'Authorization': `Bearer ${req.session.auth_token}` },
      responseType: 'stream'
    });
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/csv');
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'attachment; filename="profile.csv"');
    response.data.pipe(res);
  } catch (error: any) {
    return res.status(error.response?.status || 500).json(error.response?.data);
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
  return res.status(err.status || 500).json({
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
╔═══════════════════════════════════════╗
║     EXPRESS API GATEWAY RUNNING        ║
╚═══════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}
🔗 React Frontend: http://localhost:3000
📡 Laravel Backend: ${baseURL}
✅ CORS enabled for ${CLIENT_URLS.join(', ')}

Architecture:
  React (${!IS_PRODUCTION ? 'http://localhost:3000' : 'https://lapor-ai-jatim.vercel.app/'})
    ↓
  Express Gateway (${!IS_PRODUCTION ? 'http://localhost:3001' : 'https://lalex.vercel.app/'}) ← Hidden Implementation
    ↓
  Laravel Backend (${baseURL}) ← Hidden from Client
  `);
});

export default app;