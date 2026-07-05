const mongoose = require('mongoose');
const FollowUp = require('../models/followup.model');
const Contact = require('../models/contact.model');
const Deal = require('../models/deal.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');

const isAssigneeOrAdmin = (followUp, user) =>
  user.role === 'admin' || followUp.assigneeId.toString() === user.id;

async function verifyRefs({ contactId, dealId, assigneeId }) {
  if (contactId && !(await Contact.exists({ _id: contactId }))) {
    throw new ApiError(404, 'Contact not found');
  }
  if (dealId && !(await Deal.exists({ _id: dealId }))) {
    throw new ApiError(404, 'Deal not found');
  }
  if (assigneeId && !(await User.exists({ _id: assigneeId }))) {
    throw new ApiError(404, 'Assignee not found');
  }
}

async function create(data, user) {
  await verifyRefs(data);
  const followUp = await FollowUp.create({
    ...data,
    assigneeId: data.assigneeId || user.id,
  });
  return followUp;
}

async function getById(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Follow-up not found');
  }

  const followUp = await FollowUp.findById(id);
  if (!followUp) {
    throw new ApiError(404, 'Follow-up not found');
  }

  if (!isAssigneeOrAdmin(followUp, user)) {
    throw new ApiError(403, 'Forbidden');
  }

  return followUp;
}

async function list(user) {
  const filter = user.role === 'admin' ? {} : { assigneeId: user.id };
  return FollowUp.find(filter).sort({ dueDate: 1 });
}

async function update(id, data, user) {
  const followUp = await getById(id, user);
  await verifyRefs(data);
  Object.assign(followUp, data);
  await followUp.save();
  return followUp;
}

async function remove(id, user) {
  const followUp = await getById(id, user);
  await followUp.deleteOne();
  return followUp;
}

async function getDue(user, range = 'today') {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  let dueDate;
  if (range === 'overdue') {
    dueDate = { $lt: startOfToday };
  } else if (range === 'week') {
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    dueDate = { $gte: startOfToday, $lt: endOfWeek };
  } else {
    dueDate = { $gte: startOfToday, $lt: startOfTomorrow };
  }

  return FollowUp.find({
    assigneeId: user.id,
    done: false,
    dueDate,
  }).sort({ dueDate: 1 });
}

async function complete(id, user) {
  const followUp = await getById(id, user);
  followUp.done = true;
  await followUp.save();
  return followUp;
}

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
  getDue,
  complete,
};
