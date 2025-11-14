# Setup & Run Guide - Lapor.ai React + Express + Laravel

## 📋 Prerequisites

Pastikan Anda sudah memiliki:
- ✅ Node.js (v18+) dan npm
- ✅ Laravel running on `http://localhost:8000`
- ✅ MySQL/Database sudah configured
- ✅ Port 3000 dan 3001 tersedia

---

## 🚀 QUICK START - 3 STEPS

### Step 1: Setup Dependencies

**Jalankan dari root folder (`lapor.ai`)**

```powershell
# Install root dependencies
npm install

# Install express-server dependencies
cd express-server
npm install
cd ..
```

### Step 2: Setup Environment Variables

**Create `.env` file di express-server folder:**

```bash
# Copy .env.example ke .env
cd express-server
Copy-Item .env.example -Destination .env
cd ..
```

**Edit `express-server/.env` (optional - sudah ada default value):**
```env
EXPRESS_PORT=3001
LARAVEL_API_URL=http://localhost:8000
NODE_ENV=development
```

### Step 3: Start Development Server

**Jalankan dari root folder:**

```powershell
npm run dev
```

**Expected Output:**
```
> concurrently "vite" "npm run express-dev"

[0] 
[0]   VITE v6.2.0  ready in 1234 ms
[0] 
[0]   ➜  Local:   http://localhost:3000/
[0]   ➜  Press h to show help

[1] 
[1] Server running at http://localhost:3001
[1] Listening on port 3001
```

✅ **Buka browser:** http://localhost:3000

---

## 🔍 Verifikasi Setup

### 1. React App Running
- Buka http://localhost:3000
- Seharusnya melihat halaman utama Lapor.ai

### 2. Express Middleware Running
- Check browser DevTools → Network tab
- Lihat requests ke `http://localhost:3001/api/*`
- **NOT** `http://localhost:8000` (tersembunyi ✓)

### 3. Laravel Backend Running
- Buka http://localhost:8000 di tab browser baru
- Seharusnya melihat Laravel page atau API response

### 4. Database Connected
- Run test login dengan credentials dari seeder:
  - Email: `admin@lapor.ai`
  - Password: `password` (atau sesuai database)

---

## 🛠️ Development Commands

### Run Development Server (Both React + Express)
```powershell
npm run dev
```

### Run Only React (Port 3000)
```powershell
npx vite
```

### Run Only Express (Port 3001)
```powershell
cd express-server
npm run dev
cd ..
```

### Build for Production
```powershell
npm run build
```

### Preview Production Build
```powershell
npm run preview
```

---

## 📂 Project Structure

```
lapor.ai/
├── src/                          # React App
│   ├── App.tsx                   # Main app with routing
│   ├── index.tsx                 # Entry point
│   ├── pages/                    # Page components (8 completed + 4 templates)
│   ├── components/               # Reusable components (Header, Footer)
│   ├── services/                 # API service layer (api.ts)
│   ├── hooks/                    # Custom hooks (useAuth, useFetch)
│   ├── utils/                    # Helpers (helpers.ts)
│   ├── package.json              # React dependencies
│   └── vite.config.ts            # Vite configuration
│
├── express-server/               # Express Middleware
│   ├── server.js                 # Main server (37 endpoints)
│   ├── package.json              # Express dependencies
│   ├── .env.example              # Environment template
│   └── .env                      # Environment variables (create from .env.example)
│
├── app/                          # Laravel App
├── routes/                       # Laravel Routes
├── database/                     # Migrations & Seeders
│
├── package.json                  # Root package (scripts: dev, build, preview)
└── README.md                     # Project documentation
```

---

## 📡 Architecture Overview

```
┌─────────────────────┐
│   Browser (3000)    │
│   React App         │
└──────────┬──────────┘
           │ HTTP Requests
           │ (http://localhost:3001/api/*)
           ▼
┌─────────────────────┐
│  Express Middleware │
│     (Port 3001)     │
│  • Session mgmt     │
│  • CORS handling    │
│  • Auth validation  │
│  • Route forwarding │
└──────────┬──────────┘
           │ HTTP Requests
           │ (http://localhost:8000/*)
           ▼
┌─────────────────────┐
│  Laravel Backend    │
│     (Port 8000)     │
│  • Database ops     │
│  • Business logic   │
│  • Data validation  │
└─────────────────────┘
```

**Why 3 Tiers?**
- Laravel endpoints **HIDDEN** from client ✓
- Single point of control (Express middleware)
- Session & authentication management
- Easy to add logging, rate limiting, etc.

---

## 🔐 Authentication Flow

### Login Flow

1. **React (LoginPage.tsx)**
   - User input email/phone + password
   - Submit form → POST to Express

2. **Express Middleware (server.js)**
   - Receive POST `/api/auth/login`
   - Validate request
   - Forward to Laravel: POST `/api/login`
   - Get token from Laravel response
   - Store in `req.session` (server-side)
   - Return user data & token to React

3. **React Storage**
   - Store token in `localStorage`
   - Store user data in `localStorage`
   - Update `isAuthenticated` state
   - Redirect to `/admin/dashboard`

4. **Protected Routes (App.tsx)**
   - Check `isAuthenticated` before rendering admin pages
   - Redirect to login if not authenticated

### Subsequent Requests

1. React includes token in all requests headers:
   ```typescript
   Authorization: Bearer {token}
   ```

2. Express middleware checks:
   - Token exists in `localStorage`
   - Route requires auth
   - Forward to Laravel with token

3. Laravel validates token and processes request

---

## 🧪 Testing

### Test Login
1. Go to http://localhost:3000/login
2. Enter credentials:
   - Email/Phone/NIP: Check Laravel seeder for valid account
   - Password: Check Laravel seeder
3. Click "Masuk"
4. Should redirect to `/admin/dashboard`

### Test Create Report
1. Go to http://localhost:3000
2. Click "Buat Laporan Sekarang"
3. Fill form:
   - Email, Phone
   - Title, Description
   - Category, Priority
   - Upload files (optional)
4. Click Submit
5. Should redirect to `/report/:id/track`

### Test Report Tracking
1. Go to http://localhost:3000/report/track
2. Enter Report ID
3. See report details and timeline

### Debug Network
1. Open DevTools (F12) → Network tab
2. Filter by `localhost:3001` 
3. Check requests being sent to Express
4. Check response data

---

## ⚠️ Common Issues & Solutions

### Issue: Port 3000 or 3001 Already In Use

**Solution:**
```powershell
# Find process using port 3000
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Or use different ports:
# Edit vite.config.ts for React port
# Edit express-server/.env for Express port
```

### Issue: Laravel API Returns 404

**Check:**
1. Laravel running? `http://localhost:8000`
2. Routes exist? Check `routes/api.php` or `routes/web.php`
3. Database migrated? `php artisan migrate`
4. Database seeded? `php artisan db:seed`

**Fix Express Connection:**
```javascript
// express-server/server.js
const LARAVEL_API = process.env.LARAVEL_API_URL || 'http://localhost:8000';
```

### Issue: CORS Errors in Browser

**Solution:**
Express middleware handles CORS. If still getting errors:
1. Check Express is running on 3001
2. React should be on 3000
3. Check origin in `server.js`:
   ```javascript
   cors({ origin: 'http://localhost:3000' })
   ```

### Issue: Session Not Persisting

**Check:**
1. Cookies enabled in browser?
2. `express-session` configured? ✓ (in server.js)
3. Try different browser (dev tools might block)

---

## 📋 Checklist Sebelum Deploy

- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file created in express-server folder
- [ ] Laravel running on port 8000
- [ ] Database migrated & seeded
- [ ] `npm run dev` starts without errors
- [ ] React app loads on port 3000
- [ ] Express server logs show "Listening on port 3001"
- [ ] Login works with test credentials
- [ ] Create report works
- [ ] Dashboard shows data

---

## 📖 Additional Resources

### Blade to React Conversion
See `SYNTAX_VERIFICATION.md` for complete syntax mapping

### Project Status & Progress
See `PROJECT_STATUS.md` for detailed statistics

### Migration Guide & Architecture
See `MIGRATION_GUIDE.md` for architecture explanation

### Quick Reference
See `QUICK_START.md` for templates and examples

---

## 🎯 Next Steps

### 1. Complete Remaining Pages (4 pages)
Templates ready in `QUICK_START.md`:
- AdminProfilePage.tsx
- AdminManagePage.tsx
- AdminPerformancePage.tsx
- ForgotPasswordPage.tsx

### 2. Add Production Features
- Token refresh mechanism
- Error boundary component
- Loading skeletons
- Toast notifications

### 3. Deploy
- Build: `npm run build`
- Output in `dist/` folder
- Deploy to Vercel, Netlify, or server

---

## 💬 Questions or Issues?

Refer to:
1. `SYNTAX_VERIFICATION.md` - Blade to React conversion details
2. `QUICK_START.md` - Code templates and examples
3. `MIGRATION_GUIDE.md` - Architecture overview
4. Browser DevTools Network tab - Debug API calls
5. Terminal output - Check for server errors

---

**Happy Coding! 🚀**

