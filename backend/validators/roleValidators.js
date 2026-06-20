const Joi = require('joi');

exports.slugParam = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).required(),
});

exports.attemptIdParam = Joi.object({
  attemptId: Joi.string().hex().length(24).required(),
});

exports.roundParam = Joi.object({
  attemptId: Joi.string().hex().length(24).required(),
  order:     Joi.number().integer().min(1).required(),
});