const ApiError = require('../utils/ApiError');

function authorize(...allowedRoles) {
  return function (req, res, next) {
    const role = req.user && req.user.role;

    if (!role || !allowedRoles.includes(role)) {
      return next(new ApiError(403, 'Forbidden'));
    }

    return next();
  };
}

module.exports = authorize;
