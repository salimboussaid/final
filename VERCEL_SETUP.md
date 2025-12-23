# Vercel Deployment Guide

## 🚀 Environment Variables Setup

Your app needs the backend API URL to work on Vercel.

### Step 1: Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add this variable:

```
Name: NEXT_PUBLIC_API_URL
Value: http://212.220.105.29:8079/api
```

4. Select environments: **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 2: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**

OR push a new commit to trigger automatic deployment.

## 🔧 Troubleshooting

### Issue: Cannot connect to API
**Solution:** Make sure your backend at `212.220.105.29:8079` has CORS enabled and allows requests from your Vercel domain.

### Issue: 401 Unauthorized
**Solution:** Use the correct admin password when logging in.

### Issue: Page not loading
**Solution:** 
1. Check Vercel build logs for errors
2. Make sure all dependencies are installed
3. Verify the environment variable is set correctly

## 📝 Required Backend Configuration

Your backend must allow CORS from:
- `https://fina-git-main-salimboussaids-projects.vercel.app`
- Or use `*` to allow all origins (less secure)

Example backend CORS config (if using Express):
```javascript
app.use(cors({
  origin: '*', // or specific domain
  credentials: true
}));
```
