const fs = require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const http = require('http');

// Load the correct .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

const app = express();
const PORT = process.env.PORT || 443;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    // Load SSL certificates for production
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };

    // Start the HTTPS server
    https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS Server is listening on port ${PORT}`);
        console.log(`Find this page at: https://alexwilson.info`);
    });
} else {
    // Start the HTTP server for development
    app.listen(PORT, () => {
        console.log(`HTTP Server is listening on port ${PORT}`);
        console.log(`Find this page at: http://localhost:${PORT}`);
    });
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Yu-Gi-Oh! Editor page at /ygo-editor
app.get('/ygo-editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'ygo-editor.html'));
});

// Default route to serve the under construction page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'under-construction.html'));
});
