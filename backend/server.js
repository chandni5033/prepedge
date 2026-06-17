require('dotenv').config();
const connectDB = require('./config/db');
const logger    = require('./utils/logger');
const app       = require('./app');

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on ${PORT}`));