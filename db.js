const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://tea-times-sumit322.aws-ap-south-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTQyOTM1NTcsImlkIjoiMDFhMWM0MzktMGUwMS03ZGJjLThkNzQtNmUyNzQ1NjAxYmY4Iiwia2lkIjoiVXgyMG9mTjc1RVkyZjVGRWp5RjBrb1FubTZFZ0ctbkZfcXJ2dGdCN3EyNCIsInJpZCI6IjRmODk2YWI4LTdmZGMtNDkyNC04NmYzLTA5MWFmNDdhYWZlOCJ9.lMli4DLLnhmEulE731DpEjSFNsQYDL69zrqIIjc5bSgtyQ1pbPi2gFE9XEXMAF5XPHKUPdGHipdZvhDsB7mZCQ';

class Database {
  constructor() {
    this.ensureDir();
    this.localData = this.loadLocal();
    this.turso = null;
    this.isTursoReady = false;

    this.initTurso();
  }

  ensureDir() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.reactions) parsed.reactions = {};
        if (!parsed.articles) parsed.articles = [];
        if (!parsed.users) parsed.users = [];
        if (!parsed.comments) parsed.comments = [];
        return parsed;
      }
    } catch (e) {
      console.error('Error loading db.json:', e.message);
    }
    return { users: [], articles: [], comments: [], reactions: {} };
  }

  saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db.json:', e.message);
    }
  }

  async initTurso() {
    try {
      this.turso = createClient({
        url: TURSO_URL,
        authToken: TURSO_TOKEN
      });

      // Quick test query
      await this.turso.execute('SELECT 1 as test');
      this.isTursoReady = true;
      console.log('⚡ Turso LibSQL connected successfully (aws-ap-south-1 Mumbai)!');

      // Auto-migrate tables if not exist
      await this.ensureSchema();
    } catch (err) {
      this.isTursoReady = false;
      console.warn(`⚠️  Turso connection note (${err.message}). Using local persistent cache.`);
    }
  }

  async ensureSchema() {
    if (!this.isTursoReady || !this.turso) return;
    try {
      await this.turso.batch([
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          passwordHash TEXT,
          avatar TEXT,
          provider TEXT,
          role TEXT,
          preferences TEXT,
          createdAt TEXT
        );`,
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
        `CREATE TABLE IF NOT EXISTS articles (
          id TEXT PRIMARY KEY,
          label TEXT,
          courseTag TEXT,
          category TEXT,
          feedBadge TEXT,
          preferenceTag TEXT,
          title TEXT,
          cleanTitle TEXT,
          summary TEXT,
          author TEXT,
          publication TEXT,
          sourceUrl TEXT,
          readTime TEXT,
          timestamp TEXT,
          imgSrc TEXT,
          caption TEXT,
          quote TEXT,
          bodyParagraphs TEXT,
          likes INTEGER DEFAULT 0,
          dislikes INTEGER DEFAULT 0,
          createdAt TEXT
        );`,
        `CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(createdAt DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_articles_feed ON articles(feedBadge);`,
        `CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          articleId TEXT,
          userId TEXT,
          authorName TEXT,
          authorInitials TEXT,
          authorAvatar TEXT,
          mood TEXT,
          rating INTEGER,
          content TEXT,
          createdAt TEXT
        );`,
        `CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(articleId, createdAt DESC);`,
        `CREATE TABLE IF NOT EXISTS reactions (
          articleId TEXT,
          userId TEXT,
          vote TEXT,
          updatedAt TEXT,
          PRIMARY KEY (articleId, userId)
        );`
      ]);
    } catch (e) {
      console.warn('Turso schema initialization note:', e.message);
    }
  }

  // ================= USERS =================
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    if (this.isTursoReady && this.turso) {
      try {
        const rs = await this.turso.execute({
          sql: 'SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1',
          args: [cleanEmail]
        });
        if (rs.rows.length > 0) {
          const row = rs.rows[0];
          return {
            ...row,
            preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences) : (row.preferences || [])
          };
        }
      } catch (e) {
        console.warn('Turso findUserByEmail error:', e.message);
      }
    }

    const local = this.localData.users.find(u => u.email.toLowerCase() === cleanEmail);
    return local || null;
  }

  async findUserById(id) {
    if (!id) return null;

    if (this.isTursoReady && this.turso) {
      try {
        const rs = await this.turso.execute({
          sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
          args: [id]
        });
        if (rs.rows.length > 0) {
          const row = rs.rows[0];
          return {
            ...row,
            preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences) : (row.preferences || [])
          };
        }
      } catch (e) {
        console.warn('Turso findUserById error:', e.message);
      }
    }

    const local = this.localData.users.find(u => u.id === id);
    return local || null;
  }

  async addUser(user) {
    if (!user.preferences) {
      user.preferences = ["Live Global News", "Artisan Terroir", "Vessels & Craft"];
    }

    // Update local cache
    this.localData.users.push(user);
    this.saveLocal();

    // Persist to Turso
    if (this.isTursoReady && this.turso) {
      try {
        await this.turso.execute({
          sql: `INSERT OR REPLACE INTO users (id, name, email, passwordHash, avatar, provider, role, preferences, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            user.id,
            user.name || '',
            user.email.toLowerCase(),
            user.passwordHash || '',
            user.avatar || '',
            user.provider || 'email',
            user.role || 'Member',
            JSON.stringify(user.preferences),
            user.createdAt || new Date().toISOString()
          ]
        });
      } catch (e) {
        console.warn('Turso addUser error:', e.message);
      }
    }

    return user;
  }

  async updateUser(id, updates) {
    const existing = await this.findUserById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };

    // Update local
    const idx = this.localData.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.localData.users[idx] = merged;
      this.saveLocal();
    }

    // Persist to Turso
    if (this.isTursoReady && this.turso) {
      try {
        await this.turso.execute({
          sql: `UPDATE users SET name = ?, avatar = ?, preferences = ? WHERE id = ?`,
          args: [
            merged.name || '',
            merged.avatar || '',
            JSON.stringify(merged.preferences || []),
            id
          ]
        });
      } catch (e) {
        console.warn('Turso updateUser error:', e.message);
      }
    }

    return merged;
  }

  async updateUserPreferences(id, preferences) {
    return await this.updateUser(id, { preferences });
  }

  // ================= ARTICLES & PERSONALIZATION =================
  async getArticles(preferences = null, page = 1, limit = 20) {
    let list = [];

    if (this.isTursoReady && this.turso) {
      try {
        const offset = Math.max(0, (page - 1) * limit);
        const rs = await this.turso.execute({
          sql: 'SELECT * FROM articles ORDER BY createdAt DESC LIMIT ? OFFSET ?',
          args: [limit, offset]
        });

        list = rs.rows.map(row => ({
          ...row,
          bodyParagraphs: typeof row.bodyParagraphs === 'string' ? JSON.parse(row.bodyParagraphs) : (row.bodyParagraphs || [])
        }));
      } catch (e) {
        console.warn('Turso getArticles error, using local fallback:', e.message);
      }
    }

    if (list.length === 0 && this.localData.articles) {
      list = [...this.localData.articles];
    }

    if (preferences && Array.isArray(preferences) && preferences.length > 0) {
      list.sort((a, b) => {
        const aMatch = preferences.includes(a.feedBadge) || preferences.includes(a.preferenceTag) ? 1 : 0;
        const bMatch = preferences.includes(b.feedBadge) || preferences.includes(b.preferenceTag) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    return list;
  }

  async getArticle(id) {
    if (!id) return null;

    if (this.isTursoReady && this.turso) {
      try {
        const rs = await this.turso.execute({
          sql: 'SELECT * FROM articles WHERE id = ? LIMIT 1',
          args: [id]
        });
        if (rs.rows.length > 0) {
          const row = rs.rows[0];
          return {
            ...row,
            bodyParagraphs: typeof row.bodyParagraphs === 'string' ? JSON.parse(row.bodyParagraphs) : (row.bodyParagraphs || [])
          };
        }
      } catch (e) {
        console.warn('Turso getArticle error:', e.message);
      }
    }

    const local = this.localData.articles.find(a => a.id === id);
    return local || null;
  }

  async addArticle(article) {
    this.localData.articles.unshift(article);
    if (this.localData.articles.length > 15) {
      this.localData.articles = this.localData.articles.slice(0, 15);
    }
    this.saveLocal();

    if (this.isTursoReady && this.turso) {
      try {
        await this.turso.execute({
          sql: `INSERT OR REPLACE INTO articles (
            id, label, courseTag, category, feedBadge, preferenceTag,
            title, cleanTitle, summary, author, publication, sourceUrl,
            readTime, timestamp, imgSrc, caption, quote, bodyParagraphs,
            likes, dislikes, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            article.id,
            article.label || 'LIVE NEWS',
            article.courseTag || 'THE MONOGRAPH',
            article.category || 'GLOBAL DISPATCH',
            article.feedBadge || 'Live Global News',
            article.preferenceTag || 'Live Global News',
            article.title || '',
            article.cleanTitle || article.title || '',
            article.summary || '',
            article.author || 'Tea Times Bureau',
            article.publication || 'Tea Times',
            article.sourceUrl || '',
            article.readTime || '5 min read',
            article.timestamp || 'Just Published',
            article.imgSrc || '',
            article.caption || '',
            article.quote || '',
            JSON.stringify(article.bodyParagraphs || []),
            article.likes || 0,
            article.dislikes || 0,
            article.createdAt || new Date().toISOString()
          ]
        });
      } catch (e) {
        console.warn('Turso addArticle error:', e.message);
      }
    }

    return article;
  }

  // ================= REACTIONS & VOTES (1 VOTE PER USER) =================
  async recordVote(articleId, userId, requestedAction) {
    const article = await this.getArticle(articleId);
    if (!article) return null;

    let currentVote = null;

    if (this.isTursoReady && this.turso) {
      try {
        const rs = await this.turso.execute({
          sql: 'SELECT vote FROM reactions WHERE articleId = ? AND userId = ? LIMIT 1',
          args: [articleId, userId]
        });
        if (rs.rows.length > 0) {
          currentVote = rs.rows[0].vote;
        }
      } catch (e) {}
    } else {
      if (!this.localData.reactions) this.localData.reactions = {};
      if (!this.localData.reactions[articleId]) this.localData.reactions[articleId] = {};
      currentVote = this.localData.reactions[articleId][userId] || null;
    }

    let newVote = null;
    if (requestedAction === 'like') {
      if (currentVote === 'like') {
        article.likes = Math.max(0, (article.likes || 1) - 1);
        newVote = null;
      } else if (currentVote === 'dislike') {
        article.dislikes = Math.max(0, (article.dislikes || 1) - 1);
        article.likes = (article.likes || 0) + 1;
        newVote = 'like';
      } else {
        article.likes = (article.likes || 0) + 1;
        newVote = 'like';
      }
    } else if (requestedAction === 'dislike') {
      if (currentVote === 'dislike') {
        article.dislikes = Math.max(0, (article.dislikes || 1) - 1);
        newVote = null;
      } else if (currentVote === 'like') {
        article.likes = Math.max(0, (article.likes || 1) - 1);
        article.dislikes = (article.dislikes || 0) + 1;
        newVote = 'dislike';
      } else {
        article.dislikes = (article.dislikes || 0) + 1;
        newVote = 'dislike';
      }
    }

    // Save local
    if (!this.localData.reactions) this.localData.reactions = {};
    if (!this.localData.reactions[articleId]) this.localData.reactions[articleId] = {};
    if (newVote) {
      this.localData.reactions[articleId][userId] = newVote;
    } else {
      delete this.localData.reactions[articleId][userId];
    }
    this.saveLocal();

    // Persist to Turso
    if (this.isTursoReady && this.turso) {
      try {
        if (newVote) {
          await this.turso.execute({
            sql: `INSERT OR REPLACE INTO reactions (articleId, userId, vote, updatedAt) VALUES (?, ?, ?, ?)`,
            args: [articleId, userId, newVote, new Date().toISOString()]
          });
        } else {
          await this.turso.execute({
            sql: `DELETE FROM reactions WHERE articleId = ? AND userId = ?`,
            args: [articleId, userId]
          });
        }
        await this.turso.execute({
          sql: `UPDATE articles SET likes = ?, dislikes = ? WHERE id = ?`,
          args: [article.likes, article.dislikes, articleId]
        });
      } catch (e) {
        console.warn('Turso recordVote error:', e.message);
      }
    }

    return {
      likes: article.likes,
      dislikes: article.dislikes,
      userReaction: newVote
    };
  }

  async getUserReaction(articleId, userId) {
    if (this.isTursoReady && this.turso) {
      try {
        const rs = await this.turso.execute({
          sql: 'SELECT vote FROM reactions WHERE articleId = ? AND userId = ? LIMIT 1',
          args: [articleId, userId]
        });
        if (rs.rows.length > 0) return rs.rows[0].vote;
      } catch (e) {}
    }

    if (!this.localData || !this.localData.reactions || !this.localData.reactions[articleId]) return null;
    return this.localData.reactions[articleId][userId] || null;
  }

  // ================= COMMENTS =================
  async getComments(articleId) {
    if (this.isTursoReady && this.turso) {
      try {
        const rs = await this.turso.execute({
          sql: 'SELECT * FROM comments WHERE articleId = ? ORDER BY createdAt DESC',
          args: [articleId]
        });
        return rs.rows;
      } catch (e) {
        console.warn('Turso getComments error:', e.message);
      }
    }

    if (!this.localData || !this.localData.comments) return [];
    return this.localData.comments.filter(c => c.articleId === articleId);
  }

  async addComment(comment) {
    this.localData.comments.unshift(comment);
    this.saveLocal();

    if (this.isTursoReady && this.turso) {
      try {
        await this.turso.execute({
          sql: `INSERT INTO comments (id, articleId, userId, authorName, authorInitials, authorAvatar, mood, rating, content, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            comment.id,
            comment.articleId,
            comment.userId,
            comment.authorName || 'Guest',
            comment.authorInitials || 'GT',
            comment.authorAvatar || '',
            comment.mood || 'Clarity',
            comment.rating || 5,
            comment.content || '',
            comment.createdAt || new Date().toISOString()
          ]
        });
      } catch (e) {
        console.warn('Turso addComment error:', e.message);
      }
    }

    return comment;
  }
}

module.exports = new Database();
