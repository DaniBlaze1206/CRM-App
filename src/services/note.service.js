const mongoose = require('mongoose');
const Note = require('../models/note.model');
const Contact = require('../models/contact.model');
const Deal = require('../models/deal.model');
const ApiError = require('../utils/ApiError');

const isAuthorOrAdmin = (note, user) =>
  user.role === 'admin' || note.authorId.toString() === user.id;

async function verifyRefs({ contactId, dealId }) {
  if (contactId && !(await Contact.exists({ _id: contactId }))) {
    throw new ApiError(404, 'Contact not found');
  }
  if (dealId && !(await Deal.exists({ _id: dealId }))) {
    throw new ApiError(404, 'Deal not found');
  }
}

async function create(data, user) {
  await verifyRefs(data);
  const note = await Note.create({ ...data, authorId: user.id });
  return note;
}

async function getById(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Note not found');
  }

  const note = await Note.findById(id);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  if (!isAuthorOrAdmin(note, user)) {
    throw new ApiError(403, 'Forbidden');
  }

  return note;
}

async function list(user, { contactId } = {}) {
  const filter = user.role === 'admin' ? {} : { authorId: user.id };
  if (contactId) {
    filter.contactId = contactId;
  }
  return Note.find(filter).sort({ createdAt: -1 });
}

async function update(id, data, user) {
  const note = await getById(id, user);
  await verifyRefs(data);
  Object.assign(note, data);
  await note.save();
  return note;
}

async function remove(id, user) {
  const note = await getById(id, user);
  await note.deleteOne();
  return note;
}

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
};
