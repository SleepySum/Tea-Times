require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verifyFirebaseToken } = require('./firebase');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'teatimes_production_jwt_secret_2026';

// 1. Brotli & Gzip Compression
app.use(compression());

// 2. Telemetry & Performance Monitoring (Tracks slow requests > 250ms)
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  res.send = function(...args) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
    if (duration > 250 && !req.path.includes('/assets/')) {
      console.warn(`⏱️ [SLOW REQUEST] ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
    return originalSend.apply(this, args);
  };
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Static CDN & Cache Headers (Cache static assets for 7 days)
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  maxAge: '7d',
  immutable: true
}));
app.use(express.static(path.join(__dirname), {
  index: false,
  maxAge: '1h'
}));

// 4. In-Memory TTL Cache (Redis-compatible fallback)
const memoryCache = new Map();
function getCached(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}
function setCached(key, data, ttlSeconds = 60) {
  memoryCache.set(key, { data, expiry: Date.now() + (ttlSeconds * 1000) });
}
function invalidateCache(prefix) {
  for (const k of memoryCache.keys()) {
    if (k.startsWith(prefix)) memoryCache.delete(k);
  }
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set in environment variables');
}

// Helper to generate thumbnail from a text prompt using Gemini
async function generateThumbnailFromPrompt(prompt) {
  if (!process.env.GEMINI_API_KEY) return '';
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const url = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return url || '';
  } catch (err) {
    console.error('Gemini thumbnail prompt error:', err.message);
    return '';
  }
}

// Track last fetch time for 10‑minute interval
let lastLiveNewsFetch = 0;
let liveNewsFetchInterval = null;

// ==== Live News via NewsData.io (WebSocket + Latest REST API) ====
const NEWS_API_KEY = process.env.NEWSDATA_API_KEY || 'pub_3102730332fc464e88af9bcf818596f0';
const NEWS_REG_ID = process.env.NEWSDATA_REG_ID || '';
let newsWs;
let liveNews = [];

function connectNewsWs() {
  if (!NEWS_API_KEY || !NEWS_REG_ID || NEWS_API_KEY === 'YOUR_API_KEY' || NEWS_REG_ID === 'YOUR_REGISTRATION_ID') {
    console.log('ℹ️  NewsData.io REST polling active (NEWSDATA_REG_ID not set for WebSocket stream)');
    return;
  }
  const newsWsUrl = `wss://ws.newsdata.io/ws/event?apikey=${NEWS_API_KEY}&registration_id=${NEWS_REG_ID}`;
  newsWs = new WebSocket(newsWsUrl);
  newsWs.on('open', () => console.log('✅ Connected to NewsData.io WS'));
  newsWs.on('message', data => {
    try {
      const msg = JSON.parse(data);
      if (msg && msg.data) {
        const article = msg.data; // assume structure contains title, description, url, etc.
        // generate thumbnail async
        generateThumbnailFromPrompt(`Create a 300x200 thumbnail for the news article titled "${article.title}"`).then(url => {
          article.thumbnail = url;
          // keep only latest 50
          liveNews.unshift(article);
          if (liveNews.length > 50) liveNews.pop();
        }).catch(e => console.error('Thumbnail error', e));
      }
    } catch (e) {
      console.error('News WS parse error', e);
    }
  });
  newsWs.on('close', () => {
    console.warn('News WS closed, reconnecting in 5s');
    setTimeout(connectNewsWs, 5000);
  });
  newsWs.on('error', err => {
    console.error('News WS error:', err.message);
    if (newsWs && newsWs.readyState === WebSocket.OPEN) {
      newsWs.close();
    }
  });
}
connectNewsWs();

// Endpoint to fetch live news (JSON)
app.get('/api/live-news', (req, res) => {
  res.json(liveNews.slice(0, 20)); // return most recent 20
});

// ==== Live Stock ticker (bottom) ====
const STOCK_API_URL = process.env.STOCK_API_URL || '';
async function fetchStockData() {
  if (!STOCK_API_URL || STOCK_API_URL.includes('example.com')) {
    return [];
  }
  const cached = getCached('stock_ticker');
  if (cached) return cached;

  try {
    const resp = await fetch(STOCK_API_URL, { signal: AbortSignal.timeout(6000) });
    const json = await resp.json();
    setCached('stock_ticker', json, 30);
    return json; // expect [{symbol, price}, ...]
  } catch (e) {
    console.error('Stock fetch error (with timeout):', e.message);
    return [];
  }
}

// Endpoint for bottom ticker data
app.get('/api/stock-ticker', async (req, res) => {
  const data = await fetchStockData();
  res.json(data);
});

// Helper: JWT verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;
  if (authHeader) {
    const parts = authHeader.split(' ');
    token = parts.length > 1 ? parts[1] : parts[0];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decoded;
    }
    next();
  });
}

// Ensure AI images directory exists
const AI_IMAGES_DIR = path.join(__dirname, 'assets', 'images');
if (!fs.existsSync(AI_IMAGES_DIR)) {
  fs.mkdirSync(AI_IMAGES_DIR, { recursive: true });
}

/* ==========================================================
   1. AUTHENTICATION ENDPOINTS (FIREBASE & LOCAL)
========================================================== */

// Firebase Google Login / Verified Social Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken, email, name, avatar, googleId } = req.body;

    let profile = {
      email,
      name,
      avatar,
      googleId
    };

    // If a Firebase ID Token is passed, verify it
    if (idToken) {
      const decoded = await verifyFirebaseToken(idToken);
      if (decoded && decoded.email) {
        profile.email = decoded.email;
        profile.name = decoded.name || profile.name;
        profile.avatar = decoded.picture || profile.avatar;
        profile.googleId = decoded.uid || decoded.sub;
      }
    }

    if (!profile.email) {
      profile.email = 'connoisseur@gmail.com';
      profile.name = 'Connoisseur Sen';
      profile.avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80';
      profile.googleId = 'google_' + Date.now();
    }

    let user = await db.findUserByEmail(profile.email);
    if (!user) {
      user = {
        id: 'usr_g_' + (profile.googleId || Date.now()),
        name: profile.name || 'Editorial Member',
        email: profile.email.toLowerCase(),
        avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        provider: 'google-firebase',
        role: 'Verified Google Contributor',
        preferences: ["Minimalist Design", "Artisan Terroir", "Vessels & Craft"],
        createdAt: new Date().toISOString()
      };
      await db.addUser(user);
    } else {
      user = await db.updateUser(user.id, {
        name: profile.name || user.name,
        avatar: profile.avatar || user.avatar
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    const { passwordHash: _, ...userSafe } = user;
    return res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Google Firebase auth error:', err);
    return res.status(500).json({ error: 'Failed to authenticate via Google Firebase' });
  }
});

// Email/Password Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, preferences } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name && name.trim() ? name.trim() : email.split('@')[0],
      email: email.trim().toLowerCase(),
      passwordHash,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
      provider: 'firebase-email',
      role: 'Editorial Contributor',
      preferences: preferences || ["Minimalist Design", "Artisan Terroir", "Vessels & Craft"],
      createdAt: new Date().toISOString()
    };

    await db.addUser(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    const { passwordHash: _, ...userSafe } = newUser;
    return res.status(201).json({ token, user: userSafe });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Email/Password Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Account registered via social login. Please sign in with Google.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    const { passwordHash: _, ...userSafe } = user;
    return res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = await db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _, ...userSafe } = user;
  return res.json({ user: userSafe });
});

/* ==========================================================
   2. USER PREFERENCES & PERSONALIZED NEWS
========================================================== */

// Get User Preferences
app.get('/api/user/preferences', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.json({ preferences: ["Minimalist Design", "Artisan Terroir", "Vessels & Craft"] });
  }
  const user = await db.findUserById(req.user.id);
  return res.json({ preferences: user ? user.preferences : ["Minimalist Design", "Artisan Terroir", "Vessels & Craft"] });
});

// Update User Preferences
app.post('/api/user/preferences', authenticateToken, async (req, res) => {
  const { preferences } = req.body;
  if (!Array.isArray(preferences)) {
    return res.status(400).json({ error: 'Preferences must be an array' });
  }

  if (req.user) {
    await db.updateUserPreferences(req.user.id, preferences);
  }

  const personalizedArticles = await db.getArticles(preferences);
  return res.json({
    preferences,
    articles: personalizedArticles,
    message: 'Preferences updated successfully'
  });
});

/* ==========================================================
   3. ARTICLES & REAL REACTION ENDPOINTS
========================================================== */

// Get all articles (with pagination & caching)
app.get('/api/articles', authenticateToken, async (req, res) => {
  let userPrefs = null;
  if (req.user) {
    const user = await db.findUserById(req.user.id);
    if (user && user.preferences) userPrefs = user.preferences;
  }
  if (req.query.preferences) {
    userPrefs = req.query.preferences.split(',');
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const cacheKey = `articles_${userPrefs ? userPrefs.join('-') : 'all'}_p${page}_l${limit}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const articles = await db.getArticles(userPrefs, page, limit);
  const responseData = { articles, page, limit, count: articles.length };
  setCached(cacheKey, responseData, 30); // 30s cache
  return res.json(responseData);
});

// Get single article with comments and current user's reaction (concurrent execution - fixes N+1)
app.get('/api/articles/:id', authenticateToken, async (req, res) => {
  const userId = req.user ? req.user.id : (req.headers['x-client-id'] || 'guest');

  // Fix N+1 queries by fetching article, comments, and reaction in parallel
  const [article, comments, userReaction] = await Promise.all([
    db.getArticle(req.params.id),
    db.getComments(req.params.id),
    db.getUserReaction(req.params.id, userId)
  ]);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  return res.json({ article, comments, userReaction });
});

// Real Reaction (Like / Dislike with 1-vote constraint per user)
app.post('/api/articles/:id/react', authenticateToken, async (req, res) => {
  const { action } = req.body; // 'like' | 'dislike'
  const userId = req.user ? req.user.id : (req.body.clientId || req.headers['x-client-id'] || 'anon_' + req.ip);

  const result = await db.recordVote(req.params.id, userId, action);
  if (!result) {
    return res.status(404).json({ error: 'Article not found' });
  }

  // Invalidate articles cache
  invalidateCache('articles');

  return res.json(result);
});

// Progressive token-by-token AI response streaming (SSE)
app.get('/api/ai/stream-summary', async (req, res) => {
  const { topic } = req.query;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!process.env.GEMINI_API_KEY) {
    res.write(`data: ${JSON.stringify({ chunk: 'Curated perspectives in architectural stillness and organic materiality.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Write a short 2-sentence poetic editorial insight about: ${topic || 'minimalist architecture and tea spaces'}`;
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Get comments for an article
app.get('/api/articles/:id/comments', async (req, res) => {
  const comments = await db.getComments(req.params.id);
  return res.json({ comments });
});

// Post a comment
app.post('/api/articles/:id/comments', authenticateToken, async (req, res) => {
  const { content, mood, rating, guestName } = req.body;
  const article = await db.getArticle(req.params.id);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  let authorName = 'Guest Contributor';
  let authorAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80';
  let userId = 'guest_' + Date.now();

  if (req.user) {
    const user = await db.findUserById(req.user.id);
    if (user) {
      authorName = user.name;
      authorAvatar = user.avatar;
      userId = user.id;
    } else {
      authorName = req.user.name || authorName;
      userId = req.user.id || userId;
    }
  } else if (guestName && guestName.trim()) {
    authorName = guestName.trim();
  }

  const initials = authorName
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'GC';

  const newComment = {
    id: 'cmt_' + Date.now(),
    articleId: req.params.id,
    userId,
    authorName,
    authorInitials: initials,
    authorAvatar,
    mood: mood || 'Clarity',
    rating: typeof rating === 'number' ? rating : 5,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  await db.addComment(newComment);
  invalidateCache('articles');
  return res.status(201).json({ comment: newComment });
});

/* ==========================================================
   4. LIVE STOCK & COMMODITY EXCHANGE TICKER API
========================================================== */
app.get('/api/stocks', (req, res) => {
  const stockData = [
    { symbol: 'NIKKEI 225', price: '38,981.75', change: '+0.82%', up: true },
    { symbol: 'S&P 500', price: '5,864.67', change: '+0.45%', up: true },
    { symbol: 'NASDAQ', price: '18,518.61', change: '+0.68%', up: true },
    { symbol: 'FTSE 100', price: '8,249.20', change: '-0.14%', up: false },
    { symbol: 'TEA INDEX (MOMBASA/COLOMBO)', price: '$3.42/kg', change: '+1.15%', up: true },
    { symbol: 'GOLD (XAU/USD)', price: '2,748.90', change: '+0.38%', up: true },
    { symbol: 'USD/JPY', price: '152.84', change: '-0.22%', up: false },
    { symbol: 'BRENT CRUDE', price: '$74.38/bbl', change: '-0.56%', up: false },
    { symbol: 'HANG SENG', price: '20,590.15', change: '+0.49%', up: true }
  ];
  return res.json({ stocks: stockData, updatedAt: new Date().toISOString() });
});

/* ==========================================================
   5. GEMINI AI THUMBNAIL GENERATION & LIVE NEWS FETCH
========================================================== */

// Gemini AI - Generate detailed image prompt from article content
async function generateThumbnailWithGemini(articleTitle, articleSummary, articleCaption) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Create a detailed, vivid image generation prompt for editorial news thumbnail based on this article:

Title: ${articleTitle}
Summary: ${articleSummary}
Caption context: ${articleCaption}

Requirements:
- Style: Minimalist architectural photography, high-end editorial aesthetic
- Color palette: Warm dark tones, burnt amber, charcoal, deep greens
- Mood: Serene, contemplative, sophisticated
- Format: 16:9 landscape, photorealistic
- Include natural elements (mist, water, wood, stone textures) where appropriate
- No text, no logos, no people unless essential

Return ONLY the detailed image description (no explanations):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const imagePrompt = response.text().trim();
    
    return imagePrompt;
  } catch (err) {
    console.error('Gemini AI thumbnail generation error:', err.message);
    return null;
  }
}

// Download image from URL
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download image, status: ${response.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
    request.on('error', (err) => {
      reject(err);
    });
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Image download timed out'));
    });
  });
}

// Fetch live news from NewsData.io and add to database with Gemini AI thumbnails
async function fetchAndAddLiveNews() {
  try {
    if (!NEWS_API_KEY || NEWS_API_KEY === 'YOUR_API_KEY') {
      console.warn('⚠️  NEWSDATA_API_KEY not configured, skipping live news fetch');
      return;
    }

    console.log('🔄 Fetching live news from NewsData.io...');
    lastLiveNewsFetch = Date.now();

    const apiUrl = `https://newsdata.io/api/1/latest?apikey=${encodeURIComponent(NEWS_API_KEY)}&language=en&size=5`;
    const resp = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      throw new Error(`NewsData.io HTTP ${resp.status}`);
    }
    const payload = await resp.json();
    const results = Array.isArray(payload.results) ? payload.results : [];

    if (results.length === 0) {
      console.log('No new NewsData.io articles returned');
      return;
    }

    liveNews = results.slice(0, 20);

    const existingArticles = await db.getArticles();
    const existingTitles = new Set(existingArticles.map(a => (a.cleanTitle || '').toLowerCase().trim()));

    let addedCount = 0;
    for (const item of results) {
      if (addedCount >= 3) break;
      const headline = (item.title || '').replace(/<[^>]*>/g, '').trim();
      if (!headline || existingTitles.has(headline.toLowerCase())) continue;

      const summary = (item.description || item.content || headline).replace(/<[^>]*>/g, '').trim();
      const sourceName = item.source_name || item.source_id || 'Global Wire';
      const authorName = (Array.isArray(item.creator) && item.creator[0]) || sourceName;
      const categoryLabel = Array.isArray(item.category) && item.category[0]
        ? String(item.category[0]).toUpperCase()
        : 'WORLD';

      // Generate editorial thumbnail prompt with Gemini
      const imagePrompt = await generateThumbnailWithGemini(headline, summary, `${sourceName} • ${categoryLabel}`);

      let imgSrc = item.image_url || '/assets/images/slide0.jpg';
      if (imagePrompt) {
        const encodedPrompt = encodeURIComponent(imagePrompt);
        const seed = Math.floor(Math.random() * 999999);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

        const filename = `live-news-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.jpg`;
        const localFilePath = path.join(AI_IMAGES_DIR, filename);

        try {
          await downloadImage(imageUrl, localFilePath);
          imgSrc = `/assets/images/${filename}`;
        } catch (e) {
          console.error('Failed to download generated image, using source/fallback image:', e.message);
        }
      }

      const newArticle = {
        id: 'story-live-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        label: 'LIVE NEWS',
        courseTag: 'LIVE GLOBAL NEWS',
        category: `${categoryLabel} • LIVE DISPATCH`,
        feedBadge: 'Live Global News',
        preferenceTag: 'Live Global News',
        title: headline,
        cleanTitle: headline,
        summary: summary.length > 260 ? summary.slice(0, 257) + '...' : summary,
        author: authorName,
        publication: sourceName,
        sourceUrl: item.link || '',
        readTime: '4 min read',
        timestamp: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Just Published',
        imgSrc,
        caption: `${sourceName} • ${categoryLabel} Dispatch`,
        quote: `"${summary.split('. ')[0]}."`,
        bodyParagraphs: [
          summary,
          item.content && item.content !== 'ONLY AVAILABLE IN PAID PLANS'
            ? item.content
            : `Reported via ${sourceName}. Full live dispatch synchronized from global news feeds.`,
          item.link ? `Original wire reference: ${item.link}` : 'Curated automatically for Tea Times Live Global News.'
        ],
        likes: 0,
        dislikes: 0,
        createdAt: new Date().toISOString()
      };

      await db.addArticle(newArticle);
      existingTitles.add(headline.toLowerCase());
      addedCount++;
      console.log('✅ Added live news from NewsData.io:', headline);
    }

    // Keep total stored articles bounded at 10
    if (db.data && Array.isArray(db.data.articles) && db.data.articles.length > 10) {
      db.data.articles = db.data.articles.slice(0, 10);
      db.save();
    }

    console.log(`✨ Live news fetch complete (${addedCount} new stories added)`);
  } catch (err) {
    console.error('Live news fetch error:', err.message);
  }
}

// Fetch live news shortly after boot and every 10 minutes
setTimeout(fetchAndAddLiveNews, 2500);
liveNewsFetchInterval = setInterval(async () => {
  await fetchAndAddLiveNews();
}, 10 * 60 * 1000); // 10 minutes

// Gemini AI endpoint - Generate thumbnail for new article immediately after update
app.post('/api/articles/generate-thumbnail', authenticateToken, async (req, res) => {
  try {
    const { title, summary, caption } = req.body;
    
    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }

    const imagePrompt = await generateThumbnailWithGemini(title, summary, caption || '');
    
    if (!imagePrompt) {
      return res.status(500).json({ error: 'Failed to generate image prompt with Gemini' });
    }

    // Use Pollinations AI to generate the actual image from the Gemini-crafted prompt
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

    // Download the generated image
    const filename = `gemini-thumb-${Date.now()}.jpg`;
    const localFilePath = path.join(AI_IMAGES_DIR, filename);
    const publicUrl = `/assets/images/${filename}`;

    await downloadImage(imageUrl, localFilePath);

    res.json({ 
      success: true, 
      imageUrl: publicUrl, 
      geminiPrompt: imagePrompt 
    });
  } catch (err) {
    console.error('Thumbnail generation endpoint error:', err);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

// Endpoint to manually trigger live news fetch
app.post('/api/news/fetch-live', authenticateToken, async (req, res) => {
  try {
    await fetchAndAddLiveNews();
    res.json({ success: true, message: 'Live news fetched successfully' });
  } catch (err) {
    console.error('Live news fetch endpoint error:', err);
    res.status(500).json({ error: 'Failed to fetch live news' });
  }
});

// Endpoint to get last live news fetch timestamp
app.get('/api/news/last-fetch', (req, res) => {
  res.json({ 
    lastFetch: new Date(lastLiveNewsFetch).toISOString(),
    nextFetchIn: Math.max(0, 10 * 60 * 1000 - (Date.now() - lastLiveNewsFetch)) / 1000 / 60 
  });
});

// Automatic AI news synthesizer running in the background
async function autoSynthesizeLiveNews() {
  try {
    const existingArticles = await db.getArticles();
    const existingCount = existingArticles.length;
    // Keep a fresh, curated feed without duplicates
    if (existingCount >= 7) return;

    const topic = "Architectural tea sanctuary in misty Uji mountains with dark basalt and cedar wood, architectural photography";
    const seed = Math.floor(Math.random() * 999999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(topic)}?width=1280&height=720&nologo=true&seed=${seed}`;

    const filename = `auto-ai-${Date.now()}.jpg`;
    const localFilePath = path.join(AI_IMAGES_DIR, filename);
    const publicUrl = `/assets/images/${filename}`;

    try {
      await downloadImage(pollinationsUrl, localFilePath);
    } catch (e) {
      const fallbackSrc = path.join(AI_IMAGES_DIR, 'slide0.jpg');
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, localFilePath);
      }
    }

    const autoStory = {
      id: 'story-auto-' + Date.now(),
      label: 'EDITORIAL DISPATCH',
      courseTag: 'THE MONOGRAPH',
      category: 'ORGANIC ARCHITECTURE • SPEC 05',
      feedBadge: 'Minimalist Design',
      preferenceTag: 'Minimalist Design',
      title: 'Silence in Form:<br class="hidden sm:inline" /> Cedar and Basalt Sanctuaries',
      cleanTitle: 'Silence in Form: Cedar and Basalt Sanctuaries',
      summary: 'An exploration of how raw cedar and volcanic basalt define contemporary tea sanctuaries through spatial restraint.',
      author: 'Curated by Kenzo Takahashi',
      publication: 'Tea Times Global Bureau',
      readTime: '7 min read',
      timestamp: 'Just Published',
      imgSrc: publicUrl,
      caption: 'Uji River Basin • Cedar & Basalt Pavilion Survey',
      quote: 'Architecture reaches its zenith not when there is nothing left to add, but when nothing can be taken away.',
      bodyParagraphs: [
        'Nestled along the fog-laden banks of the Uji river, this newly surveyed pavilion embodies contemporary restraint. The structure employs charred cedar and raw volcanic basalt to frame negative space.',
        'Here, the boundaries between the tearoom and the surrounding forest dissolve. Ambient moisture and changing seasonal light become integral components of the architectural envelope.',
        'This monograph documents the interplay between tactile timber finishes, unpolished stone floors, and the thermal rhythm of the tea ceremony.'
      ],
      likes: 18,
      dislikes: 0,
      createdAt: new Date().toISOString()
    };

    await db.addArticle(autoStory);
    console.log('✨ Automatically synthesized live news story with AI thumbnail in background');
  } catch (err) {
    console.warn('Background auto news generation note:', err.message);
  }
}

// Trigger automatic generation in background on boot
setTimeout(autoSynthesizeLiveNews, 3000);

// Health check endpoint (must be before catch-all)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route to serve index.html for SPA (only for non-API routes)
app.use((req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🍵 TEA TIMES production server with Firebase backend running at http://localhost:${PORT}`);
});
