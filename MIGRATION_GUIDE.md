# 🚀 Migrasi Lapor.ai: Blade → React + Express Middleware

## 📋 Ringkasan Proyek

Migrasi lengkap dari **Laravel Blade Templates** ke **React** dengan **Express Middleware Server** sebagai proxy, sehingga endpoint Laravel tersembunyi dan tidak dapat diakses langsung.

### Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                     │
│                     (Port 3000)                         │
└───────────────────────┬─────────────────────────────────┘
                        │
                   HTTP Requests
                   (POST/GET)
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              EXPRESS MIDDLEWARE SERVER                   │
│                    (Port 3001)                          │
│                                                         │
│  - Authentication Management                          │
│  - Request Validation & Transformation               │
│  - Session Management                                │
│  - Token Management                                  │
│  - Response Handling                                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                   HTTP Requests
                   (POST/PUT)
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│               LARAVEL API BACKEND                       │
│                  (Port 8000)                           │
│                                                         │
│  - Business Logic                                     │
│  - Database Operations                               │
│  - Authentication & Authorization                    │
│  - Email Notifications                               │
└─────────────────────────────────────────────────────────┘
```

## 📁 Struktur Direktori

```
lapor.ai/
├── express-server/                    # Express Middleware Server
│   ├── package.json
│   ├── server.js                      # Main server file
│   └── .env.example
│
├── src/                               # React Frontend
│   ├── App.tsx                        # Main App component dengan routing
│   ├── index.tsx                      # Entry point
│   ├── pages/                         # Page components
│   │   ├── HomePage.tsx               # Home page (converted from main.blade.php)
│   │   ├── LoginPage.tsx              # Login page (converted from login.blade.php)
│   │   ├── AdminDashboardPage.tsx     # Admin dashboard (converted from dashboard.blade.php)
│   │   ├── AdminAnalyticsPage.tsx     # Analytics page
│   │   ├── AdminProfilePage.tsx       # Profile page
│   │   ├── AdminManagePage.tsx        # Admin management
│   │   ├── AdminPerformancePage.tsx   # Performance page
│   │   ├── RegisterPage.tsx           # Registration
│   │   ├── ReportCreatePage.tsx       # Create report
│   │   ├── ReportTrackPage.tsx        # Track reports
│   │   └── ReportTrackShowPage.tsx    # Report details
│   │
│   ├── components/                    # Reusable components
│   │   ├── Header.tsx                 # Navigation header
│   │   └── Footer.tsx                 # Footer
│   │
│   ├── services/                      # API services
│   │   └── api.ts                     # All API calls (calls Express)
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useAuth.ts                 # Authentication hook
│   │   └── useFetch.ts                # Data fetching hook
│   │
│   ├── utils/                         # Utility functions
│   │   └── helpers.ts                 # Helper functions
│   │
│   └── package.json
│
└── resources/
    └── views/                         # Blade files (for reference, deprecated)
```

## 🔄 Data Flow

### 1. **Request Flow**

```
User Action (Click, Form Submit)
    ↓
React Component State Update
    ↓
Call API Service (services/api.ts)
    ↓
Axios POST to Express Server (http://localhost:3001/api/...)
    ↓
Express Receives Request
  - Validate CSRF token (if needed)
  - Check authentication
  - Transform request data
    ↓
Forward to Laravel API (http://localhost:8000/...)
    ↓
Laravel Process
  - Validate input
  - Database operations
  - Business logic
    ↓
Return Response to Express
    ↓
Express Transform Response
  - Format response
  - Handle errors
  - Set session/cookies
    ↓
Return to React
    ↓
Update State & Re-render UI
```

### 2. **Authentication Flow**

```
User Submits Login Form
    ↓
React: authService.login(credentials)
    ↓
Express Receives POST /api/auth/login
    ↓
Express Forwards to Laravel: POST /login
    ↓
Laravel Validates & Returns Token
    ↓
Express:
  - Stores token in session
  - Sets auth header for future requests
  - Returns token to React
    ↓
React:
  - Stores token in localStorage
  - Updates auth state
  - Redirects to dashboard
```

## 🔌 Express Server Routes

### Public Endpoints

```
POST /api/home                              # Get home page data
POST /api/reports                           # Create report
POST /api/reports/track                     # Get all reports for tracking
POST /api/reports/:id/track                 # Get single report tracking
```

### Authentication Endpoints

```
POST /api/auth/login                        # User login
POST /api/auth/logout                       # User logout
POST /api/auth/register                     # User registration
POST /api/auth/register/start              # Start registration process
POST /api/auth/register/verify              # Verify registration form
POST /api/auth/register/verify/send         # Send verification
POST /api/auth/forgot-password              # Request password reset
POST /api/auth/reset-password/:token        # Show reset form
POST /api/auth/reset-password               # Reset password
```

### Admin Endpoints (Requires Authentication)

```
POST /api/admin/dashboard                   # Dashboard data
POST /api/admin/analytics                   # Analytics data
POST /api/admin/analytics/export            # Export reports
POST /api/admin/profile                     # Get admin profile
POST /api/admin/profile/export              # Export profile
PUT  /api/admin/profile/info                # Update profile info
POST /api/admin/profile/picture             # Update profile picture
POST /api/admin/profile/kta                 # Update KTA scan
POST /api/admin/profile/password            # Update password
POST /api/admin/profile/deactivate          # Deactivate account
POST /api/admin/profile/email/request       # Request email change
POST /api/admin/profile/email/verify        # Verify email change
POST /api/admin/profile/phone/request       # Request phone change
POST /api/admin/profile/phone/verify        # Verify phone change

# Admin Management (System Admin Only)
POST /api/admin/manage                      # List admins
POST /api/admin/manage/requests             # Pending requests
POST /api/admin/manage/:id/accept           # Accept admin
POST /api/admin/manage/:id/reject           # Reject admin
POST /api/admin/manage/store                # Create admin
PUT  /api/admin/manage/:id                  # Update admin
POST /api/admin/manage/:id/toggle-status    # Toggle admin status
POST /api/admin/manage/:id/reset-password   # Send password reset
POST /api/admin/manage/:id/activity         # Admin activity

# Performance (System Admin Only)
GET  /api/admin/performance                 # Performance metrics
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js v18+
- npm atau yarn
- Laravel server running on port 8000

### 1. Install Express Dependencies

```bash
cd express-server
npm install
cp .env.example .env
```

Edit `.env`:
```
EXPRESS_PORT=3001
LARAVEL_API_URL=http://localhost:8000
NODE_ENV=development
```

### 2. Install React Dependencies

```bash
cd src
npm install
```

### 3. Update Vite Config (Optional)

The vite.config.ts sudah dikonfigurasi untuk menjalankan Express server secara bersamaan.

### 4. Run Development Server

```bash
# From root directory (lapor.ai/)
npm run dev
```

Ini akan menjalankan:
- **React Vite Server**: http://localhost:3000
- **Express Middleware**: http://localhost:3001
- **Laravel API**: http://localhost:8000 (harus sudah running)

## 📝 Migrasi Blade → React

### Blade Direktif Conversions

| Blade | React | Contoh |
|-------|-------|--------|
| `@if` | `{condition &&` | `{isLoading && <div>Loading...</div>}` |
| `@foreach` | `.map()` | `{items.map((item) => <div key={item.id}>{item.name}</div>)}` |
| `@auth` | `{isAuth &&` | `{isAuth && <AdminMenu />}` |
| `@guest` | `{!isAuth &&` | `{!isAuth && <LoginLink />}` |
| `{{ variable }}` | `{variable}` | `<h1>{title}</h1>` |
| `{!! html !!}` | `dangerouslySetInnerHTML` | `<div dangerouslySetInnerHTML={{__html: html}} />` |
| `{{ route('name') }}` | `useNavigate()` | `navigate('/path')` |
| `@csrf` | Header auto | Express handle CSRF |

### Contoh Konversi

**Blade (login.blade.php):**
```blade
@extends('layouts.app')

@section('content')
    <div class="max-w-md mx-auto">
        @if($errors->has('login_identifier'))
            <div class="error">{{ $errors->first('login_identifier') }}</div>
        @endif
        
        <form action="{{ route('login.attempt') }}" method="POST">
            @csrf
            <input type="text" name="login_identifier" value="{{ old('login_identifier') }}">
            <button type="submit">Login</button>
        </form>
    </div>
@endsection
```

**React (LoginPage.tsx):**
```tsx
export default function LoginPage() {
  const [formData, setFormData] = useState({ login_identifier: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login(formData);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.login_identifier);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="login_identifier"
          value={formData.login_identifier}
          onChange={(e) => setFormData({...formData, login_identifier: e.target.value})}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
```

## 🔐 Security Considerations

### 1. **CORS Configuration**

Express sudah dikonfigurasi untuk accept requests dari `http://localhost:3000`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 2. **Session Management**

Express menggunakan express-session untuk session management:

```javascript
app.use(session({
  secret: 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
```

### 3. **Token Storage**

- Tokens disimpan di Express session (httpOnly cookies)
- React menyimpan di localStorage untuk persistence
- Setiap request ke Express include credentials

### 4. **Authorization**

Express middleware melakukan auth check:

```javascript
const authMiddleware = (req, res, next) => {
  if (!req.session.token) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
  next();
};
```

## 📊 Blade Files to React Pages Mapping

| Blade File | React Component | Status |
|------------|-----------------|--------|
| main.blade.php | HomePage.tsx | ✅ Created |
| auth/login.blade.php | LoginPage.tsx | ✅ Created |
| admin/dashboard.blade.php | AdminDashboardPage.tsx | ✅ Created |
| auth/register.blade.php | RegisterPage.tsx | ⏳ TODO |
| report/create.blade.php | ReportCreatePage.tsx | ⏳ TODO |
| report/track_index.blade.php | ReportTrackPage.tsx | ⏳ TODO |
| report/track_show.blade.php | ReportTrackShowPage.tsx | ⏳ TODO |
| admin/analytics.blade.php | AdminAnalyticsPage.tsx | ⏳ TODO |
| admin/profile.blade.php | AdminProfilePage.tsx | ⏳ TODO |
| admin/manage.blade.php | AdminManagePage.tsx | ⏳ TODO |
| admin/performance.blade.php | AdminPerformancePage.tsx | ⏳ TODO |

## 🧪 Testing

### Manual Testing Checklist

- [ ] React app loads on localhost:3000
- [ ] Express server runs on localhost:3001
- [ ] Home page displays correctly
- [ ] Login form submits and validates
- [ ] Successful login redirects to dashboard
- [ ] Admin dashboard displays data
- [ ] Report creation works
- [ ] Report tracking works
- [ ] Logout clears session

### Example Test Call

```bash
# Test Express health
curl http://localhost:3001/api/health

# Test login (from React or curl)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login_identifier":"user@example.com","password":"password"}'
```

## 🐛 Debugging

### Enable Logging

Edit `express-server/server.js`:

```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### Check Browser Console

React errors akan ditampilkan di browser console.

### Check Express Logs

Express server logs output ke terminal.

## ⚠️ Common Issues & Solutions

### 1. **CORS Error**

**Problem:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:** Check Express CORS configuration matches React port

### 2. **401 Unauthorized**

**Problem:** `Unauthorized` error when accessing admin routes

**Solution:** Ensure token is stored in session and included in request

### 3. **Cannot find module**

**Problem:** Dependencies tidak terinstall

**Solution:** 
```bash
npm install  # di root src folder dan express-server folder
```

### 4. **Laravel API tidak accessible**

**Problem:** Express tidak bisa connect ke Laravel

**Solution:**
- Pastikan Laravel running on port 8000
- Check `.env` di express-server: `LARAVEL_API_URL=http://localhost:8000`
- Pastikan laravel `.env` punya `APP_URL=http://localhost:8000`

## 📚 Resources

- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Axios Documentation](https://axios-http.com)
- [React Router Documentation](https://reactrouter.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## ✅ Next Steps

1. ✅ Express server created dengan semua routes
2. ✅ API service layer dibuat
3. ✅ HomePage, LoginPage, AdminDashboardPage dibuat
4. ⏳ Tambahkan remaining pages (Register, ReportCreate, etc)
5. ⏳ Implementasi charts (Chart.js atau Recharts)
6. ⏳ Add error handling & validation
7. ⏳ Setup authentication properly
8. ⏳ Test semua functionality
9. ⏳ Update Laravel routes (optional untuk security)
10. ⏳ Deploy ke production

---

**Last Updated:** 14 November 2025
**Status:** In Progress 🚀
