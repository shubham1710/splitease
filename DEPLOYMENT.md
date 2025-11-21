# Deployment Guide

## Quick Deployment Checklist

### ✅ Pre-Deployment
- [ ] Repository pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0 for development)
- [ ] Connection string copied

### 🚀 Deploy Backend (Render.com)

1. **Sign up** at [render.com](https://render.com) (free)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Service**
   - Name: `splitwise-backend` (or your choice)
   - Region: Choose closest to you
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: `Free`

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable":
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/splitwise?retryWrites=true&w=majority
   SECRET_KEY=your-super-secret-random-string-change-this
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   ```
   
   **Generate SECRET_KEY**: Run in terminal:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Note your backend URL: `https://splitwise-backend-xxxx.onrender.com`

6. **Update CORS** (if needed)
   - After frontend is deployed, add frontend URL to CORS in `backend/app/main.py`

### 🎨 Deploy Frontend (Vercel)

1. **Sign up** at [vercel.com](https://vercel.com) (free)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)

4. **Add Environment Variable**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     ```
   - Replace with your actual Render backend URL

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at: `https://your-app.vercel.app`

6. **Update Backend CORS**
   - Go to your backend code (`backend/app/main.py`)
   - Add your Vercel URL to allowed origins
   - Push to GitHub (Render will auto-redeploy)

### 🗄️ MongoDB Atlas Setup

1. **Create Account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Free Cluster**
   - Choose "M0 Sandbox" (Free Forever)
   - Select cloud provider and region
   - Cluster name: `Cluster0` (default is fine)

3. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Authentication: Username and Password
   - Username: `splitwise_user` (or your choice)
   - Password: Generate secure password (save it!)
   - Database User Privileges: `Read and write to any database`

4. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - (For production, restrict to your server IPs)

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<username>`, `<password>`, and `<dbname>` with your values:
     ```
     mongodb+srv://splitwise_user:your-password@cluster0.xxxxx.mongodb.net/splitwise?retryWrites=true&w=majority
     ```

## 🔧 Post-Deployment

### Test Your Deployment

1. **Open Frontend URL**
   - Register a new account
   - Create a test expense
   - Verify data persists

2. **Check Backend Health**
   - Visit: `https://your-backend.onrender.com/docs`
   - You should see API documentation

3. **Monitor Logs**
   - Render: Dashboard → Your Service → Logs
   - Vercel: Dashboard → Your Project → Deployments → View Function Logs

### Common Issues

**Backend sleeps after 15 minutes (Render Free Tier)**
- First request after sleep takes ~30 seconds
- Consider upgrading for production or use Railway.app

**CORS errors**
- Ensure frontend URL is in backend CORS allowed origins
- Check `backend/app/main.py`

**Database connection failed**
- Verify MongoDB Atlas credentials
- Check network access (0.0.0.0/0)
- Ensure connection string is correct in environment variables

**Build failed on Vercel**
- Check build logs
- Ensure `VITE_API_URL` is set correctly
- Try local build: `cd frontend && npm run build`

## 🔄 Continuous Deployment

Both Render and Vercel automatically deploy when you push to GitHub:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. Watch auto-deployment in dashboards

## 📊 Monitoring & Limits

### Render Free Tier
- 750 hours runtime/month (enough for 1 service)
- Sleeps after 15 min inactivity
- 512 MB RAM
- Shared CPU

### Vercel Free Tier
- Unlimited sites
- 100 GB bandwidth/month
- Automatic SSL
- Global CDN

### MongoDB Atlas Free Tier
- 512 MB storage
- Shared RAM
- No backups
- Good for < 1000 users

## 🎉 You're Live!

Your app is now deployed and accessible to anyone with the URL!

Share your frontend URL: `https://your-app.vercel.app`

---

Need help? Check:
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
