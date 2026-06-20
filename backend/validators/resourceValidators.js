const Joi = require('joi');

exports.listResources = Joi.object({
  category: Joi.string().valid('dsa', 'webdev', 'ml', 'cs'),
});