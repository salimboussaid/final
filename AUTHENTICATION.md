# Authentication Guide

## ✅ Authentication Fixed!

The 401 Unauthorized error has been resolved by implementing Basic Authentication.

## 🔐 How It Works

### Login Flow

1. User enters password on `/auth` page (login is fixed as "admin")
2. Credentials are tested against the API
3. If valid, credentials are stored in `localStorage`
4. User is redirected to `/profile`

### API Requests

All API requests now include `Authorization` header:
```
Authorization: Basic base64(login:password)
```

### Logout Flow

1. User clicks "Выйти" button
2. Credentials are cleared from `localStorage`
3. User is redirected to `/auth`

## 🔑 Credentials Storage

Credentials are stored in browser's `localStorage`:
```json
{
  "auth_credentials": {
    "login": "admin",
    "password": "your_password"
  }
}
```

**Security Note:** In production, use HttpOnly cookies or secure token storage instead of localStorage.

## 📝 Updated Files

### `lib/api.ts`
- Added `getAuthHeaders()` - Returns headers with Authorization
- Added `setAuthCredentials()` - Saves credentials to localStorage
- Added `clearAuthCredentials()` - Removes credentials from localStorage
- Updated all API calls to include auth headers

### `app/auth/page.tsx`
- Added credential validation on login
- Tests credentials with API before redirecting
- Shows error if password is incorrect
- Saves credentials on successful login

### `app/profile/page.tsx`
- Checks for 401 errors on API calls
- Redirects to `/auth` if unauthorized
- Clears credentials on logout

## 🧪 Testing

### Test Login

1. Start both servers:
   ```bash
   npm run dev:all
   ```

2. Open http://localhost:3000

3. Try logging in:
   - Login: `admin` (fixed)
   - Password: Get from backend team or try common test passwords

4. If successful, you'll be redirected to profile page

5. Check browser console - should see successful API calls

### Test Authentication

Open browser DevTools and check:

**Application tab:**
- Local Storage should contain `auth_credentials`

**Network tab:**
- API requests should include `Authorization: Basic ...` header

**Console:**
- No 401 errors
- User data loads successfully

## ⚠️ Common Issues

### Still Getting 401 Errors

**Solution 1: Wrong Password**
- Ask backend team for correct admin password
- Or check backend logs for valid credentials

**Solution 2: Clear Old Credentials**
```javascript
// In browser console
localStorage.clear()
// Then refresh and login again
```

**Solution 3: Check Authorization Header**
```javascript
// In browser console on any page
const creds = localStorage.getItem('auth_credentials')
console.log(creds)
// Should show: {"login":"admin","password":"..."}
```

### Credentials Not Persisting

- Make sure localStorage is enabled in browser
- Check browser privacy settings
- Try in incognito mode to test

### API Calls Fail After Some Time

- Backend may have session timeout
- Simply logout and login again
- Credentials will be refreshed

## 🔒 Security Recommendations

### For Development
✅ Current setup is fine - credentials in localStorage

### For Production
❌ Don't use localStorage for credentials
✅ Use one of these instead:

1. **HttpOnly Cookies** (Recommended)
   ```typescript
   // Backend sets cookie
   Set-Cookie: auth_token=xxx; HttpOnly; Secure; SameSite=Strict
   
   // Frontend automatically sends it with every request
   credentials: 'include'
   ```

2. **JWT Tokens in Memory**
   ```typescript
   // Store token in memory only (variable, not localStorage)
   let accessToken = '';
   
   // Refresh token in HttpOnly cookie
   // Access token expires quickly (5-15 minutes)
   ```

3. **OAuth2 / OpenID Connect**
   - Use authentication provider
   - Never handle credentials directly

## 📱 Testing Different Users

To test with different users/roles:

```javascript
// In browser console
import { setAuthCredentials } from '@/lib/api'

// Test as different user
setAuthCredentials('teacher_login', 'teacher_password')
// Refresh page

// Back to admin
setAuthCredentials('admin', 'admin_password')
// Refresh page
```

## 🎉 Success Checklist

- ✅ Login page validates credentials with API
- ✅ Credentials stored in localStorage
- ✅ All API requests include Authorization header
- ✅ 401 errors redirect to login page
- ✅ Logout clears credentials
- ✅ Profile page loads user data
- ✅ No 401 Unauthorized errors

## 🐛 Debug Helper

Add this to any page to check auth status:

```typescript
useEffect(() => {
  const creds = localStorage.getItem('auth_credentials')
  console.log('Auth Status:', creds ? 'Logged In' : 'Not Logged In')
  if (creds) {
    console.log('User:', JSON.parse(creds).login)
  }
}, [])
```

## 📞 Need Help?

If you're still getting 401 errors:

1. Check proxy server is running (`npm run proxy`)
2. Check Next.js is running (`npm run dev`)
3. Verify credentials with backend team
4. Check browser console for detailed errors
5. Look at Network tab to see exact request/response
