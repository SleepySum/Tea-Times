const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

class Database {
  constructor() {
    this.ensureDir();
    this.data = this.load();
  }

  ensureDir() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  load() {
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
      console.error('Error loading db.json:', e);
    }
    return { users: [], articles: [], comments: [], reactions: {} };
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db.json:', e);
    }
  }

  // Users
  findUserByEmail(email) {
    if (!email || !this.data || !this.data.users) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    if (!id || !this.data || !this.data.users) return null;
    return this.data.users.find(u => u.id === id);
  }

  addUser(user) {
    if (!user.preferences) {
      user.preferences = ["Live Global News", "Artisan Terroir", "Vessels & Craft"];
    }
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...updates };
      this.save();
      return this.data.users[index];
    }
    return null;
  }

  updateUserPreferences(id, preferences) {
    const user = this.findUserById(id);
    if (user) {
      user.preferences = preferences;
      this.save();
      return user.preferences;
    }
    return null;
  }

  // Articles & Personalization
  getArticles(preferences = null) {
    if (!this.data || !this.data.articles) return [];
    let list = [...this.data.articles];
    if (preferences && Array.isArray(preferences) && preferences.length > 0) {
      list.sort((a, b) => {
        const aMatch = preferences.includes(a.feedBadge) || preferences.includes(a.preferenceTag) ? 1 : 0;
        const bMatch = preferences.includes(b.feedBadge) || preferences.includes(b.preferenceTag) ? 1 : 0;
        return bMatch - aMatch;
      });
    }
    return list;
  }

  getArticle(id) {
    if (!this.data || !this.data.articles) return null;
    return this.data.articles.find(a => a.id === id);
  }

  addArticle(article) {
    this.data.articles.unshift(article);
    this.save();
    return article;
  }

  // Real Vote Handling (1 vote per user)
  recordVote(articleId, userId, requestedAction) {
    const article = this.getArticle(articleId);
    if (!article) return null;

    if (!this.data.reactions) this.data.reactions = {};
    if (!this.data.reactions[articleId]) {
      this.data.reactions[articleId] = {};
    }

    const currentVote = this.data.reactions[articleId][userId] || null;

    if (requestedAction === 'like') {
      if (currentVote === 'like') {
        article.likes = Math.max(0, (article.likes || 1) - 1);
        delete this.data.reactions[articleId][userId];
      } else if (currentVote === 'dislike') {
        article.dislikes = Math.max(0, (article.dislikes || 1) - 1);
        article.likes = (article.likes || 0) + 1;
        this.data.reactions[articleId][userId] = 'like';
      } else {
        article.likes = (article.likes || 0) + 1;
        this.data.reactions[articleId][userId] = 'like';
      }
    } else if (requestedAction === 'dislike') {
      if (currentVote === 'dislike') {
        article.dislikes = Math.max(0, (article.dislikes || 1) - 1);
        delete this.data.reactions[articleId][userId];
      } else if (currentVote === 'like') {
        article.likes = Math.max(0, (article.likes || 1) - 1);
        article.dislikes = (article.dislikes || 0) + 1;
        this.data.reactions[articleId][userId] = 'dislike';
      } else {
        article.dislikes = (article.dislikes || 0) + 1;
        this.data.reactions[articleId][userId] = 'dislike';
      }
    }

    this.save();

    return {
      likes: article.likes,
      dislikes: article.dislikes,
      userReaction: this.data.reactions[articleId][userId] || null
    };
  }

  getUserReaction(articleId, userId) {
    if (!this.data || !this.data.reactions || !this.data.reactions[articleId]) return null;
    return this.data.reactions[articleId][userId] || null;
  }

  // Comments
  getComments(articleId) {
    if (!this.data || !this.data.comments) return [];
    return this.data.comments.filter(c => c.articleId === articleId);
  }

  addComment(comment) {
    if (!this.data.comments) this.data.comments = [];
    this.data.comments.unshift(comment);
    this.save();
    return comment;
  }
}

module.exports = new Database();
