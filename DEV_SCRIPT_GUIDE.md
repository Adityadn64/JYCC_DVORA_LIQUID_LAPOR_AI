# 🚀 QUICK DEV SCRIPT GUIDE

**TL;DR - Just run this:**

```powershell
# From root folder
npm install
cd express-server && npm install
cd ..
npm run dev
```

**Then open:** http://localhost:3000

---

## What This Command Does

### Step 1: `npm install`
Installs React, Vue, Express, and all dependencies in root folder
- Reads `src/package.json`
- Installs to `node_modules/`
- Takes ~2-3 minutes

### Step 2: `cd express-server && npm install`
Installs Express server dependencies
- Reads `express-server/package.json`
- Installs Express, Axios, CORS, etc
- Takes ~1-2 minutes

### Step 3: `cd ..`
Go back to root folder

### Step 4: `npm run dev`
Starts BOTH React and Express servers simultaneously

**What happens:**
```
Root package.json says:
"dev": "concurrently \"vite\" \"npm run express-dev\""

This means:
1. Start vite (React dev server) on port 3000
2. Start express (Middleware) on port 3001
3. Both run at the same time
```

---

## Expected Output

When you run `npm run dev`, you should see:

```
> concurrently "vite" "npm run express-dev"

[0] 
[0]   VITE v6.2.0  ready in 1234 ms
[0] 
[0]   ➜  Local:   http://localhost:3000/
[0]   ➜  press h to show help

[1] Server running at http://localhost:3001
[1] Listening on port 3001
```

---

## Verify It's Working

1. **React Frontend:** Open http://localhost:3000 in browser
   - Should see Lapor.ai homepage

2. **Express Middleware:** Open DevTools → Network tab
   - Click on anything
   - Look for requests to `localhost:3001/api/*`
   - **NOT** `localhost:8000` (Laravel hidden ✓)

3. **Laravel Backend:** Open http://localhost:8000 in new tab
   - Should see Laravel page (verify it's running)

---

## Architecture Reminder

```
Browser (3000)
    ↓
React App (makes requests to)
    ↓
Express Server (3001)
    ↓
Laravel API (8000)
```

**Why?** Laravel endpoints are completely hidden from the browser!

---

## Common Issues

### ❌ Error: Port 3000 already in use
**Solution:** Close other apps using port 3000, or:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process
npm run dev
```

### ❌ Error: Cannot find module 'express'
**Solution:** You didn't run `cd express-server && npm install`
```powershell
cd express-server
npm install
cd ..
npm run dev
```

### ❌ Error: CORS error in browser console
**Solution:** Make sure:
1. React on http://localhost:3000 (not 3001)
2. Express running on port 3001
3. Laravel running on port 8000
4. Check DevTools → Network tab for actual error

### ❌ Error: Cannot connect to Laravel
**Solution:** 
1. Start Laravel: `php artisan serve` (port 8000)
2. Check `.env` in express-server has: `LARAVEL_API_URL=http://localhost:8000`
3. Verify Laravel database is set up

---

## Environment Setup

**Create `express-server/.env`:**
```bash
EXPRESS_PORT=3001
LARAVEL_API_URL=http://localhost:8000
NODE_ENV=development
```

Default values already in code, but `.env` overrides them.

---

## What's Running on Each Port

| Port | Service | What It Does |
|------|---------|---|
| 3000 | React App | Serves React frontend |
| 3001 | Express | Middleware that hides Laravel |
| 8000 | Laravel | Actual backend (hidden) |

---

## Keyboard Shortcuts in Development

### Vite (React) - Press 'h' to see help
- `r` - Restart server
- `u` - Show URL
- `c` - Clear console
- `q` - Quit

### Node (Express) - Automatic
- Restarts automatically on file changes (--watch mode)
- Check terminal [1] for Express logs

---

## Stop Development Server

Press `Ctrl + C` in the terminal where you ran `npm run dev`

Both servers will stop.

---

## Next Development Session

```powershell
# Just run this again:
npm run dev

# No need to re-install unless you added new packages
```

---

## Add New Package

If you need to install a new package:

```powershell
# For React dependencies (while in root folder)
npm install package-name

# For Express dependencies
cd express-server
npm install package-name
cd ..

# Then restart: npm run dev
```

---

## Troubleshooting Commands

```powershell
# See all running Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Kill all Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process

# Clear npm cache
npm cache clean --force

# Reinstall from scratch
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

---

## File Changes Auto-Reload

✅ **React code changes:** Auto-refresh in browser (Hot Module Reload)
✅ **Express code changes:** Auto-restart Express server
✅ **Just save file and check browser**

No need to manually restart during development!

---

## Production Build

When ready to deploy:

```powershell
# Build React app for production
npm run build

# Output goes to dist/ folder
# Deploy dist/ folder to production server
```

---

## Summary

**Development:**
```powershell
npm run dev
```

**Production:**
```powershell
npm run build
# Deploy dist/ folder
```

**That's it!** 🚀

---

For more details, see:
- SETUP_AND_RUN.md - Complete setup guide
- QUICK_START.md - Code examples
- FINAL_VERIFICATION_REPORT.md - Full status

