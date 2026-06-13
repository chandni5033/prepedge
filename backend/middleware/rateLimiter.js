const rateLimit = require('express-rate-limit');

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});

// Stricter limiter for AI endpoints (they cost money)
exports.aiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 min
  max: 5,
  message: { message: 'Too many AI requests. Wait a moment.' },
});