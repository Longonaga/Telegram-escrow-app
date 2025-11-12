const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const miniWebAppRoutes = require('./routes/miniWebApp');

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// basic rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
}));

// serve mini web app static files
app.use('/mini', express.static(path.join(__dirname, '..', 'public', 'miniWebApp')));

// API for mini web app
app.use('/api/mini', miniWebAppRoutes);

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

module.exports = app;
