const fs = require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 443;
const isProduction = process.env.NODE_ENV === 'production';

// Function to fetch paginated data from YGOPRODeck API
const fetchPaginatedData = async (page = 1, limit = 25) => {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${limit}&offset=${(page - 1) * limit}`;
    const response = await fetch(url);
    return response.json();
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Yu-Gi-Oh! Editor page at /ygo-editor
app.get('/ygo-editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'ygo-editor.html'));
});

// API route to get paginated card data (lazy loading)
app.get('/api/cards', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query; // Default to page 1, 50 cards per page
        const cardData = await fetchPaginatedData(page, limit);
        res.json(cardData);
    } catch (error) {
        res.status(500).send('Error fetching card data');
    }
});

// Default route to serve the under construction page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'under-construction.html'));
});

// Start the HTTPS server for production or HTTP for development
if (isProduction) {
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };
    https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS Server is listening on port ${PORT}`);
        console.log(`Find this page at: https://alexwilson.info`);
    });
} else {
    app.listen(PORT, () => {
        console.log(`HTTP Server is listening on port ${PORT}`);
        console.log(`Find this page at: http://localhost:${PORT}`);
    });
}
