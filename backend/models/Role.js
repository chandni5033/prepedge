const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  order:       { type: Number, required: true },        // 1, 2, 3...
  label:       { type: String, required: true },         // "Round 1: DSA"
  category:    { type: String, enum: ['dsa', 'webdev', 'ml', 'cs', 'hr'], required: true },
  difficulty:  { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  numQuestions:{ type: Number, default: 5 },
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name:        { type: String, required: true },         // "SDE Intern"
  slug:        { type: String, required: true, unique: true }, // "sde-intern"
  description: { type: String },
  rounds:      [roundSchema],
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);