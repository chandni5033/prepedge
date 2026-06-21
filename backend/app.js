const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const passport = require('passport');
require('./config/passport');

const app = express();

app.use(helmet());
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(passport.initialize());


const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/code',      require('./routes/code'));
app.use('/api/roles',     require('./routes/role'));
app.use('/api/resources', require('./routes/resource'));
app.use('/api/quiz',      require('./routes/quiz'));

app.use(require('./middleware/errorHandler'));

module.exports = app;