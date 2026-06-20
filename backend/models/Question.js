const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  category:      { type: String, enum: ['dsa', 'webdev', 'ml', 'cs', 'hr'], required: true },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  questionText:  { type: String, required: true },
  expectedTopics:[String],
  source:        { type: String, enum: ['ai_generated', 'seeded'], default: 'ai_generated' },
}, { timestamps: true });

questionSchema.index({ category: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);