import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.EXPRESS_PORT || 3001;
const LARAVEL_API = process.env.APP_URL || 'http://localhost:8000';

// ================================
// MIDDLEWARE CONFIGURATION
// ================================

// CORS Configuration - Allow React on localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN', 'X-Requested-With'],
}));

// Body Parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// ================================
// AXIOS INSTANCE FOR LARAVEL
// ================================

const laravelAPICSRF: AxiosInstance = axios.create({
  baseURL: LARAVEL_API,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

const laravelAPI: AxiosInstance = axios.create({
  baseURL: `${LARAVEL_API}/api`,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// ================================
// AUTH MIDDLEWARE
// ================================

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.session?.auth_token;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan'
    });
  }

  // Store token in session for Laravel
  (req.session as any).auth_token = token;
  
  next();
};

// ================================
// REQUEST/RESPONSE INTERCEPTORS
// ================================

// Attach token to Laravel requests
laravelAPI.interceptors.request.use((config) => {
  const token = (app.get('request') as any)?.session?.auth_token || 
                process.env.DEFAULT_TOKEN;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
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

// ================================
// CSRF TOKEN ENDPOINT
// ================================

app.get('/api/csrf-cookie', async (req: Request, res: Response) => {
  try {
    // Panggil endpoint Sanctum yang benar
    const laravelResponse = await laravelAPICSRF.get('/sanctum/csrf-cookie');
    
    // Teruskan header 'set-cookie' dari Laravel ke klien (React)
    const cookies = laravelResponse.headers['set-cookie'];
    if (cookies) {
      res.setHeader('Set-Cookie', cookies);
    }
    
    // 204 No Content adalah respons yang benar
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

// REPORT - Create new report
app.post('/api/lapor', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/lapor', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REPORT - Search/Track reports
app.post('/api/lacak', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/lacak', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REPORT - Get report detail
app.post('/api/lacak/:id', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post(`/lacak/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// LOGIN
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const laravelResponse = await laravelAPI.post('/login', req.body);

    const token = laravelResponse.data?.data?.token;

    if (laravelResponse.data.success && token) {
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
    const response = await laravelAPI.post('/logout', {}, {
      headers: {
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
    const response = await laravelAPI.post('/register/send', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REGISTER VERIFY
app.post('/api/auth/register/verify', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/register/verify/send', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// REGISTER
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/register', req.body);
    
    // Store token if provided
    if (response.data.data?.token) {
      (req.session as any).auth_token = response.data.data.token;
    }
    
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// PASSWORD RESET REQUEST
app.post('/api/auth/password-reset/request', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/forgot-password', req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// PASSWORD RESET VERIFY
app.post('/api/auth/password-reset/verify', async (req: Request, res: Response) => {
  try {
    const { token, ...data } = req.body;
    const response = await laravelAPI.post(`/reset-password/${token}`, data);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// PASSWORD RESET CONFIRM
app.post('/api/auth/password-reset/confirm', async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/reset-password', req.body);
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// ADMIN ANALYTICS
app.post('/api/admin/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const response = await laravelAPI.post('/admin/analytics', req.body, {
      headers: {
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
        Authorization: `Bearer ${(req.session as any).auth_token}`
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
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     EXPRESS API GATEWAY RUNNING        ║
╚════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}
🔗 React Frontend: http://localhost:3000
📡 Laravel Backend: ${LARAVEL_API}
✅ CORS enabled for localhost:3000

Endpoints:
  - GET  /api/health
  - POST /api/csrf-token
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/register
  - POST /api/admin/*
  - And more...

Architecture:
  React (localhost:3000)
    ↓
  Express Gateway (localhost:3001) ← Hidden Implementation
    ↓
  Laravel Backend (${LARAVEL_API}) ← Hidden from Client
  `);
});

export default app;
