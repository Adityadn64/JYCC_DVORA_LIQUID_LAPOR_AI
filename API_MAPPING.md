# 📡 API ENDPOINT MAPPING - React to Laravel

## Overview
This document maps all React API calls (`src/services/api.ts`) to their corresponding Laravel routes (`routes/web.php`).

---

## ✅ HOME SERVICE

### getHome()
```typescript
// React
const response = await homeService.getHome();

// HTTP Request
POST /api/ (Express) → POST / (Laravel HomeController@index)
```

---

## ✅ CSRF SERVICE

### getCsrfToken()
```typescript
// React
const response = await csrfService.getCsrfToken();

// HTTP Request
GET /api/csrf-token (Express) → GET /csrf-token (Laravel)
```

---

## ✅ AUTH SERVICE

### login()
```typescript
// React
const response = await authService.login({ 
  login_identifier: "email@example.com", 
  password: "password123" 
});

// HTTP Request
POST /api/auth/login (Express) → POST /login (Laravel LoginController@login)
```

### logout()
```typescript
// React
const response = await authService.logout();

// HTTP Request
POST /api/auth/logout (Express) → POST /logout (Laravel LoginController@logout)
```

### registerStart()
```typescript
// React
const response = await authService.registerStart({ 
  email: "admin@example.com", 
  phone: "081234567890" 
});

// HTTP Request
POST /api/auth/register/start (Express) → POST /register/send (Laravel RegisterController@startRegistration)
```

### registerVerifyOtp()
```typescript
// React
const response = await authService.registerVerifyOtp({ 
  email: "admin@example.com", 
  otp_code: "123456" 
});

// HTTP Request
POST /api/auth/register/verify (Express) → POST /register/verify/send (Laravel RegisterController@completeRegistration)
```

### register()
```typescript
// React
const response = await authService.register({ 
  email: "admin@example.com", 
  password: "password123", 
  password_confirmation: "password123" 
});

// HTTP Request
POST /api/auth/register (Express) → POST /register (Laravel RegisterController@showRegistrationForm)
```

### passwordResetRequest()
```typescript
// React
const response = await authService.passwordResetRequest("admin@example.com");

// HTTP Request
POST /api/auth/password-reset/request (Express) → POST /forgot-password (Laravel ForgotPasswordController@sendResetLinkEmail)
```

### passwordResetVerify()
```typescript
// React
const response = await authService.passwordResetVerify({ 
  email: "admin@example.com", 
  token: "abc123...", 
  otp_code: "654321" 
});

// HTTP Request
POST /api/auth/password-reset/verify (Express) → POST /reset-password/{token} (Laravel ForgotPasswordController@showResetForm)
```

### passwordResetConfirm()
```typescript
// React
const response = await authService.passwordResetConfirm({ 
  email: "admin@example.com", 
  token: "abc123...", 
  password: "newpassword123", 
  password_confirmation: "newpassword123" 
});

// HTTP Request
POST /api/auth/password-reset/confirm (Express) → POST /reset-password (Laravel ForgotPasswordController@reset)
```

---

## ✅ REPORT SERVICE

### createReport()
```typescript
// React
const formData = new FormData();
formData.append('description', 'Report description');
formData.append('location', 'Jakarta');
formData.append('images', file1);
formData.append('videos', file2);

const response = await reportService.createReport(formData);

// HTTP Request
POST /api/lapor (Express) → POST /lapor (Laravel ReportController@store)
```

### searchReports()
```typescript
// React
const response = await reportService.searchReports("REPORT-001");

// HTTP Request
POST /api/lacak (Express) → POST /lacak (Laravel ReportController@trackIndex)
```

### getReportDetail()
```typescript
// React
const response = await reportService.getReportDetail("REPORT-001");

// HTTP Request
POST /api/lacak/REPORT-001 (Express) → POST /lacak/{report} (Laravel ReportController@trackShow)
```

---

## ✅ ADMIN DASHBOARD SERVICE

### getStats()
```typescript
// React
const response = await adminDashboardService.getStats();

// HTTP Request
POST /api/admin/dashboard (Express) → POST /admin/dashboard (Laravel DashboardController@index)
```

### filterReports()
```typescript
// React
const response = await adminDashboardService.filterReports({
  search_term: "keyword",
  search_location: "Jakarta",
  search_priority: "high",
  search_admin: "admin_id",
  search_id: "REPORT-001",
  sort: "updated_at_desc"
});

// HTTP Request
POST /api/admin/dashboard (Express) → POST /admin/dashboard (Laravel DashboardController@index)
```

---

## ✅ ADMIN ANALYTICS SERVICE

### getAnalytics()
```typescript
// React
const response = await adminAnalyticsService.getAnalytics({
  date_start: "2025-01-01",
  date_end: "2025-01-31",
  category: "category_name",
  status: "finished",
  service_code: "DINKES",
  assignee_admin_id: "admin_id",
  priority: "high",
  location: "Jakarta"
});

// HTTP Request
POST /api/admin/analytics (Express) → POST /admin/analytics (Laravel AnalyticsController@index)
```

### filterAnalytics()
```typescript
// React
const response = await adminAnalyticsService.filterAnalytics({
  // Same filters as getAnalytics()
});

// HTTP Request
POST /api/admin/analytics (Express) → POST /admin/analytics (Laravel AnalyticsController@index)
```

### exportAnalytics()
```typescript
// React
const response = await adminAnalyticsService.exportAnalytics("csv", {
  date_start: "2025-01-01",
  date_end: "2025-01-31"
});

// HTTP Request
POST /api/admin/analytics/export-reports (Express) → POST /admin/analytics/export-reports (Laravel AnalyticsController@exportReports)
```

---

## ✅ ADMIN PROFILE SERVICE

### getProfile()
```typescript
// React
const response = await adminProfileService.getProfile();

// HTTP Request
POST /api/admin/profile (Express) → POST /admin/profile (Laravel ProfileController@show)
```

### updateProfile()
```typescript
// React
const formData = new FormData();
formData.append('full_name', 'John Doe');
formData.append('profile_picture', file);

const response = await adminProfileService.updateProfile({
  full_name: 'John Doe',
  profile_picture: file
});

// HTTP Request
POST /api/admin/profile/update-info (Express) → PUT /admin/profile/update-info (Laravel ProfileController@updateInfo)
```

### changePassword()
```typescript
// React
const response = await adminProfileService.changePassword({
  current_password: "oldpass123",
  password: "newpass123",
  password_confirmation: "newpass123"
});

// HTTP Request
POST /api/admin/profile/update-password (Express) → POST /admin/profile/update-password (Laravel ProfileController@updatePassword)
```

### changeContact()
```typescript
// React
const response = await adminProfileService.changeContact({
  email: "newemail@example.com",
  phone: "081234567890"
});

// HTTP Request
POST /api/admin/profile/request-email-change (Express) → POST /admin/profile/request-email-change (Laravel ProfileController@requestEmailChange)
```

---

## ✅ ADMIN MANAGE SERVICE

### listAdmins()
```typescript
// React
const response = await adminManageService.listAdmins({
  keyword: "john",
  role: "base_admin",
  status: "active",
  service_code: "DINKES"
});

// HTTP Request
POST /api/admin/manage (Express) → POST /admin/manage (Laravel AdminManagementController@index)
```

### createAdmin()
```typescript
// React
const response = await adminManageService.createAdmin({
  full_name: "John Doe",
  email: "john@example.com",
  phone: "081234567890",
  nip: "19900101001",
  service_code: "DINKES"
});

// HTTP Request
POST /api/admin/manage (Express) → POST /admin/manage (Laravel AdminManagementController@store)
```

### updateAdmin()
```typescript
// React
const response = await adminManageService.updateAdmin("admin_id", {
  full_name: "Jane Doe",
  email: "jane@example.com"
});

// HTTP Request
PUT /api/admin/manage/admin_id (Express) → PUT /admin/manage/{admin} (Laravel AdminManagementController@update)
```

### deleteAdmin()
```typescript
// React
const response = await adminManageService.deleteAdmin("admin_id");

// HTTP Request
DELETE /api/admin/manage/admin_id (Express) → DELETE /admin/manage/{admin} (Laravel AdminManagementController@delete)
```

### toggleAdminStatus()
```typescript
// React
const response = await adminManageService.toggleAdminStatus("admin_id");

// HTTP Request
POST /api/admin/manage/admin_id/toggle-status (Express) → POST /admin/manage/{admin}/toggle-status (Laravel AdminManagementController@toggleStatus)
```

### resetAdminPassword()
```typescript
// React
const response = await adminManageService.resetAdminPassword("admin_id");

// HTTP Request
POST /api/admin/manage/admin_id/reset-password (Express) → POST /admin/manage/{admin}/reset-password (Laravel AdminManagementController@sendPasswordReset)
```

---

## ✅ ADMIN PERFORMANCE SERVICE

### getPerformance()
```typescript
// React
const response = await adminPerformanceService.getPerformance({
  date_start: "2025-01-01",
  date_end: "2025-01-31",
  scope_type: "all"
});

// HTTP Request
POST /api/admin/performance (Express) → GET /admin/performance (Laravel PerformanceController@index)
```

### exportPerformance()
```typescript
// React
const response = await adminPerformanceService.exportPerformance("csv", {
  date_start: "2025-01-01",
  date_end: "2025-01-31"
});

// HTTP Request
POST /api/admin/performance/export (Express) → POST /admin/performance/export (Laravel PerformanceController@export)
```

---

## 📝 REQUEST/RESPONSE FLOW

### Interceptors
All requests automatically include:
- ✅ **Authorization Header**: `Bearer {auth_token}` (if logged in)
- ✅ **CSRF Token Header**: `X-CSRF-TOKEN: {csrf_token}` (if available)

### Response Handling
- ✅ Store `auth_token` from response if provided
- ✅ Store `csrf_token` from response if provided
- ✅ **401 Unauthorized**: Clear tokens and redirect to `/login`
- ✅ **403 Forbidden**: Log error and show message

---

## 🔑 Authentication Flow

1. **CSRF Token Initialization** (on app mount)
   ```
   App.tsx useEffect → csrfService.getCsrfToken()
   → GET /api/csrf-token → POST /sanctum/csrf-cookie (Laravel)
   → Store csrf_token in localStorage
   ```

2. **Login**
   ```
   LoginPage → authService.login(credentials)
   → POST /api/auth/login → POST /login (Laravel)
   → Store auth_token in localStorage
   → Redirect to /admin/dashboard
   ```

3. **Protected Requests**
   ```
   Any API call → Request Interceptor
   → Attach Authorization: Bearer {auth_token}
   → Attach X-CSRF-TOKEN: {csrf_token}
   → Send to Express → Forward to Laravel
   ```

4. **Logout**
   ```
   AdminDashboardPage → authService.logout()
   → POST /api/auth/logout → POST /logout (Laravel)
   → Clear localStorage
   → Redirect to /login
   ```

---

## ⚠️ Important Notes

1. **All routes go through Express middleware** at `http://localhost:3001/api`
2. **Express forwards to Laravel** at `http://localhost:8000`
3. **Session management** is handled by Express (stores auth tokens)
4. **CSRF tokens** flow from Laravel → Express → React → Every Request
5. **Bearer tokens** stored in localStorage → Auto-attached by interceptor
6. **All admin endpoints** require Bearer token (protected by authMiddleware in server.ts)
7. **Some endpoints use POST** instead of traditional GET/PUT (following Laravel design)

---

## 📞 Testing

To verify endpoint mapping:
1. Open DevTools → Network tab
2. Make a request from React
3. Check URL: Should be `http://localhost:3001/api/...`
4. Check Headers: Should have `Authorization` and `X-CSRF-TOKEN`
5. Check Laravel logs: Should see corresponding Laravel route being accessed

---

**Last Updated:** November 14, 2025
**Status:** ✅ All endpoints mapped and synchronized
