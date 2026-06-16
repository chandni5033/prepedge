const Joi = require('joi');

const CATEGORIES  = ['dsa', 'webdev', 'ml', 'cs'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

exports.createInterview = Joi.object({
  category:     Joi.string().valid(...CATEGORIES).required(),
  difficulty:   Joi.string().valid(...DIFFICULTIES).required(),
  numQuestions: Joi.number().integer().min(1).max(20).default(5),
  mode:         Joi.string().valid('text', 'voice').default('text'),
});

exports.submitAnswer = Joi.object({
  interviewId:  Joi.string().hex().length(24).required(),
  questionId:   Joi.string().hex().length(24).required(),
  questionText: Joi.string().trim().min(1).required(),
  userAnswer:   Joi.string().allow('').max(10000).default(''),
});

exports.finishInterview = Joi.object({
  interviewId: Joi.string().hex().length(24).required(),
});

exports.getHistory = Joi.object({
  category: Joi.string().valid(...CATEGORIES),
  limit:    Joi.number().integer().min(1).max(100).default(20),
  skip:     Joi.number().integer().min(0).default(0),
});

exports.idParam = Joi.object({
  id: Joi.string().hex().length(24).required(),
});