const { validationResult } = require('express-validator');

// Middleware to check validation results
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 400;
    error.errors = errors.array();
    return next(error);
  }
  next();
}

module.exports = validateRequest;