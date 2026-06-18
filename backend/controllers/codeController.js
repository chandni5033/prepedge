const judge0 = require('../services/judge0Service');

exports.runCode = async (req, res, next) => {
  try {
    const { source_code, language, stdin, expected_output } = req.body;
    const result = await judge0.runCode({ source_code, language, stdin, expected_output });
    res.json(result);
  } catch (err) {
    next(err);
  }
};