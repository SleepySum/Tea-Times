const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

class Database {
  constructor() {
    this.ensureDir();
    this.data = this.loadLocal();
    this.client = null;
    this.mongoDb = null;
    this.isMongoConnected = false;

    // Connect to MongoDB Atlas if URI is provided
    this.initMongo();
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
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db.json:', e.message);
    }
  }

  async initMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('ℹ️  Using local database engine (data/db.json). Set MONGODB_URI for live cloud database.');
      return;
    }

    try {
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000
      });
      await this.client.connect();
      const dbName = process.env.MONGODB_DB || 'tea-times';
      this.mongoDb = this.client.db(dbName);
      this.isMongoConnected = true;
      console.log(`🍃 Connected to MongoDB Atlas live cloud database [${dbName}]`);

      // Seed collections from local data if empty
      await this.seedIfEmpty();
    } catch (err) {
      this.isMongoConnected = false;
      console.warn(`⚠️  MongoDB Atlas not reachable (${err.message}). Seamlessly running on persistent local engine.`);
    }
  }

  async seedIfEmpty() {
    if (!this.isMongoConnected || !this.mongoDb) return;
    try {
      const articlesCol = this.mongoDb.collection('articles');
      const articleCount = await articlesCol.countDocuments();
      if (articleCount === 0 && this.data.articles.length > 0) {
        await articlesCol.insertMany(this.data.articles);
        console.log(`🍃 Seeded ${this.data.articles.length} initial articles to MongoDB Atlas`);
      }

      const usersCol = this.mongoDb.collection('users');
      const userCount = await usersCol.countDocuments();
      if (userCount === 0 && this.data.users.length > 0) {
        await usersCol.insertMany(this.data.users);
      }
    } catch (e) {
      console.warn('MongoDB seed note:', e.message);
    }
  }

  // ================= USERS =================
  async findUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    if (this.isMongoConnected && this.mongoDb) {
      try {
        const user = await this.mongoDb.collection('users').findOne({ email: cleanEmail });
        if (user) {
          const { _id, ...safeUser } = user;
          return safeUser;
        }
      } catch (e) {
        console.warn('Mongo findUserByEmail error, falling back:', e.message);
      }
    }

    if (!this.data || !this.data.users) return null;
    return this.data.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }

  async findUserById(id) {
    if (!id) return null;

    if (this.isMongoConnected && this.mongoDb) {
      try {
        const user = await this.mongoDb.collection('users').findOne({ id });
        if (user) {
          const { _id, ...safeUser } = user;
          return safeUser;
        }
      } catch (e) {
        console.warn('Mongo findUserById error, falling back:', e.message);
      }
    }

    if (!this.data || !this.data.users) return null;
    return this.data.users.find(u => u.id === id) || null;
  }

  async addUser(user) {
    if (!user.preferences) {
      user.preferences = ["Live Global News", "Artisan Terroir", "Vessels & Craft"];
    }

    // Update local cache
    this.data.users.push(user);
    this.saveLocal();

    // Persist to MongoDB
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection('users').updateOne(
          { id: user.id },
          { $set: user },
          { upsert: true }
        );
      } catch (e) {
        console.warn('Mongo addUser error:', e.message);
      }
    }

    return user;
  }

  async updateUser(id, updates) {
    // Update local cache
    const index = this.data.users.findIndex(u => u.id === id);
    let updatedUser = null;
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...updates };
      this.saveLocal();
      updatedUser = this.data.users[index];
    }

    // Persist to MongoDB
    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection('users').updateOne(
          { id },
          { $set: updates }
        );
        const fresh = await this.mongoDb.collection('users').findOne({ id });
        if (fresh) {
          const { _id, ...safe } = fresh;
          return safe;
        }
      } catch (e) {
        console.warn('Mongo updateUser error:', e.message);
      }
    }

    return updatedUser;
  }

  async updateUserPreferences(id, preferences) {
    const user = await this.findUserById(id);
    if (user) {
      return await this.updateUser(id, { preferences });
    }
    return null;
  }

  // ================= ARTICLES & PERSONALIZATION =================
  async getArticles(preferences = null) {
    let list = [];

    if (this.isMongoConnected && this.mongoDb) {
      try {
        const cursor = await this.mongoDb.collection('articles').find({}).sort({ createdAt: -1 }).toArray();
        if (cursor && cursor.length > 0) {
          list = cursor.map(({ _id, ...article }) => article);
        }
      } catch (e) {
        console.warn('Mongo getArticles error, falling back:', e.message);
      }
    }

    if (list.length === 0 && this.data && this.data.articles) {
      list = [...this.data.articles];
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

    if (this.isMongoConnected && this.mongoDb) {
      try {
        const article = await this.mongoDb.collection('articles').findOne({ id });
        if (article) {
          const { _id, ...safe } = article;
          return safe;
        }
      } catch (e) {
        console.warn('Mongo getArticle error, falling back:', e.message);
      }
    }

    if (!this.data || !this.data.articles) return null;
    return this.data.articles.find(a => a.id === id) || null;
  }

  async addArticle(article) {
    this.data.articles.unshift(article);
    if (this.data.articles.length > 15) {
      this.data.articles = this.data.articles.slice(0, 15);
    }
    this.saveLocal();

    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection('articles').updateOne(
          { id: article.id },
          { $set: article },
          { upsert: true }
        );
      } catch (e) {
        console.warn('Mongo addArticle error:', e.message);
      }
    }

    return article;
  }

  // ================= REACTIONS & VOTES (1 VOTE PER USER) =================
  async recordVote(articleId, userId, requestedAction) {
    const article = await this.getArticle(articleId);
    if (!article) return null;

    if (!this.data.reactions) this.data.reactions = {};
    if (!this.data.reactions[articleId]) {
      this.data.reactions[articleId] = {};
    }

    let currentVote = this.data.reactions[articleId][userId] || null;

    if (this.isMongoConnected && this.mongoDb) {
      try {
        const rec = await this.mongoDb.collection('reactions').findOne({ articleId, userId });
        if (rec) currentVote = rec.vote;
      } catch (e) {}
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

    // Update local reactions
    if (newVote) {
      this.data.reactions[articleId][userId] = newVote;
    } else {
      delete this.data.reactions[articleId][userId];
    }
    this.saveLocal();

    // Persist to MongoDB
    if (this.isMongoConnected && this.mongoDb) {
      try {
        if (newVote) {
          await this.mongoDb.collection('reactions').updateOne(
            { articleId, userId },
            { $set: { articleId, userId, vote: newVote, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        } else {
          await this.mongoDb.collection('reactions').deleteOne({ articleId, userId });
        }
        await this.mongoDb.collection('articles').updateOne(
          { id: articleId },
          { $set: { likes: article.likes, dislikes: article.dislikes } }
        );
      } catch (e) {
        console.warn('Mongo recordVote error:', e.message);
      }
    }

    return {
      likes: article.likes,
      dislikes: article.dislikes,
      userReaction: newVote
    };
  }

  async getUserReaction(articleId, userId) {
    if (this.isMongoConnected && this.mongoDb) {
      try {
        const rec = await this.mongoDb.collection('reactions').findOne({ articleId, userId });
        if (rec) return rec.vote;
      } catch (e) {}
    }

    if (!this.data || !this.data.reactions || !this.data.reactions[articleId]) return null;
    return this.data.reactions[articleId][userId] || null;
  }

  // ================= COMMENTS =================
  async getComments(articleId) {
    if (this.isMongoConnected && this.mongoDb) {
      try {
        const comments = await this.mongoDb.collection('comments')
          .find({ articleId })
          .sort({ createdAt: -1 })
          .toArray();
        if (comments && comments.length > 0) {
          return comments.map(({ _id, ...c }) => c);
        }
      } catch (e) {
        console.warn('Mongo getComments error, falling back:', e.message);
      }
    }

    if (!this.data || !this.data.comments) return [];
    return this.data.comments.filter(c => c.articleId === articleId);
  }

  async addComment(comment) {
    if (!this.data.comments) this.data.comments = [];
    this.data.comments.unshift(comment);
    this.saveLocal();

    if (this.isMongoConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection('comments').insertOne(comment);
      } catch (e) {
        console.warn('Mongo addComment error:', e.message);
      }
    }

    return comment;
  }
}

module.exports = new Database();
