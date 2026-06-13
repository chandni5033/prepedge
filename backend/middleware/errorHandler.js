module.exports = (err, req, res, next) => {
    console.error("ERROR:");
  console.error(err);
  
  console.error(err.stack);
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';
  res.status(status).json({ message });
};