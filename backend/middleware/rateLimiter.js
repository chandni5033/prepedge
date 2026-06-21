const rateLimit = require('express-rate-limit');

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});


exports.aiLimiter = rateLimit({
  windowMs: 60 * 1000,        
  max: 5,
  message: { message: 'Too many AI requests. Wait a moment.' },
});