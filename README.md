# 🍵 TEA TIMES

Minimalist Design & Architecture Editorial Platform with AI-Powered Live Thumbnails

## 🚀 Live Demo

**Backend:** https://tea-times.onrender.com

*(Deploy via Render.com - see deployment instructions below)*

## ✨ Features

- **Gemini AI Thumbnail Generation** - Automatically generates editorial thumbnails for new articles
- **Live News Auto-Fetch** - Fetches trending news every 10 minutes via Gemini AI
- **MongoDB Atlas Storage** - Stores users, preferences, articles, and comments
- **Firebase Authentication** - Google sign-in support
- **Real-time Reactions** - Like/Dislike with 1-vote constraint per user

## 📁 Project Structure

```
Tea-Times/
├── server.js          # Express backend server
├── db.js              # MongoDB database module
├── firebase.js        # Firebase Admin SDK config
├── .env               # Environment variables (gitignored)
├── package.json       # Dependencies
├── render.yaml        # Render deployment config
├── Procfile           # Heroku/Render process file
├── ecosystem.config.js # PM2 process manager config
├── assets/            # Static images
├── data/              # Local data (fallback)
└── index.html         # Frontend SPA
```

## 🛠 Local Development

```bash
cd Projects/Tea-Times
npm install
npm start
```

Server runs at `http://localhost:3000`

## 🔑 Environment Variables

Create a `.env` file with:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/teatimes?retryWrites=true&w=majority
MONGODB_DB=teatimes
JWT_SECRET=your_jwt_secret
```

⚠️ `.env` is gitignored - never commit secrets!

## 🌐 Deployment Options

### Render.com (Recommended - Free Tier)

1. Push code to GitHub
2. Connect repo at [render.com](https://render.com)
3. Create new Web Service
4. Set environment variables in Render dashboard
5. Deploy!

### Railway.app

1. Connect GitHub repo
2. Add MongoDB service
3. Set environment variables
4. Deploy!

### PM2 (VPS/Self-hosted)

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Sign in with Google |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/user/preferences` | Get user preferences |
| POST | `/api/user/preferences` | Update preferences |
| GET | `/api/articles` | Get all articles |
| GET | `/api/articles/:id` | Get single article |
| POST | `/api/articles/:id/react` | Like/Dislike article |
| POST | `/api/articles/generate-thumbnail` | Generate AI thumbnail |
| POST | `/api/news/fetch-live` | Fetch live news manually |
| GET | `/api/news/last-fetch` | Get last fetch time |
| GET | `/api/stocks` | Get stock ticker data |

## 🔧 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **AI:** Google Gemini 2.0 Flash
- **Auth:** Firebase Admin + JWT
- **Image Generation:** Pollinations AI (via Gemini prompts)
