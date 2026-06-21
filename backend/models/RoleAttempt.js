const mongoose = require('mongoose');

const roundProgressSchema = new mongoose.Schema({
  order:       { type: Number, required: true },
  label:       { type: String, required: true },
  category:    { type: String, required: true },
  difficulty:  { type: String, required: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', default: null },
  status:      { type: String, enum: ['locked', 'unlocked', 'in_progress', 'completed'], default: 'locked' },
}, { _id: false });

const combinedReportSchema = new mongoose.Schema({
  overallScore:       Number,
  perRoundScores:     [{ label: String, score: Number, interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' } }],
  strengths:          [String],
  weaknesses:         [String],
  recommendations:    [String],
  verdict:            String, 
}, { _id: false });

const roleAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  roleName: { type: String, required: true }, 
  rounds:   [roundProgressSchema],
  status:   { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  combinedReport: combinedReportSchema,
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('RoleAttempt', roleAttemptSchema);