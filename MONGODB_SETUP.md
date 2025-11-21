# MongoDB Setup Instructions

Since MongoDB is not installed locally, you have two options:

## Option 1: Use MongoDB Atlas (Free Tier) - RECOMMENDED

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Sandbox - FREE)
4. Wait for cluster to be created (~3-5 minutes)
5. Click "Connect" → "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database user password
8. Update `backend/.env` file with the connection string:
   ```
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/splitwise?retryWrites=true&w=majority
   ```

## Option 2: Install MongoDB Locally

### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### The connection string in `.env` should be:
```
MONGODB_URL=mongodb://localhost:27017/splitwise
```

## After MongoDB is Ready

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. Start the frontend server (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the app at: http://localhost:5173

## Testing the Application

1. Register a new user
2. Login with credentials
3. Add friends (search by email/username)
4. Create a group
5. Add an expense
6. View dashboard for balance summary
