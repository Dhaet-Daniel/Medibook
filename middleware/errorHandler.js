// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
function errorHandler(err, req, res, next) {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';
  let details = err.details || null;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = Object.values(err.errors).map(e => e.message);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for field: ${field}`;
    details = [`${field} already exists`];
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  }

  // Handle express-validator errors
  if (err.errors && Array.isArray(err.errors)) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors.map(e => e.msg);
  }

  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.stack || err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = { AppError, errorHandler };