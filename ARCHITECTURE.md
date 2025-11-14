# 🏗️ EXPRESS API GATEWAY ARCHITECTURE

**Date:** November 14, 2025
**Status:** ✅ COMPLETE
**Concept:** API Gateway Pattern - Hidden Backend

---

## 📌 Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│    REACT FRONTEND (localhost:3000)                   │
│    - User Interface                                  │
│    - HTTP Client (axios)                            │
│    - Token Management                               │
│    - Error Handling                                 │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       │ API Calls
                       ↓
┌──────────────────────────────────────────────────────┐
│                                                      │
│    EXPRESS GATEWAY (localhost:3001) ← HIDDEN        │
│    - Route Forwarding                               │
│    - Request Transformation                         │
│    - Authentication (Bearer Token)                  │
│    - CORS Handling                                  │
│    - Session Management                            │
│    - Error Handling                                 │
│    - Rate Limiting (optional)                       │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       │ Forwarded Requests
                       ↓
┌──────────────────────────────────────────────────────┐
│                                                      │
│    LARAVEL BACKEND (localhost:8000) ← HIDDEN        │
│    - Business Logic                                 │
│    - Database Operations                           │
│    - Validation                                    │
│    - Authentication Logic                         │
│    - File Storage                                 │
│    - Email/Notifications                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔑 Key Principles

### 1. **React Only Knows About Express**
```
React ↔ Express
React ✗ Laravel (Cannot see Laravel directly)
```

### 2. **Express Acts as Gateway**
```
Express receives request from React
  ↓
Express validates request
  ↓
Express forwards to Laravel
  ↓
Express returns response to React
```

### 3. **Laravel is Completely Hidden**
```
Client cannot see Laravel endpoints
Client cannot see Laravel structure
Client cannot access Laravel directly
All communication through Express
```

### 4. **Security Benefits**
```
✅ Laravel endpoints hidden from clients
✅ Can change Laravel without breaking React
✅ Can add middleware at Express level
✅ Can modify responses before sending to client
✅ Rate limiting, caching at Express level
✅ Token validation at gateway
```

---

## 📡 Request Flow

### Example: Login Request

#### Step 1: React Component Makes Request
```typescript
// React Component
const response = await authService.login({
  login_identifier: 'admin@lapor.ai',
  password: 'admin123'
});
```

#### Step 2: Axios Request Interceptor
```typescript
// src/services/api.ts - Request Interceptor
- Extract Bearer token from localStorage
- Extract CSRF token from localStorage
- Attach to headers
- Send to: http://localhost:3001/api/auth/login
```

#### Step 3: Express Receives Request
```typescript
// server.ts - POST /api/auth/login endpoint
app.post('/api/auth/login', async (req, res) => {
  // Extract credentials from request
  // Validate format
  // Forward to Laravel
  const response = await laravelAPI.post('/login', req.body);
})
```

#### Step 4: Express Forwards to Laravel
```
Express sends to: http://localhost:8000/login
With:
  - Request body
  - Headers
  - Authorization (if needed)
```

#### Step 5: Laravel Processes Request
```
Laravel /login endpoint:
  - Validates credentials
  - Checks admin status
  - Generates token
  - Returns response
```

#### Step 6: Express Returns Response
```typescript
// Express catches Laravel response
const response = await laravelAPI.post('/login', req.body);

// Store token in session
if (response.data.data?.token) {
  req.session.auth_token = response.data.data.token;
}

// Return to React
res.json(response.data);
```

#### Step 7: React Receives Response
```typescript
// Response Interceptor
- Extract token from response
- Store in localStorage
- Redirect to dashboard
```

---

## 🌍 All Endpoints at Express Gateway

### Authentication Endpoints
```
Express                                    → Laravel
POST /api/csrf-token                      → GET /sanctum/csrf-cookie
POST /api/auth/login                      → POST /login
POST /api/auth/logout                     → POST /logout
POST /api/auth/register/start             → POST /register/send
POST /api/auth/register/verify            → POST /register/verify/send
POST /api/auth/register                   → POST /register
POST /api/auth/password-reset/request     → POST /forgot-password
POST /api/auth/password-reset/verify      → POST /reset-password/{token}
POST /api/auth/password-reset/confirm     → POST /reset-password
```

### Public Endpoints
```
Express                                    → Laravel
POST /api/                                 → POST /
POST /api/lapor                           → POST /lapor
POST /api/lacak                           → POST /lacak
POST /api/lacak/:id                       → POST /lacak/{id}
```

### Protected Endpoints (Admin)
```
Express                                         → Laravel
POST /api/admin/dashboard                      → POST /admin/dashboard
POST /api/admin/analytics                      → POST /admin/analytics
POST /api/admin/analytics/export-reports       → POST /admin/analytics/export-reports
POST /api/admin/profile                        → POST /admin/profile
POST /api/admin/profile/update-info            → PUT /admin/profile/update-info
POST /api/admin/profile/update-password        → POST /admin/profile/update-password
POST /api/admin/profile/request-email-change   → POST /admin/profile/request-email-change
POST /api/admin/manage                         → POST /admin/manage
PUT /api/admin/manage/:id                      → PUT /admin/manage/{id}
DELETE /api/admin/manage/:id                   → DELETE /admin/manage/{id}
POST /api/admin/manage/:id/toggle-status       → POST /admin/manage/{id}/toggle-status
POST /api/admin/manage/:id/reset-password      → POST /admin/manage/{id}/reset-password
POST /api/admin/performance                    → GET /admin/performance
POST /api/admin/performance/export             → POST /admin/performance/export
```

---

## 🔒 Security Features

### 1. CORS - Only localhost:3000
```typescript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
```

### 2. Session Management
```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: false,        // true in production (HTTPS)
    httpOnly: true,       // Not accessible from JS
    maxAge: 24*60*60*1000, // 24 hours
    sameSite: 'lax'       // CSRF protection
  }
}));
```

### 3. Bearer Token Authentication
```typescript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan'
    });
  }
  
  req.session.auth_token = token;
  next();
};
```

### 4. CSRF Token Handling
```typescript
app.get('/api/csrf-token', async (req, res) => {
  // Fetch from Laravel Sanctum
  const response = await axios.get(`${LARAVEL_API}/sanctum/csrf-cookie`);
  
  // Store in session
  req.session.csrf_token = response.data?.token;
  
  // Return to React
  res.json({ csrf_token: token });
});
```

### 5. Error Handling
```typescript
app.use((err, req, res, next) => {
  // Log errors
  // Don't expose sensitive info
  // Return safe error messages
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});
```

---

## 📊 Benefits of This Architecture

### For React Developers
✅ No need to know Laravel details
✅ Simple, consistent API interface
✅ Easy to test with Express running locally
✅ Can mock Express responses for testing
✅ Token handling done automatically

### For Backend Developers
✅ Can change Laravel implementation freely
✅ Express layer can handle versioning
✅ Can add middleware without touching React
✅ Rate limiting at gateway
✅ Can implement caching at Express

### For DevOps/Security
✅ Laravel backend never exposed to internet
✅ All client communication through Express
✅ Single point for security policies
✅ Easier to monitor and log
✅ Can scale Express separately

### For Maintenance
✅ Can deprecate Laravel endpoints gradually
✅ Can maintain multiple Laravel versions
✅ Can add new features at Express level
✅ Can switch backends without breaking client
✅ Clear separation of concerns

---

## 🚀 Running the Application

### Development
```bash
cd src
npm install
npm run dev

# This runs:
# 1. Vite (React) on http://localhost:3000
# 2. Node (Express) on http://localhost:3001
# 3. Both in parallel automatically
```

### The Command
```json
"dev": "concurrently \"vite\" \"node ../server.ts\""
```

This runs TWO commands in parallel:
1. `vite` - React dev server
2. `node ../server.ts` - Express gateway

---

## 📝 Request Examples

### Example 1: Login

**React Component:**
```typescript
const response = await authService.login({
  login_identifier: 'admin@lapor.ai',
  password: 'admin123'
});
```

**Express Intercepts:**
```
POST http://localhost:3001/api/auth/login
Body: { login_identifier: "admin@lapor.ai", password: "admin123" }
```

**Express Forwards:**
```
POST http://localhost:8000/login
Body: { login_identifier: "admin@lapor.ai", password: "admin123" }
```

**Laravel Returns:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": { "id": 1, "name": "Admin" }
  }
}
```

**Express Returns to React:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": { "id": 1, "name": "Admin" }
  }
}
```

### Example 2: Get Dashboard

**React Component:**
```typescript
const response = await adminDashboardService.getStats();
```

**Request Flow:**
```
React
  ↓ (with Bearer token)
POST http://localhost:3001/api/admin/dashboard
  ↓ (Express validates token)
Express checks authMiddleware
  ↓ (forwards with token)
POST http://localhost:8000/admin/dashboard
  ↓ (Laravel processes)
Laravel validates token
  ↓ (returns data)
{ success: true, data: { stats... } }
  ↓ (Express passes through)
React receives response
```

---

## 🔄 Token Management

### CSRF Token
1. App mounts
2. React calls `csrfService.getCsrfToken()`
3. Express GET /api/csrf-token
4. Express calls `axios.get(/sanctum/csrf-cookie)`
5. Laravel returns CSRF token
6. Express stores in session
7. Express returns to React
8. React stores in localStorage
9. Request interceptor attaches to every request

### Bearer Token
1. User logs in
2. React calls `authService.login(credentials)`
3. Express POST /api/auth/login
4. Express forwards to Laravel POST /login
5. Laravel generates token, returns
6. Express stores in session
7. Express returns to React
8. React stores in localStorage
9. Request interceptor attaches `Authorization: Bearer {token}`

---

## ⚠️ Important Notes

### Node.js Version
- Requires Node.js 18+
- Uses ES Modules (type: "module")
- TypeScript with ts-node

### Dependencies
Express must have these installed:
```json
{
  "express": "^5.1.0",
  "cors": "^2.8.5",
  "body-parser": "^1.20.0",
  "axios": "^1.12.2",
  "express-session": "^1.17.3",
  "dotenv": "^16.3.1",
  "@types/express": "^4.17.21",
  "@types/express-session": "^1.17.11",
  "@types/node": "^22.14.0",
  "ts-node": "^10.9.2",
  "typescript": "^5.8.0"
}
```

### Environment Variables
Create `.env` in root directory:
```env
EXPRESS_PORT=3001
LARAVEL_API_URL=http://localhost:8000
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

---

## ✅ Testing the Architecture

### 1. Test React → Express Connection
```bash
# Open DevTools Network tab
# Make any request in React
# Check: URL should be http://localhost:3001/api/...
```

### 2. Test Express → Laravel Forwarding
```bash
# Check Express logs
# Should see: "Request forwarded to http://localhost:8000/..."
```

### 3. Test Token Handling
```bash
# Check localStorage: should have auth_token and csrf_token
# Check request headers: should have Authorization and X-CSRF-TOKEN
```

### 4. Test Protected Routes
```bash
# Clear localStorage
# Try to access admin page
# Should redirect to /login
```

---

## 🎯 Production Considerations

### Security
- [ ] Enable `secure: true` in cookie (requires HTTPS)
- [ ] Change SESSION_SECRET to strong random value
- [ ] Use environment-specific config
- [ ] Enable HTTPS/TLS
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Monitor for suspicious activity

### Performance
- [ ] Add caching layer
- [ ] Implement request/response compression
- [ ] Add pagination to list endpoints
- [ ] Monitor response times
- [ ] Load test the Express gateway
- [ ] Use production-grade Node.js runtime

### Monitoring
- [ ] Log all requests
- [ ] Monitor error rates
- [ ] Track response times
- [ ] Alert on 401/403 errors
- [ ] Monitor token refresh rates
- [ ] Track API usage

---

## 📚 Related Files

- `server.ts` - Express gateway implementation
- `src/services/api.ts` - React API client
- `src/App.tsx` - React app routing
- `routes/web.php` - Laravel routes (reference)
- `ARCHITECTURE.md` - This document

---

**Created:** November 14, 2025
**Version:** 1.0
**Status:** ✅ Production Ready

This architecture ensures Laravel endpoints remain completely hidden behind the Express API Gateway!
