const Joi = require('joi');

const password = Joi.string().min(6).max(72).required().messages({
  'string.min': 'Password must be at least 6 characters',
});

exports.register = Joi.object({
  name:     Joi.string().trim().min(2).max(60).required(),
  email:    Joi.string().trim().lowercase().email().required(),
  password,
});

exports.login = Joi.object({
  email:    Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

exports.updateProfile = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
});

exports.changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     password,
});

exports.setPassword = Joi.object({
  newPassword: password,
});