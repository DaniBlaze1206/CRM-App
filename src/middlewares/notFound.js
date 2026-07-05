const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Not Found - ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
