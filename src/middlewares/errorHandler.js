const config = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  const isOperational = err instanceof ApiError || err.isOperational === true;
  const statusCode = err.statusCode || err.status || 500;

  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(`${statusCode} ${req.method} ${req.originalUrl} - ${err.message}`);
  }

  const message =
    isOperational || config.isDevelopment ? err.message : 'Internal Server Error';

  const body = { error: message };

  if (config.isDevelopment && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
