// One-time / re-runnable seed script for Role documents.
// Usage: node scripts/seedRoles.js
require('dotenv').config();
const mongoose = require('mongoose');
const Role     = require('../models/Role');
const logger   = require('../utils/logger');

const ROLES = [
  {
    name: 'SDE Intern',
    slug: 'sde-intern',
    description: 'A 3-round loop covering data structures, CS fundamentals, and behavioral fit — typical of internship hiring at product companies.',
    rounds: [
      { order: 1, label: 'Round 1: DSA',              category: 'dsa', difficulty: 'easy',   numQuestions: 5 },
      { order: 2, label: 'Round 2: CS Fundamentals',  category: 'cs',  difficulty: 'medium', numQuestions: 5 },
      { order: 3, label: 'Round 3: HR / Behavioral',  category: 'hr',  difficulty: 'medium', numQuestions: 5 },
    ],
  },
  {
    name: 'Backend Engineer',
    slug: 'backend-engineer',
    description: 'A 3-round loop focused on algorithmic problem solving, systems fundamentals, and behavioral fit.',
    rounds: [
      { order: 1, label: 'Round 1: DSA',              category: 'dsa', difficulty: 'medium', numQuestions: 5 },
      { order: 2, label: 'Round 2: CS Fundamentals',  category: 'cs',  difficulty: 'medium', numQuestions: 5 },
      { order: 3, label: 'Round 3: HR / Behavioral',  category: 'hr',  difficulty: 'medium', numQuestions: 5 },
    ],
  },
  {
    name: 'Frontend Engineer',
    slug: 'frontend-engineer',
    description: 'A 3-round loop covering web development fundamentals, lighter algorithmic screening, and behavioral fit.',
    rounds: [
      { order: 1, label: 'Round 1: Web Development',  category: 'webdev', difficulty: 'easy',   numQuestions: 5 },
      { order: 2, label: 'Round 2: DSA',                category: 'dsa',    difficulty: 'easy',   numQuestions: 5 },
      { order: 3, label: 'Round 3: HR / Behavioral',    category: 'hr',     difficulty: 'medium', numQuestions: 5 },
    ],
  },
  {
    name: 'ML Engineer',
    slug: 'ml-engineer',
    description: 'A 3-round loop covering coding screening, applied ML depth, and behavioral fit.',
    rounds: [
      { order: 1, label: 'Round 1: DSA',                category: 'dsa', difficulty: 'easy',   numQuestions: 5 },
      { order: 2, label: 'Round 2: Machine Learning',  category: 'ml',  difficulty: 'medium', numQuestions: 5 },
      { order: 3, label: 'Round 3: HR / Behavioral',    category: 'hr',  difficulty: 'medium', numQuestions: 5 },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info('Connected to MongoDB for seeding');

  for (const role of ROLES) {
    await Role.findOneAndUpdate(
      { slug: role.slug },
      role,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info(`Upserted role: ${role.name}`);
  }

  logger.info('Role seeding complete');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  logger.error('Seeding failed', { error: err.message });
  process.exit(1);
});