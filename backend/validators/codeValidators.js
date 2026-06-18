const Joi = require('joi');

const LANGUAGES = ['cpp', 'python', 'java', 'javascript'];

exports.runCode = Joi.object({
  source_code:     Joi.string().min(1).max(50000).required(),
  language:        Joi.string().valid(...LANGUAGES).required(),
  stdin:           Joi.string().allow('').max(10000).default(''),
  expected_output: Joi.string().allow('').max(10000).default(''),
});