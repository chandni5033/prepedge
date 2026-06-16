module.exports = (schema, { source = 'body' } = {}) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   
      stripUnknown: true,  
    });

    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map(d => d.message.replace(/"/g, '')),
      });
    }

    req[source] = value; 
    next();
  };
};