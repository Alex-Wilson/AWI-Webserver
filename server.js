const https = require('https');
const http = require('http');
const fs = require('fs');
const express = require('express');
const path = require('path');
const app = express();

// SSL options
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/alexwilson.info/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/alexwilson.info/fullchain.pem')
};

// Redirect all HTTP requests to HTTPS
http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80, () => {
    console.log("HTTP Server listening on port 80 and redirecting to HTTPS");
});

// Middleware to redirect www to non-www and enforce HTTPS
app.use((req, res, next) => {
    // Check if the request is not using HTTPS
    if (req.header('x-forwarded-proto') !== 'https' && !req.secure) {
        return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }

    // Check if the request is using 'www.' and redirect to the non-www version
    if (req.headers.host && req.headers.host.startsWith('www.')) {
        const newHost = req.headers.host.slice(4); // Remove 'www.'
        return res.redirect(301, `https://${newHost}${req.originalUrl}`);
    }

    // Proceed to the next middleware if already on HTTPS and non-www
    next();
});

app.use(express.static(path.join(__dirname,'public')));

// Serve the "Under Construction" HTML file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'under_construction.html'));
});

// Set the port to 443 for HTTPS
const PORT = 443;

// Start the HTTPS server
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server is listening on port ${PORT}`);
});
