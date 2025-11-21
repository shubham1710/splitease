# Backend Deployment on Render.com - Step by Step

## ✅ Prerequisites Checklist

Before starting, ensure you have:
- [ ] GitHub account created
- [ ] Code pushed to GitHub repository
- [ ] MongoDB Atlas cluster running (free tier)
- [ ] MongoDB connection string ready

## 🚀 Deployment Steps

### 1. Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for easy integration)

### 2. Create New Web Service
1. Click "New +" button (top right)
2. Select "Web Service"
3. Choose "Connect a repository"
4. If first time: Click "Configure GitHub" and authorize Render
5. Find and select your `Splitwise` repository
6. Click "Connect"

### 3. Configure Your Service

Fill in the following details:

**Basic Settings:**
- **Name**: `splitwise-backend` (or any name you prefer)
  - This will create URL: `https://splitwise-backend.onrender.com`
- **Region**: Singapore / Frankfurt (choose closest to you)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`

**Build & Deploy:**
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- **Free** (750 hours/month free, sleeps after 15 min inactivity)

### 4. Add Environment Variables

Click "Advanced" → Scroll to "Environment Variables" → Click "Add Environment Variable"

Add these **4 required variables**:

| Key | Value | Notes |
|-----|-------|-------|
| `MONGODB_URL` | `mongodb+srv://username:password@cluster.mongodb.net/splitwise?retryWrites=true&w=majority` | Get from MongoDB Atlas |
| `SECRET_KEY` | Generate random string (see below) | For JWT tokens |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | 7 days in minutes |

**To generate SECRET_KEY**, run this in your terminal:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the output and paste as SECRET_KEY value.

**Optional variable** (add after frontend is deployed):
| Key | Value |
|-----|-------|
| `CORS_ORIGINS` | `https://your-app.vercel.app` |

### 5. Deploy!

1. Click "Create Web Service" button
2. Wait for deployment (5-10 minutes)
3. Watch the logs - should see:
   ```
   Application startup complete
   Uvicorn running on http://0.0.0.0:$PORT
   ```

### 6. Verify Deployment

Once deployed, you'll see "Live" status and your URL.

**Test these endpoints:**

1. **Health Check**:
   - Visit: `https://your-backend.onrender.com/health`
   - Should see: `{"status": "healthy"}`

2. **API Docs**:
   - Visit: `https://your-backend.onrender.com/docs`
   - Should see: Swagger UI with all endpoints

3. **Root**:
   - Visit: `https://your-backend.onrender.com/`
   - Should see: `{"message": "Welcome to Splitwise Clone API"}`

### 7. Note Your Backend URL

Copy your backend URL: `https://splitwise-backend.onrender.com`  
(replace with your actual name)

You'll need this for frontend deployment!

## ⚠️ Important Notes

### Free Tier Limitations
- **Sleeps after 15 minutes** of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month (enough for 1 app running 24/7)
- Shared CPU and 512 MB RAM

### Auto-Deploy
- Every git push to `main` branch triggers automatic redeployment
- Check "Events" tab to see deployment history

### Monitoring
- **Logs**: Dashboard → Your Service → "Logs" tab
- **Metrics**: See CPU, memory usage in "Metrics" tab
- **Health**: Render automatically restarts if health check fails

## 🔧 Troubleshooting

### Build Failed
**Error**: `Could not find requirements.txt`
- **Fix**: Ensure "Root Directory" is set to `backend`

**Error**: `pip install failed`
- **Fix**: Check `requirements.txt` has no syntax errors
- Run locally: `pip install -r requirements.txt`

### Deployment succeeded but 503 error
**Symptom**: Service shows "Live" but returns 503
- **Check**: Logs for error messages
- **Common cause**: MongoDB connection failed
  - Verify `MONGODB_URL` is correct
  - Check MongoDB Atlas network access (0.0.0.0/0)
  - Ensure database user exists with correct password

### Application Error / Crash Loop
**Symptom**: Logs show repeated startup and crash
- **Check**: Environment variables are set correctly
- **Check**: SECRET_KEY doesn't have special characters that need escaping
- **Check**: MongoDB is accessible from internet

### CORS Errors (after connecting frontend)
**Symptom**: Frontend shows CORS policy error
- **Add**: `CORS_ORIGINS` environment variable with your Vercel URL
- **Format**: `https://your-app.vercel.app` (no trailing slash)
- **Redeploy**: Click "Manual Deploy" → "Deploy latest commit"

## ✅ Success Checklist

- [ ] Service shows "Live" status
- [ ] `/health` returns `{"status": "healthy"}`
- [ ] `/docs` shows Swagger UI
- [ ] Backend URL noted for frontend deployment
- [ ] MongoDB connection working (check logs)

## 🎉 Next Steps

Your backend is now live! 

Next: Deploy the frontend to Vercel and connect it to this backend.

**Your Backend URL**: `https://splitwise-backend.onrender.com`  
(Use this in frontend `VITE_API_URL` environment variable)

---

**Need help?**
- Render Docs: https://render.com/docs
- Check deployment logs for errors
- Verify MongoDB Atlas is accessible
