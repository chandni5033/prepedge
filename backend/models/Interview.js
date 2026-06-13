const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  questionText:{ type: String },
  userAnswer:  { type: String },
  score:       { type: Number, min: 0, max: 10 },
  strengths:   [String],
  weaknesses:  [String],
  improvements:[String],
  idealAnswer: { type: String },
  evaluatedAt: { type: Date },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  overallScore:      Number,
  technicalScore:    Number,
  communicationScore:Number,
  strengths:         [String],
  weaknesses:        [String],
  recommendations:   [String],
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category:   { type: String, enum: ['dsa', 'webdev', 'ml', 'cs'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  mode:       { type: String, enum: ['text', 'voice'], default: 'text' },
  numQuestions:{ type: Number, default: 5 },
  questions:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  answers:    [answerSchema],
  status:     { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  finalScore: { type: Number },
  report:     reportSchema,
  startedAt:  { type: Date, default: Date.now },
  completedAt:{ type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);