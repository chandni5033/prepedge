const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  category:    { type: String, enum: ['dsa', 'webdev', 'ml', 'cs'], required: true, index: true },
  title:       { type: String, required: true },
  url:         { type: String, required: true },
  source:      { type: String, required: true }, 
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);