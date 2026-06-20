const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  questionText:  { type: String, required: true },
  options:       { type: [String], required: true }, // exactly 4 options
  correctIndex:  { type: Number, required: true },    // 0-3
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  explanation:   { type: String },                    // shown after answering
  userAnswerIndex: { type: Number, default: null },    // null = unanswered
}, { _id: true });

const quizSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category:   { type: String, enum: ['dsa', 'webdev', 'ml', 'cs'], required: true },
  questions:  [quizQuestionSchema],
  status:     { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  score:      { type: Number, default: null },         // out of 15, set on completion
  completedAt:{ type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);