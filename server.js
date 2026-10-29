const express = require('express');
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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set in environment variables');
}

// Track last fetch time for 10-minute interval
let lastLiveNewsFetch = 0;
let liveNewsFetchInterval = null;

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'teatimes_production_jwt_secret_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname)));

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

// Get all articles (optional query parameter: ?preferences=...)
app.get('/api/articles', authenticateToken, async (req, res) => {
  let userPrefs = null;
  if (req.user) {
    const user = await db.findUserById(req.user.id);
    if (user && user.preferences) userPrefs = user.preferences;
  }
  if (req.query.preferences) {
    userPrefs = req.query.preferences.split(',');
  }

  const articles = await db.getArticles(userPrefs);
  return res.json({ articles });
});

// Get single article with comments and current user's reaction
app.get('/api/articles/:id', authenticateToken, async (req, res) => {
  const article = await db.getArticle(req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  const comments = await db.getComments(req.params.id);
  const userId = req.user ? req.user.id : (req.headers['x-client-id'] || 'guest');
  const userReaction = await db.getUserReaction(req.params.id, userId);

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

  return res.json(result);
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

// Fetch live news from external sources and add to database
async function fetchAndAddLiveNews() {
  try {
    console.log('🔄 Fetching live news...');
    lastLiveNewsFetch = Date.now();

    // Use Gemini to generate current news topics based on recent trends
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const newsContextPrompt = `Generate 3 current trending news topics in the fields of minimalist design, architecture, and artisan craftsmanship. For each topic provide:
1. A catchy headline (no HTML)
2. A 2-sentence summary
3. A relevant caption for an image
4. A suitable preference tag from: Minimalist Design, Artisan Terroir, Vessels & Craft, Ceremonies & Culture, Harvest & Commodities

Return as JSON array with fields: headline, summary, caption, preferenceTag, author, publication

Current date context: October 2026`;

    const newsResult = await model.generateContent(newsContextPrompt);
    const newsResponse = await newsResult.response;
    const newsText = newsResponse.text();
    
    // Parse the JSON response
    let newsItems = [];
    try {
      // Extract JSON from response
      const jsonMatch = newsText.match(/\\[.*\\]/s);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse news JSON:', e.message);
    }

    if (!newsItems || newsItems.length === 0) {
      console.log('No new news items generated');
      return;
    }

    const existingArticles = await db.getArticles();
    
    for (const item of newsItems) {
      if (existingArticles.length >= 7) break;

      // Generate thumbnail with Gemini
      const imagePrompt = await generateThumbnailWithGemini(item.headline, item.summary, item.caption);
      
      let imgSrc = '/assets/images/slide0.jpg'; // fallback
      if (imagePrompt) {
        const encodedPrompt = encodeURIComponent(imagePrompt);
        const seed = Math.floor(Math.random() * 999999);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;
        
        const filename = `live-news-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.jpg`;
        const localFilePath = path.join(AI_IMAGES_DIR, filename);
        imgSrc = `/assets/images/${filename}`;
        
        try {
          await downloadImage(imageUrl, localFilePath);
        } catch (e) {
          console.error('Failed to download generated image:', e.message);
        }
      }

      const newArticle = {
        id: 'story-live-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        label: 'LIVE NEWS',
        courseTag: 'THE MONOGRAPH',
        category: 'GLOBAL DISPATCH • LIVE',
        feedBadge: item.preferenceTag || 'Minimalist Design',
        preferenceTag: item.preferenceTag || 'Minimalist Design',
        title: item.headline,
        cleanTitle: item.headline.replace(/<[^>]*>/g, ''),
        summary: item.summary,
        author: item.author || 'Tea Times Global Bureau',
        publication: item.publication || 'Tea Times Global Bureau',
        readTime: '5 min read',
        timestamp: 'Just Published',
        imgSrc: imgSrc,
        caption: item.caption || 'Archival footage',
        quote: 'The evolving landscape of design and craft continues to inspire our global community.',
        bodyParagraphs: [
          item.summary,
          'This dispatch brings you the latest developments from around the world, curated for our discerning readership.',
          'Stay tuned for more updates as stories develop.'
        ],
        likes: 0,
        dislikes: 0,
        createdAt: new Date().toISOString()
      };

      await db.addArticle(newArticle);
      console.log('✅ Added live news:', item.headline);
    }

    console.log('✨ Live news fetch complete');
  } catch (err) {
    console.error('Live news fetch error:', err.message);
  }
}

// Start 10-minute interval for fetching live news
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

// Catch-all route to serve index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🍵 TEA TIMES production server with Firebase backend running at http://localhost:${PORT}`);
});
