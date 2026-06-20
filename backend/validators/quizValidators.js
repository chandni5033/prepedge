const Joi = require('joi');

const CATEGORIES = ['dsa', 'webdev', 'ml', 'cs'];

exports.createQuiz = Joi.object({
  category: Joi.string().valid(...CATEGORIES).required(),
});

exports.answerQuestion = Joi.object({
  questionId:    Joi.string().hex().length(24).required(),
  selectedIndex: Joi.number().integer().min(0).max(3).required(),
});

exports.idParam = Joi.object({
  id: Joi.string().hex().length(24).required(),
});