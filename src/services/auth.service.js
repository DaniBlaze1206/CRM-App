const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-equalization', 10);

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

async function register(data) {
  const { name, email, password } = data;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  let user;
  try {
    user = await User.create({ name, email, passwordHash: password });
  } catch (err) {
    if (err && err.code === 11000) {
      throw new ApiError(409, 'Email already registered');
    }
    throw err;
  }

  const token = signToken(user);
  return { user, token };
}

async function login(identifier, password) {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { name: identifier }],
  });

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new ApiError(401, 'Invalid credentials');
  }

  const ok = await user.checkPassword(password);
  if (!ok) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signToken(user);
  return { user, token };
}

module.exports = {
  register,
  login,
};
