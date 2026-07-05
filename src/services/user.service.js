const mongoose = require('mongoose');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

async function assertNotLastAdmin(user, action) {
  if (user.role !== 'admin') return;

  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount <= 1) {
    throw new ApiError(409, `Cannot ${action} the last admin`);
  }
}

async function getById(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'User not found');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
}

async function list() {
  return User.find().sort({ createdAt: -1 });
}

async function update(id, data) {
  const user = await getById(id);

  const demoting = data.role && data.role !== 'admin' && user.role === 'admin';
  if (demoting) {
    await assertNotLastAdmin(user, 'demote');
  }

  Object.assign(user, data);

  try {
    await user.save();
  } catch (err) {
    if (err && err.code === 11000) {
      throw new ApiError(409, 'Email already registered');
    }
    throw err;
  }

  return user;
}

async function remove(id) {
  const user = await getById(id);
  await assertNotLastAdmin(user, 'delete');
  await user.deleteOne();
  return user;
}

module.exports = {
  getById,
  list,
  update,
  remove,
};
