const fs = require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? 443 : process.env.PORT || 3000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await logCardCount();
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Define the card schema
const cardSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  desc: { type: String },
  atk: { type: Number, default: null },
  def: { type: Number, default: null },
  level: { type: Number, default: null },
  rank: { type: Number, default: null }, // For XYZ Monsters
  linkval: { type: Number, default: null }, // For Link Monsters
  scale: { type: Number, default: null }, // For Pendulum Monsters
  race: { type: String, default: null },
  attribute: { type: String },
  card_images: { type: Array, default: [] },
  card_prices: { type: Array, default: [] },
  card_sets: { type: Array, default: [] },
});

// Create indexes for efficient querying
cardSchema.index({ name: 1 });
cardSchema.index({ type: 1 });
cardSchema.index({ race: 1 });
cardSchema.index({ attribute: 1 });
cardSchema.index({ level: 1 });
cardSchema.index({ rank: 1 });
cardSchema.index({ linkval: 1 });
cardSchema.index({ scale: 1 });
cardSchema.index({ 'card_sets.set_rarity': 1 });

const Card = mongoose.model('Card', cardSchema);

// Log the current number of cards in the database
const logCardCount = async () => {
  try {
    const count = await Card.countDocuments({});
    console.log(`Total number of cards in the database: ${count}`);
  } catch (error) {
    console.error('Error counting documents:', error);
  }
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Yu-Gi-Oh! Editor page
app.get('/ygo-editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'ygo-editor.html'));
});

// Function to build the query object based on filters
function buildQuery(filters) {
  const {
    rarity,
    cardType,
    monsterType,
    monsterSubType,
    monsterAbility,
    monsterRace,
    monsterAttribute,
    monsterLevel,
    monsterRank,
    linkRating,
    pendulumScale,
    spellType,
    trapType,
  } = filters;

  const query = {};

  // Mapping objects
  const cardTypeMap = {
    Monster: /.*Monster.*/i,
    Spell: /^Spell Card$/i,
    Trap: /^Trap Card$/i,
  };

  const spellTypeMap = {
    'Normal': /^Spell Card$/i,
    'Field': /^Spell Card Field$/i,
    'Equip': /^Spell Card Equip$/i,
    'Continuous': /^Spell Card Continuous$/i,
    'Quick-Play': /^Spell Card Quick-Play$/i,
    'Ritual': /^Spell Card Ritual$/i,
  };

  const trapTypeMap = {
    'Normal': /^Trap Card$/i,
    'Continuous': /^Trap Card Continuous$/i,
    'Counter': /^Trap Card Counter$/i,
  };

  const monsterAbilityMap = {
    'Spirit': /Spirit/i,
    'Toon': /Toon/i,
    'Union': /Union/i,
    'Gemini': /Gemini/i,
    'Flip': /Flip/i,
  };

  const monsterTypeMap = {
    'Normal Monster': /^Normal Monster$/i,
    'Effect Monster': /^Effect Monster$/i,
    'Fusion Monster': /^Fusion Monster$/i,
    'Ritual Monster': /^Ritual Monster$/i,
    'Synchro Monster': /Synchro.*Monster/i,
    'XYZ Monster': /Xyz.*Monster/i,
    'Pendulum Monster': /Pendulum.*Monster/i,
    'Link Monster': /^Link Monster$/i,
    // Add other mappings as needed
  };

  // Apply filters
  if (cardType && cardType !== 'all') {
    const typeFilter = cardTypeMap[cardType];
    if (typeFilter instanceof RegExp) {
      query.type = { $regex: typeFilter };
    } else {
      query.type = typeFilter;
    }
  }

  if (rarity) {
    query['card_sets.set_rarity'] = rarity;
  }

  if (monsterType) {
    const typeFilter = monsterTypeMap[monsterType];
    if (typeFilter instanceof RegExp) {
      query.type = { $regex: typeFilter };
    } else {
      query.type = typeFilter;
    }
  }

  if (monsterSubType) {
    query.type = { $regex: new RegExp(monsterSubType, 'i') };
  }

  if (monsterAbility) {
    const abilityFilter = monsterAbilityMap[monsterAbility];
    if (abilityFilter) {
      query.desc = { $regex: abilityFilter };
    }
  }

  if (monsterRace) {
    query.race = monsterRace;
  }

  if (monsterAttribute) {
    query.attribute = monsterAttribute;
  }

  if (monsterLevel) {
    query.level = parseInt(monsterLevel, 10);
  }

  if (monsterRank) {
    query.rank = parseInt(monsterRank, 10);
  }

  if (linkRating) {
    query.linkval = parseInt(linkRating, 10);
  }

  if (pendulumScale) {
    query.scale = parseInt(pendulumScale, 10);
  }

  if (spellType) {
    const typeFilter = spellTypeMap[spellType];
    if (typeFilter) {
      query.type = { $regex: typeFilter };
    }
  }

  if (trapType) {
    const typeFilter = trapTypeMap[trapType];
    if (typeFilter) {
      query.type = { $regex: typeFilter };
    }
  }

  return query;
}

// Function to perform flexible regex search
async function performFlexibleSearch(term, query, offset, limit) {
  // Input validation
  if (term.length > 100) {
    throw new Error('Search term is too long.');
  }

  const isValidTerm = /^[\w\s'-]{1,100}$/.test(term);
  if (!isValidTerm) {
    throw new Error('Invalid search term.');
  }

  // Normalize the search term
  const normalizedTerm = term.toLowerCase().trim();

  // Escape special regex characters
  const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Construct the flexible regex pattern
  const regexPattern = escapedTerm.split(/\s+/).join('.*');
  const regex = new RegExp(regexPattern, 'i');

  // Add the regex search to the query
  const regexQuery = { ...query, name: { $regex: regex } };

  // Perform the search with filters and pagination
  const cards = await Card.find(regexQuery)
    .collation({ locale: 'en', strength: 2 })
    .skip(parseInt(offset, 10))
    .limit(parseInt(limit, 10));

  return cards;
}

// API endpoint to search for cards by name with filters
app.get('/api/cards/search', async (req, res) => {
  // Extract query parameters
  const {
    term = '',
    offset = 0,
    limit = 100,
    rarity,
    cardType,
    monsterType,
    monsterSubType,
    monsterAbility,
    monsterRace,
    monsterAttribute,
    monsterLevel,
    monsterRank,
    linkRating,
    pendulumScale,
    spellType,
    trapType,
  } = req.query;

  // Build the query object
  const query = buildQuery({
    rarity,
    cardType,
    monsterType,
    monsterSubType,
    monsterAbility,
    monsterRace,
    monsterAttribute,
    monsterLevel,
    monsterRank,
    linkRating,
    pendulumScale,
    spellType,
    trapType,
  });

  try {
    let cards = [];
    if (term) {
      // Perform a flexible regex search
      cards = await performFlexibleSearch(term, query, offset, limit);
    } else {
      // No search term; perform regular query with filters
      cards = await Card.find(query)
        .collation({ locale: 'en', strength: 2 })
        .skip(parseInt(offset, 10))
        .limit(parseInt(limit, 10));
    }

    res.json({ cards });
  } catch (error) {
    console.error('Error searching for cards:', error);
    res.status(500).json({ error: 'Error searching for cards' });
  }
});

// API route to get cards with filters
app.get('/api/cards', async (req, res) => {
  // Extract query parameters
  const {
    term = '',
    offset = 0,
    limit = 100,
    rarity,
    cardType,
    monsterType,
    monsterSubType,
    monsterAbility,
    monsterRace,
    monsterAttribute,
    monsterLevel,
    monsterRank,
    linkRating,
    pendulumScale,
    spellType,
    trapType,
  } = req.query;

  // Build the query object
  const query = buildQuery({
    rarity,
    cardType,
    monsterType,
    monsterSubType,
    monsterAbility,
    monsterRace,
    monsterAttribute,
    monsterLevel,
    monsterRank,
    linkRating,
    pendulumScale,
    spellType,
    trapType,
  });

  try {
    let cards = [];
    if (term) {
      // Perform a flexible regex search
      cards = await performFlexibleSearch(term, query, offset, limit);
    } else {
      // No search term; perform regular query with filters
      cards = await Card.find(query)
        .collation({ locale: 'en', strength: 2 })
        .skip(parseInt(offset, 10))
        .limit(parseInt(limit, 10));
    }

    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).send('Error fetching card data');
  }
});

// Default route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'under-construction.html'));
});

// Start the server
if (isProduction) {
  let options = {};
  try {
    options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };
  } catch (error) {
    console.error('Error loading SSL certificates:', error);
    process.exit(1);
  }
  https.createServer(options, app).listen(PORT, () => {
    console.log('Running in PRODUCTION');
    console.log(`HTTPS Server is listening on port ${PORT}`);
    console.log(`Find this page at: https://alexwilson.info`);
  });
} else {
  app.listen(PORT, () => {
    console.log('Running in DEVELOPMENT');
    console.log(`HTTP Server is listening on port ${PORT}`);
    console.log(`Find this page at: http://localhost:${PORT}/ygo-editor`);
  });
}

// Initialize the database (optional)
const initializeDatabase = async () => {
  const count = await Card.countDocuments({});
  if (count === 0) {
    console.log('Database is empty. Please populate the database before starting the server.');
  } else {
    console.log('Cards already fetched. Skipping initialization.');
  }
};
initializeDatabase();

// Graceful shutdown
const shutdown = () => {
  mongoose.connection.close(() => {
    console.log('Mongoose connection disconnected through app termination');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown).on('SIGTERM', shutdown);
