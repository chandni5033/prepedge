const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.statusCode || 500;

  
  logger.error(`${req.method} ${req.originalUrl} -> ${status}`, {
    message: err.message,
    stack: err.stack,
  });

  
  const message =
    status !== 500
      ? err.message || 'Request failed'
      : isProd
        ? 'Internal server error'
        : err.message || 'Internal server error';

  const body = { message };

  if (!isProd && status === 500) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};