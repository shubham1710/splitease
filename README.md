# Splitwise Clone - Expense Sharing Application

A full-stack expense sharing application built with React (Vite) and FastAPI, featuring group expenses, settlements, and balance tracking.

## 🚀 Features

- **User Authentication**: JWT-based auth with secure login/signup
- **Expense Management**: Create, edit, and delete expenses
- **Group Management**: Create groups and share expenses with friends
- **Smart Splitting**: Split expenses equally, by exact amounts, or percentages
- **Balance Tracking**: Real-time balance calculations and settlement suggestions
- **Settle Up**: Record payments and mark debts as settled
- **Edit History**: Track all expense modifications
- **Responsive Design**: Beautiful UI with glassmorphism and smooth animations

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- React Router v6
- Axios for API calls
- Modern CSS with gradients and animations

### Backend
- FastAPI (Python)
- MongoDB with Beanie ODM
- JWT Authentication
- Pydantic for validation

## 📋 Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MongoDB Atlas account (free tier)

## 🔧 Local Development Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Splitwise
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env with your MongoDB credentials
# Get MongoDB URL from: https://cloud.mongodb.com/
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Start Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🌐 Deployment

### Recommended Free Hosting Stack

1. **Frontend**: Vercel
2. **Backend**: Render.com
3. **Database**: MongoDB Atlas

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory to `frontend`
5. Build command: `npm run build`
6. Output directory: `dist`
7. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

### Backend Deployment (Render.com)

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Set root directory to `backend`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables:
   ```
   MONGODB_URL=<your-mongodb-atlas-url>
   SECRET_KEY=<generate-random-secret-key>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   ```

### Database Setup (MongoDB Atlas)

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get connection string and add to backend environment variables

## 📁 Project Structure

```
Splitwise/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── .env.example
│   ├── requirements.txt
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── package.json
│   └── .gitignore
└── README.md
```

## 🔐 Environment Variables

### Backend (.env)
```
MONGODB_URL=mongodb+srv://...
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000  # Update for production
```

## 📝 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Created with ❤️ by Shubham

## 🐛 Known Issues

- Backend on Render free tier sleeps after 15 minutes of inactivity (takes ~30s to wake up)
- MongoDB Atlas free tier has 512MB storage limit