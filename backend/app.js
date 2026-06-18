const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const passport = require('passport');
require('./config/passport');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(passport.initialize());

// Rate limiter on AI-heavy routes
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/code',      require('./routes/code'));

app.use(require('./middleware/errorHandler'));

module.exports = app;