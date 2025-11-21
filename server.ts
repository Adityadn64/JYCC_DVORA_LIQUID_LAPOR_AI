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
import rateLimit from 'express-rate-limit';

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

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.set('trust proxy', 1);
app.use(limiter);

// ================================
// MIDDLEWARE CONFIGURATION
// ================================

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    const localhostRegex = /^https?:\/\/localhost(:\d+)?$/;
    const localNetworkRegex = /^https?:\/\/192\.168\.1\.\d+(:\d+)?$/;
    
    if (
      CLIENT_URLS.includes(origin) ||
      localhostRegex.test(origin) ||
      localNetworkRegex.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN', 'X-XSRF-TOKEN', 'X-Requested-With'],
};

app.use(cors(corsOptions));

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
  reqData: any = null,
  laravelRequest: (data: any) => Promise<AxiosResponse<any>>,
  handleRequest: (parsedResponse: any) => void = () => {},
  debug: boolean = true,
) => {
  try {
    if (debug) {
      console.log('=== Encrypted Request Debug ===');
      console.log('Request body:', req.body);
    }

    const decodedData = reqData ? reqData : req.body && req.body.d ? decodePayloadFromReact<any>(req.body.d) : null;
    const encryptedData = decodedData
      ? decodedData instanceof FormData
        ? decodedData
        : { d: encodePayloadToLaravel(decodedData) }
      : {};

    if (debug) {
      console.log('Decoded data from React:', decodedData);
      console.log('Encrypted data to Laravel:', encryptedData);
    }

    const laravelResponse = await laravelRequest(encryptedData);

    if (debug) {
      console.log('Laravel response status:', laravelResponse.status);
      console.log('Laravel response data:', laravelResponse.data);
      console.log('Laravel response headers:', laravelResponse.headers);
    }

    const contentType = laravelResponse.headers['content-type'];
    
    if (contentType && (contentType.startsWith('image/') || contentType.startsWith('video/'))) {
        if (debug) {
            console.log(`Detected file response (${contentType}). Bypassing encryption/decryption.`);
        }

        res.set(laravelResponse.headers);
        
        return res.status(laravelResponse.status).send(laravelResponse.data);
    }

    const decodedResponse = processResponseData<any>(laravelResponse);
    const encryptedResponse = encodePayloadToReact(decodedResponse);

    if (debug) {
      console.log('Decoded response from Laravel:', decodedResponse);
      console.log('Encrypted response to React:', { d: encryptedResponse });
    }

    handleRequest(decodedResponse);

    return res.status(laravelResponse.status).json({ d: encryptedResponse });
  } catch (error: any) {
    if (debug) {
      console.error('Error in encrypted request handler:', error);
    }

    if (error.response && error.response.data) {
      const decodedResponse = processResponseData<any>(error.response);
      const encryptedResponse = encodePayloadToReact(decodedResponse);

      if (debug) {
        console.log('Decoded error response from Laravel:', decodedResponse);
        console.log('Encrypted error response to React:', { d: encryptedResponse });

        console.dir(decodedResponse, {depth: null, colors: true})
      }

      handleRequest(decodedResponse);

      return res.status(error.response.status).json({ d: encryptedResponse });
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

const authMiddleware = (req: Request, res: Response, next: NextFunction, isOptional: boolean = false) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) req.session.auth_token = token;

  if (!token && !isOptional) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

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
  return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/regencies', data));
});

app.post(
  '/api/get-file',
  (req, res, next) => authMiddleware(req, res, next, true),
  async (req: Request, res: Response) => {
    return handleEncryptedRequest(req, res, null, (data) =>
      laravelAPI.post('/get-file', data, {
        headers: { 'Authorization': `Bearer ${req.session.auth_token}` },
        responseType: 'arraybuffer'
      })
    );
  }
);

app.post('/api/home', async (req, res) => {
  return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/home', data), );
});

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

    return handleEncryptedRequest(req, res, form, (data) => laravelAPI.post('/report/create', data, {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }), );
  } catch (error: any) {
    console.error('Error creating report:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data);
  }
});

app.post('/api/reports/track', (req, res) => {
    return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/reports/track', data), );
});

app.post('/api/report/:id/track', (req, res) => {
    const { id } = req.params;
    return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post(`/report/${id}/track`, data), );
});

// LOGIN
app.post('/api/auth/login', async (req: Request, res: Response) => {
  return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post(`/auth/login`, data), (parsedResponse) => {
    const token = parsedResponse?.data?.token;
    if (parsedResponse?.data?.success && token) {
      req.session.auth_token = token;
      console.log('Token saved to Express session.');
    }
  }, true);
});

// LOGOUT
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  return handleEncryptedRequest(req, res, null, (data) => 
    laravelAPI.post('/auth/logout', data, {
      headers: { 'Authorization': `Bearer ${req.session.auth_token}` }
    })
  ), () => {
    req.session.auth_token = '';
    console.log('Token is removed to Express session.');
  };
});

// REGISTER
app.post('/api/auth/register', async (req: Request, res: Response) => {
  return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/auth/register', data));
});

// REGISTER SEND
app.post('/api/auth/register/send', upload.any(), (req, res) => {
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

    return handleEncryptedRequest(req, res, form, (data) => laravelAPI.post('/auth/register/send', data, {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }), );
  } catch (error: any) {
    console.error('Error creating report:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REGISTER VERIFY
app.post('/api/auth/register/verify', (req, res) => {
  return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/auth/register/verify', data), );
});

// PASSWORD RESET
app.post('/api/auth/password-reset/request', (req, res) => {
  return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/auth/password-reset/request', data), );
});

app.post('/api/auth/password-reset/verify', (req, res) => {
    return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/auth/password-reset/verify', data), );
});

app.post('/api/auth/password-reset/confirm', (req, res) => {
    return handleEncryptedRequest(req, res, null, (data) => laravelAPI.post('/auth/password-reset/confirm', data), );
});

// ================================
// PROTECTED ENDPOINTS (Auth Required)
// ================================

const createAuthHandler = (urlTemplate: string) => {
  return async (req: Request, res: Response) => {
    let finalUrl = urlTemplate;

    for (const key in req.params) {
      finalUrl = finalUrl.replace(`:${key}`, req.params[key]);
    }

    return handleEncryptedRequest(req, res, null, (data) => 
      laravelAPI.post(finalUrl, data, {
        headers: { 'Authorization': `Bearer ${req.session.auth_token}` }
      }), 
    );
  };
};

// ADMIN DASHBOARD
app.post('/api/report/add-comment', authMiddleware, createAuthHandler('/admin/report/add-comment'));
app.post('/api/report/change-status', authMiddleware, createAuthHandler('/admin/report/change-status'));
app.post('/api/report/change-admin', authMiddleware, createAuthHandler('/admin/report/change-admin'));
app.post('/api/admin/dashboard', authMiddleware, createAuthHandler('/admin/dashboard'));
app.post('/api/admin/analytics', authMiddleware, createAuthHandler('/admin/analytics'));
app.post('/api/admin', authMiddleware, createAuthHandler('/admin'));
app.post('/api/admin/profile', authMiddleware, createAuthHandler('/admin/profile'));
app.post('/api/admin/profile/check-password', authMiddleware, createAuthHandler('/admin/profile/check-password'));
app.post('/api/admin/profile/update-info', authMiddleware, createAuthHandler('/admin/profile/update-info'));
app.post('/api/admin/profile/update-full-name', authMiddleware, createAuthHandler('/admin/profile/update-full-name'));
app.post('/api/admin/profile/update-nip', authMiddleware, createAuthHandler('/admin/profile/update-nip'));
app.post('/api/admin/profile/update-password', authMiddleware, createAuthHandler('/admin/profile/update-password'));
app.post('/api/admin/profile/request-email-change', authMiddleware, createAuthHandler('/admin/profile/request-email-change'));
app.post('/api/admin/profile/verify-email-change', authMiddleware, createAuthHandler('/admin/profile/verify-email-change'));
app.post('/api/admin/profile/request-phone-change', authMiddleware, createAuthHandler('/admin/profile/request-phone-change'));
app.post('/api/admin/profile/verify-phone-change', authMiddleware, createAuthHandler('/admin/profile/verify-phone-change'));
app.post('/api/admin/profile/deactivate-self', authMiddleware, createAuthHandler('/admin/profile/deactivate-self'));
app.post('/api/admin/manage', authMiddleware, createAuthHandler('/admin/manage'));
app.post('/api/admin/manage/:id', authMiddleware, createAuthHandler('/admin/manage/:id'));
app.post('/api/admin/manage/:id/activity', authMiddleware, createAuthHandler('/admin/manage/:id/activity'));
app.post('/api/admin/manage/:id/toggle-status', authMiddleware, createAuthHandler('/admin/manage/:id/toggle-status'));
app.post('/api/admin/manage/:id/reset-password', authMiddleware, createAuthHandler('/admin/manage/:id/reset-password'));
app.post('/api/admin/manage/:id/accept', authMiddleware, createAuthHandler('/admin/manage/:id/accept'));
app.post('/api/admin/manage/:id/reject', authMiddleware, createAuthHandler('/admin/manage/:id/reject'));
app.post('/api/admin/performance', authMiddleware, createAuthHandler('/admin/performance'));

// ADMIN PROFILE FILE UPLOADS - NO ENCRYPTION
app.post('/api/admin/profile/update-picture', upload.any(), authMiddleware, async (req: Request, res: Response) => {
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

    return handleEncryptedRequest(req, res, form, (data) => laravelAPI.post('/admin/profile/update-picture', data, {
      headers: {
        'Authorization': `Bearer ${req.session.auth_token}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }), );
  } catch (error: any) {
    return res.status(error.response?.status || 500).json(error.response?.data);
  }
});

app.post('/api/admin/profile/update-kta', upload.any(), authMiddleware, async (req: Request, res: Response) => {
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

    return handleEncryptedRequest(req, res, form, (data) => laravelAPI.post('/admin/profile/update-kta', data, {
      headers: {
        'Authorization': `Bearer ${req.session.auth_token}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }), );
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
║     EXPRESS API GATEWAY RUNNING       ║
╚═══════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}
🔗 React Frontend: https://localhost:3000
📡 Laravel Backend: ${baseURL}
✅ CORS enabled for ${CLIENT_URLS.join(', ')}

Architecture:
  React (${!IS_PRODUCTION ? 'https://localhost:3000' : 'https://lapor-ai-jatim.vercel.app/'})
    ↓
  Express Gateway (${!IS_PRODUCTION ? 'http://localhost:3001' : 'https://lalex.vercel.app/'}) ← Hidden Implementation
    ↓
  Laravel Backend (${baseURL}) ← Hidden from Client
  `);
});

export default app;