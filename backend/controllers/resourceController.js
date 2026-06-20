const Resource = require('../models/Resource');

// GET /api/resources?category=dsa
exports.listResources = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const resources = await Resource.find(filter).sort({ category: 1, title: 1 });
    res.json({ resources });
  } catch (err) {
    next(err);
  }
};