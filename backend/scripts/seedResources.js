// Seed script for curated learning resources.
// Usage: node scripts/seedResources.js
require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const logger   = require('../utils/logger');

const RESOURCES = [
  // ── DSA ──
  { category: 'dsa', title: 'DSA Tutorial — Learn Data Structures and Algorithms', url: 'https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/', source: 'GeeksforGeeks', description: 'Full roadmap covering arrays, trees, graphs, and core algorithms.' },
  { category: 'dsa', title: 'Introduction to Data Structures', url: 'https://www.geeksforgeeks.org/dsa/introduction-to-data-structures/', source: 'GeeksforGeeks', description: 'Linear vs non-linear data structures, fundamentals.' },
  { category: 'dsa', title: 'Dynamic Programming or DP', url: 'https://www.geeksforgeeks.org/dsa/dynamic-programming/', source: 'GeeksforGeeks', description: 'Core DP concepts, problems by topic and dimension.' },
  { category: 'dsa', title: 'How Does Dynamic Programming Work?', url: 'https://www.geeksforgeeks.org/dsa/how-does-dynamic-programming-work/', source: 'GeeksforGeeks', description: 'Memoization vs tabulation, step-by-step approach.' },
  { category: 'dsa', title: 'Learn DSA in C++', url: 'https://www.geeksforgeeks.org/cpp/learn-dsa-in-cpp/', source: 'GeeksforGeeks', description: 'DSA fundamentals using C++ STL.' },

  // ── Web Development ──
  { category: 'webdev', title: 'JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', source: 'MDN Web Docs', description: 'Overview of the JavaScript language and its core concepts.' },
  { category: 'webdev', title: 'JavaScript Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference', source: 'MDN Web Docs', description: 'Detailed reference for every JS object, method, and operator.' },
  { category: 'webdev', title: 'React — Learn', url: 'https://react.dev/learn', source: 'React (official)', description: 'Official React documentation — components, hooks, state.' },
  { category: 'webdev', title: 'Getting Started with React', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_getting_started', source: 'MDN Web Docs', description: 'Beginner-friendly intro to React with Vite.' },
  { category: 'webdev', title: 'Web Development Tutorials', url: 'https://developer.mozilla.org/en-US/docs/MDN/Tutorials', source: 'MDN Web Docs', description: 'Curated tutorials across HTML, CSS, JS, and frameworks.' },

  // ── Machine Learning ──
  { category: 'ml', title: 'Machine Learning Tutorial', url: 'https://www.geeksforgeeks.org/machine-learning/machine-learning/', source: 'GeeksforGeeks', description: 'Supervised, unsupervised, and reinforcement learning fundamentals.' },
  { category: 'ml', title: 'Machine Learning with Python Tutorial', url: 'https://www.geeksforgeeks.org/machine-learning/machine-learning-with-python/', source: 'GeeksforGeeks', description: 'End-to-end ML workflow using Python.' },
  { category: 'ml', title: 'Machine Learning Algorithms', url: 'https://www.geeksforgeeks.org/machine-learning/machine-learning-algorithms/', source: 'GeeksforGeeks', description: 'Overview of major supervised/unsupervised algorithms.' },
  { category: 'ml', title: 'Machine Learning Algorithms Cheat Sheet', url: 'https://www.geeksforgeeks.org/machine-learning/machine-learning-algorithms-cheat-sheet/', source: 'GeeksforGeeks', description: 'Quick-reference summary of common ML algorithms.' },
  { category: 'ml', title: '100+ Machine Learning Projects', url: 'https://www.geeksforgeeks.org/machine-learning/machine-learning-projects/', source: 'GeeksforGeeks', description: 'Hands-on project ideas with source code.' },

  // ── CS Fundamentals ──
  { category: 'cs', title: 'Operating System Tutorial', url: 'https://www.geeksforgeeks.org/operating-systems/', source: 'GeeksforGeeks', description: 'Process management, scheduling, memory management, deadlocks.' },
  { category: 'cs', title: 'DBMS Tutorial', url: 'https://www.geeksforgeeks.org/dbms/dbms/', source: 'GeeksforGeeks', description: 'Database architecture, ER models, normalization, transactions.' },
  { category: 'cs', title: 'Introduction of DBMS', url: 'https://www.geeksforgeeks.org/dbms/introduction-of-dbms-database-management-system-set-1/', source: 'GeeksforGeeks', description: 'DBMS fundamentals and core terminology.' },
  { category: 'cs', title: 'Basics of Computer Networking', url: 'https://www.geeksforgeeks.org/computer-networks/basics-computer-networking/', source: 'GeeksforGeeks', description: 'OSI model, TCP/IP, core networking concepts.' },
  { category: 'cs', title: '50+ OS, DBMS, CN Interview Questions', url: 'https://www.geeksforgeeks.org/interview-prep/os-cn-dbms-interview-questions/', source: 'GeeksforGeeks', description: 'Curated interview-style Q&A across all three subjects.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info('Connected to MongoDB for seeding resources');

  await Resource.deleteMany({}); // simple full replace — list is small and curated
  await Resource.insertMany(RESOURCES);

  logger.info(`Seeded ${RESOURCES.length} resources`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  logger.error('Resource seeding failed', { error: err.message });
  process.exit(1);
});