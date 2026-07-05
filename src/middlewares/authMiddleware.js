const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    return next(new ApiError(401, 'Authentication required'));
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }

  const userId = payload.sub || payload.id || payload._id;

  if (!userId) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }

  req.user = { id: userId, role: payload.role };

  return next();
}

module.exports = authMiddleware;
