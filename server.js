const fs = require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const mongoose = require('mongoose');
const axios = require('axios'); // Use axios to download images

const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? 443 : (process.env.PORT || 3000);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('Connected to MongoDB');

    // Log card count at startup
    await logCardCount();

}).catch((err) => {
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
    race: { type: String, default: null },
    attribute: { type: String },
    card_images: { type: Array, default: [] },
    card_prices: { type: Array, default: [] },
    card_sets: { type: Array, default: [] },
});
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

const fetchRemainingCards = async (limit = 10000, startOffset = 10000) => {
    let offset = startOffset;
    let totalFetched = 0;
    let hasMoreCards = true;

    while (hasMoreCards) {
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${limit}&offset=${offset}`;
        
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url);
            const data = await response.json();

            // Check for undefined or missing data
            if (!data || !data.data || data.data.length === 0) {
                console.log('No more cards found to fetch.');
                hasMoreCards = false;
                break;
            }

            // Log the number of cards fetched in this batch
            console.log(`Fetched ${data.data.length} cards in this batch.`);

            // Save the fetched cards to MongoDB
            for (const card of data.data) {
                const existingCard = await Card.findOne({ id: card.id });
                if (existingCard) {
                    // Skip saving this card if it already exists
                    continue;
                }

                // Handle missing race
                if (!card.race) {
                    card.race = "Unknown";
                }

                // Save card data to MongoDB
                const newCard = new Card(card);
                await newCard.save();
            }

            totalFetched += data.data.length;
            offset += limit;

            console.log(`Total cards fetched and saved so far: ${totalFetched}`);

        } catch (error) {
            console.error('Error fetching cards:', error);
            hasMoreCards = false; // Stop fetching if there is an error
        }
    }

    // Log the final count of cards in the database
    try {
        const finalCount = await Card.countDocuments({});
        console.log(`Final total count of cards in the database: ${finalCount}`);
    } catch (error) {
        console.error('Error counting final documents:', error);
    }
};

// API endpoint to search for cards by name
app.get('/api/cards/search', async (req, res) => {
    const searchTerm = req.query.term || '';

    try {
        const cards = await Card.find({ name: { $regex: searchTerm, $options: 'i' } }); // Case-insensitive search
        res.json({ cards });
    } catch (error) {
        console.error('Error searching for cards:', error);
        res.status(500).json({ error: 'Error searching for cards' });
    }
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Yu-Gi-Oh! Editor page
app.get('/ygo-editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'ygo-editor.html'));
});

// API route to get cards
app.get('/api/cards', async (req, res) => {
    const { offset = 0, limit = 100 } = req.query;

    try {
        const cards = await Card.find().skip(parseInt(offset)).limit(parseInt(limit));
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
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };
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

// On startup, fetch missing cards and store them
fetchRemainingCards();
