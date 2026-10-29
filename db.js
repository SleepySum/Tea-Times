const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ylloyfpb:d593b457-f85b-4719-860d-c21d917125b3@cluster0.hfv6r.mongodb.net/teatimes?retryWrites=true&w=majority';
const MONGODB_DB = process.env.MONGODB_DB || 'teatimes';

let client = null;
let db = null;

// Initial seed data with clean, realistic counts and preference tags
const initialData = {
  users: [
    {
      id: "usr_admin",
      name: "Master Sen",
      email: "sen@teatimes.org",
      passwordHash: "$2a$10$vYqF2jG8G9e1M6VpGzU8h.vYQv1D.1zY3Qf6iW4JqX0L8P2O0vG2a",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
      provider: "firebase",
      role: "Editor-in-Chief",
      preferences: ["Minimalist Design", "Artisan Terroir", "Vessels & Craft"],
      createdAt: new Date().toISOString()
    }
  ],
  articles: [
    {
      id: "story-0",
      label: "LIVE NEWS",
      courseTag: "THE COURSE",
      category: "EDITORIAL MONOGRAPH • H612",
      feedBadge: "Live Global News",
      preferenceTag: "Minimalist Design",
      title: "Master the Art of Minimalist<br class='hidden sm:inline' /> Design in the Modern Era",
      cleanTitle: "Master the Art of Minimalist Design in the Modern Era",
      summary: "This comprehensive course strips away the unnecessary, focusing on core principles of spatial relationships, typography, and purposeful composition.",
      author: "Curated by Master Sen",
      publication: "Tea Times Bureau",
      readTime: "8 min read",
      timestamp: "Updated 14m ago",
      imgSrc: "/assets/images/slide0.jpg",
      caption: "Kyoto Valley Hydrological Basin • Aerial Survey",
      quote: "Simplicity is not the lack of clutter, that's a consequence of simplicity. Simplicity somehow essentially describes the purpose and place of an object and its surrounding atmosphere.",
      bodyParagraphs: [
        "When we strip away ornamentation, what remains is pure intention. Minimalism is neither absence nor austerity; it is the deliberate orchestration of negative space to give profound clarity to what stays.",
        "From the unvarnished wooden tea pavilions of Uji to contemporary digital interfaces, harmony is attained when spatial density, typography, and organic textures form an unhurried visual rhythm. Every proportion serves a functional and contemplative purpose.",
        "In an era inundated with sensory noise, the disciplines of spatial calibration, natural cadence, and material respect offer an antidote. The tea ritual is architecture in motion; the room, the bowl, and the breath align."
      ],
      likes: 42,
      dislikes: 1,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "story-1",
      label: "TERROIR REPORT",
      courseTag: "THE TERROIR",
      category: "SPATIAL ARCHIVE • ISSUE 02",
      feedBadge: "Artisan Terroir",
      preferenceTag: "Artisan Terroir",
      title: "Topography, Light & Space:<br class='hidden sm:inline' /> The Organic Architecture",
      cleanTitle: "Topography, Light & Space: The Organic Architecture",
      summary: "An exploration of contours, mist dispersion, and micro-climates shaping both ancient agricultural terraces and serene contemporary dwellings.",
      author: "Curated by Aria Lin",
      publication: "Spatial Research Institute",
      readTime: "6 min read",
      timestamp: "Updated 2h ago",
      imgSrc: "/assets/images/slide1.jpg",
      caption: "Highland Mist Dispersion & Terraced Camellia Cultivation",
      quote: "To build in rhythm with the land is not merely an architectural gesture; it is an acknowledgment that the terrain itself is the primary author.",
      bodyParagraphs: [
        "The hillsides of Wazuka rise in tiered green steps toward the clouds. Here, architecture does not impose upon geography; rather, agricultural cultivation dictates the visual language of the landscape.",
        "Morning vapor pools within the valleys, creating micro-climates that temper direct sunlight and foster deep amino development within the Camellia sinensis leaves. The farmer and the stonemason share an identical grammar of retaining walls and natural terraces.",
        "Modern architectural minimalism draws profound inspiration from these terraces. The dialogue between horizontal planes and sloping topography teaches us how to anchor structures lightly to the earth."
      ],
      likes: 28,
      dislikes: 0,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: "story-2",
      label: "VESSEL ARCHIVE",
      courseTag: "THE VESSELS",
      category: "MATERIAL STUDIES • ISSUE 03",
      feedBadge: "Vessels & Craft",
      preferenceTag: "Vessels & Craft",
      title: "Subtle Equilibrium:<br class='hidden sm:inline' /> Tactile Geometry & Raw Clay",
      cleanTitle: "Subtle Equilibrium: Tactile Geometry & Raw Clay",
      summary: "How raku-fired ceramics and unpolished basalt surfaces cultivate mindfulness through subtle textural variations and thermal retention.",
      author: "Curated by Kaito Tanaka",
      publication: "Craft & Materiality Lab",
      readTime: "11 min read",
      timestamp: "Updated 4h ago",
      imgSrc: "/assets/images/slide2.jpg",
      caption: "Raku Ceramic Vessel on Basalt Mineral Plinth",
      quote: "The hand senses what the eye often overlooks: the delicate balance between coarse raw clay and the cooling stillness of freshly whisked matcha.",
      bodyParagraphs: [
        "In raku ware, perfection is purposely discarded. The vessel is pulled directly from a roaring kiln at peak temperature and cooled rapidly, inducing spontaneous crackles, smoky dark carbon, and iridescent mineral blushes.",
        "When cradled in two hands during ceremony, the weight of unglazed basalt or porous clay grounds the participant. Texture communicates warmth, history, and deliberate impermanence.",
        "In our contemporary digital environments, designing tactile surfaces—even metaphorically through typography, dark ambient gradients, and organic meshes—revives this primordial hunger for authentic material presence."
      ],
      likes: 35,
      dislikes: 1,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: "story-3",
      label: "CEREMONIES & CULTURE",
      courseTag: "THE CEREMONY",
      category: "RITUAL DIALOGUE • SPEC 04",
      feedBadge: "Ceremonies & Culture",
      preferenceTag: "Ceremonies & Culture",
      title: "The Temporal Architecture:<br class='hidden sm:inline' /> Choreography of the Tearoom",
      cleanTitle: "The Temporal Architecture: Choreography of the Tearoom",
      summary: "Examining the four-and-a-half mat chamber as an elastic universe of ritual, stillness, and spatial hospitality.",
      author: "Curated by Soshitsu Sen",
      publication: "Kyoto Heritage Guild",
      readTime: "9 min read",
      timestamp: "Updated 1h ago",
      imgSrc: "/assets/images/slide3.jpg",
      caption: "Chanoyu Bamboo Chasen & Hand-Formed Black Glaze Chawan",
      quote: "The crawl-in doorway of the teahouse forces all to enter on equal terms; pride and weapon are left at the gate.",
      bodyParagraphs: [
        "The traditional Chashitsu (tea room) is a masterclass in compressed spatial efficiency. At roughly nine feet square, its tatami proportions guide the exact trajectory of host and guest.",
        "Through the tiny nijiriguchi (crawl-in entrance), visitors must stoop, shedding external titles, hierarchy, and hurried thought. Within the dimly lit chamber, acoustic focus sharpens: the steam from the iron kama kettle sings like wind through pines.",
        "This intentional choreography reminds us that great design is not about expanse, but about emotional resonance within deliberate boundaries."
      ],
      likes: 19,
      dislikes: 0,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: "story-4",
      label: "HARVEST REPORTS",
      courseTag: "THE HARVEST",
      category: "AGRONOMY BRIEF • S2026",
      feedBadge: "Harvest & Market Reports",
      preferenceTag: "Harvest & Commodities",
      title: "First Flush Shizuoka:<br class='hidden sm:inline' /> Solar Alignment & Tender Shoots",
      cleanTitle: "First Flush Shizuoka: Solar Alignment & Tender Shoots",
      summary: "How morning shade cloth management produces deep emerald amino concentrations in this spring's Gyokuro harvest.",
      author: "Curated by Hiroshi Nishi",
      publication: "Agricultural Meteorological Log",
      readTime: "7 min read",
      timestamp: "Updated 30m ago",
      imgSrc: "/assets/images/slide4.jpg",
      caption: "Shizuoka Micro-Climate Slopes • Spring First Flush Harvest",
      quote: "In the shadow of Mount Fuji, moisture trapped by midnight valleys condenses on the youngest leaves, sealing in pure umami.",
      bodyParagraphs: [
        "In late April, when temperatures cross the critical 15-degree threshold, the tea bushes break dormancy with vibrant chartreuse bud spikes.",
        "Farmers erect dark reed canopies above the fields, blocking 85% of solar radiation for twenty-one days. Deprived of harsh light, the plant suppresses bitter catechins while synthesizing rich theanine and glutamic acids.",
        "The resulting emerald harvest yields an infusion of profound sweetness and savory brothy depth—a direct translation of shadow, cold fog, and patient cultivation."
      ],
      likes: 22,
      dislikes: 0,
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    }
  ],
  comments: [
    {
      id: "cmt_1",
      articleId: "story-0",
      userId: "usr_kenzo",
      authorName: "Kenzo Le",
      authorInitials: "KL",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
      mood: "Clarity",
      rating: 5,
      content: "The 16:9 ratio paired with the dot matrix grid establishes instant serenity. Beautiful tension between modern typography and nature.",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "cmt_2",
      articleId: "story-0",
      userId: "usr_elena",
      authorName: "Elena Rostova",
      authorInitials: "ER",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
      mood: "Proportion",
      rating: 5,
      content: "The expansion feels seamless and fluid. Pure editorial craftsmanship without visual distraction.",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ]
};

async function connectDB() {
  if (db) return db;

  try {
    // Try SRV connection first
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    await client.connect();
    db = client.db(MONGODB_DB);

    // Ensure collections exist and seed initial data if empty
    await seedData();

    console.log('✅ Connected to MongoDB Atlas');
    return db;
  } catch (err) {
    console.error('❌ MongoDB SRV connection failed, trying standard connection:', err.message);
    
    // Fallback to standard connection string format
    try {
      const standardUri = MONGODB_URI.replace(/\/teatimes/, '').replace('mongodb+srv://', 'mongodb://').replace('.net/', '.net:27017/');
      client = new MongoClient(standardUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      await client.connect();
      db = client.db(MONGODB_DB);
      
      await seedData();
      console.log('✅ Connected to MongoDB (standard connection)');
      return db;
    } catch (err2) {
      console.error('❌ MongoDB connection failed completely:', err2.message);
      // Continue without database - use in-memory fallback
      console.warn('⚠️  Running in offline mode with in-memory data');
      return null;
    }
  }
}

async function seedData() {
  if (!db) return;
  
  const usersCount = await db.collection('users').countDocuments();
  if (usersCount === 0) {
    await db.collection('users').insertMany(initialData.users);
    console.log('🌱 Seeded users collection');
  }

  const articlesCount = await db.collection('articles').countDocuments();
  if (articlesCount === 0) {
    await db.collection('articles').insertMany(initialData.articles);
    console.log('🌱 Seeded articles collection');
  }

  const commentsCount = await db.collection('comments').countDocuments();
  if (commentsCount === 0) {
    await db.collection('comments').insertMany(initialData.comments);
    console.log('🌱 Seeded comments collection');
  }

  // Initialize reactions collection if empty
  const reactionsCount = await db.collection('reactions').countDocuments();
  if (reactionsCount === 0) {
    await db.collection('reactions').createIndex({ articleId: 1, userId: 1 }, { unique: true });
    console.log('🌱 Initialized reactions collection with unique index');
  }
}

// Users
async function findUserByEmail(email) {
  const database = await connectDB();
  if (!database) return null;
  return database.collection('users').findOne({ email: email.toLowerCase() });
}

async function findUserById(id) {
  const database = await connectDB();
  if (!database) return null;
  return database.collection('users').findOne({ id: id });
}

async function addUser(user) {
  const database = await connectDB();
  if (!database) return user;
  if (!user.preferences) {
    user.preferences = ["Minimalist Design", "Artisan Terroir", "Vessels & Craft"];
  }
  await database.collection('users').insertOne(user);
  return user;
}

async function updateUser(id, updates) {
  const database = await connectDB();
  if (!database) return null;
  const result = await database.collection('users').findOneAndUpdate(
    { id: id },
    { $set: updates },
    { returnDocument: 'after' }
  );
  return result;
}

async function updateUserPreferences(id, preferences) {
  const database = await connectDB();
  if (!database) return null;
  const result = await database.collection('users').findOneAndUpdate(
    { id: id },
    { $set: { preferences: preferences } },
    { returnDocument: 'after' }
  );
  return result ? result.preferences : null;
}

// Articles & Personalization
async function getArticles(preferences = null) {
  const database = await connectDB();
  if (!database) return [];
  let query = {};
  let docs = await database.collection('articles').find(query).sort({ createdAt: -1 }).toArray();

  if (preferences && Array.isArray(preferences) && preferences.length > 0) {
    docs.sort((a, b) => {
      const aMatch = preferences.includes(a.preferenceTag) ? 1 : 0;
      const bMatch = preferences.includes(b.preferenceTag) ? 1 : 0;
      return bMatch - aMatch;
    });
  }
  return docs;
}

async function getArticle(id) {
  const database = await connectDB();
  if (!database) return null;
  return database.collection('articles').findOne({ id: id });
}

async function addArticle(article) {
  const database = await connectDB();
  if (!database) return article;
  await database.collection('articles').insertOne(article);
  return article;
}

// Real Vote Handling (1 vote per user)
async function recordVote(articleId, userId, requestedAction) {
  const database = await connectDB();
  if (!database) return null;
  
  const article = await database.collection('articles').findOne({ id: articleId });
  if (!article) return null;

  const reaction = await database.collection('reactions').findOne({
    articleId: articleId,
    userId: userId
  });

  const currentVote = reaction ? reaction.action : null;

  let updates = {};

  if (requestedAction === 'like') {
    if (currentVote === 'like') {
      updates = { $inc: { likes: -1 } };
      await database.collection('reactions').deleteOne({ articleId, userId });
    } else if (currentVote === 'dislike') {
      updates = { $inc: { dislikes: -1, likes: 1 } };
      await database.collection('reactions').updateOne({ articleId, userId }, { $set: { action: 'like' } });
    } else {
      updates = { $inc: { likes: 1 } };
      await database.collection('reactions').updateOne({ articleId, userId }, { $set: { action: 'like' } }, { upsert: true });
    }
  } else if (requestedAction === 'dislike') {
    if (currentVote === 'dislike') {
      updates = { $inc: { dislikes: -1 } };
      await database.collection('reactions').deleteOne({ articleId, userId });
    } else if (currentVote === 'like') {
      updates = { $inc: { likes: -1, dislikes: 1 } };
      await database.collection('reactions').updateOne({ articleId, userId }, { $set: { action: 'dislike' } });
    } else {
      updates = { $inc: { dislikes: 1 } };
      await database.collection('reactions').updateOne({ articleId, userId }, { $set: { action: 'dislike' } }, { upsert: true });
    }
  }

  if (Object.keys(updates).length > 0) {
    await database.collection('articles').updateOne({ id: articleId }, updates);
  }

  const updatedArticle = await database.collection('articles').findOne({ id: articleId });
  const userReaction = await database.collection('reactions').findOne({ articleId, userId });

  return {
    likes: updatedArticle ? updatedArticle.likes : 0,
    dislikes: updatedArticle ? updatedArticle.dislikes : 0,
    userReaction: userReaction ? userReaction.action : null
  };
}

async function getUserReaction(articleId, userId) {
  const database = await connectDB();
  if (!database) return null;
  const reaction = await database.collection('reactions').findOne({ articleId, userId });
  return reaction ? reaction.action : null;
}

// Comments
async function getComments(articleId) {
  const database = await connectDB();
  if (!database) return [];
  return database.collection('comments').find({ articleId: articleId }).toArray();
}

async function addComment(comment) {
  const database = await connectDB();
  if (!database) return comment;
  await database.collection('comments').insertOne(comment);
  return comment;
}

// Export database instance for direct usage
module.exports = {
  connectDB,
  findUserByEmail,
  findUserById,
  addUser,
  updateUser,
  updateUserPreferences,
  getArticles,
  getArticle,
  addArticle,
  recordVote,
  getUserReaction,
  getComments,
  addComment
};
