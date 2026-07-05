const mongoose = require('mongoose');
const Contact = require('../models/contact.model');
const ApiError = require('../utils/ApiError');

const isOwnerOrAdmin = (contact, user) =>
  user.role === 'admin' || contact.ownerId.toString() === user.id;

async function create(data, user) {
  const contact = await Contact.create({ ...data, ownerId: user.id });
  return contact;
}

async function getById(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Contact not found');
  }

  const contact = await Contact.findById(id);
  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  if (!isOwnerOrAdmin(contact, user)) {
    throw new ApiError(403, 'Forbidden');
  }

  return contact;
}

async function list(user) {
  const filter = user.role === 'admin' ? {} : { ownerId: user.id };
  return Contact.find(filter).sort({ createdAt: -1 });
}

async function update(id, data, user) {
  const contact = await getById(id, user);
  Object.assign(contact, data);
  await contact.save();
  return contact;
}

async function remove(id, user) {
  const contact = await getById(id, user);
  await contact.deleteOne();
  return contact;
}

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
};
