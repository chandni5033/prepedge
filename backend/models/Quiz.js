const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  questionText:  { type: String, required: true },
  options:       { type: [String], required: true }, 
  correctIndex:  { type: Number, required: true },    
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  explanation:   { type: String },                   
  userAnswerIndex: { type: Number, default: null },    
}, { _id: true });

const quizSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category:   { type: String, enum: ['dsa', 'webdev', 'ml', 'cs'], required: true },
  questions:  [quizQuestionSchema],
  status:     { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  score:      { type: Number, default: null },         
  completedAt:{ type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);