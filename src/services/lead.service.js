const mongoose = require('mongoose');
const Lead = require('../models/lead.model');
const Contact = require('../models/contact.model');
const ApiError = require('../utils/ApiError');

const isOwnerOrAdmin = (lead, user) =>
  user.role === 'admin' || lead.ownerId.toString() === user.id;

async function create(data, user) {
  const lead = await Lead.create({ ...data, ownerId: user.id });
  return lead;
}

async function getById(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Lead not found');
  }

  const lead = await Lead.findById(id);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  if (!isOwnerOrAdmin(lead, user)) {
    throw new ApiError(403, 'Forbidden');
  }

  return lead;
}

async function list(user, { includeLost = false } = {}) {
  const filter = user.role === 'admin' ? {} : { ownerId: user.id };
  if (!includeLost) {
    filter.status = { $ne: 'lost' };
  }
  return Lead.find(filter).sort({ createdAt: -1 });
}

async function update(id, data, user) {
  const lead = await getById(id, user);

  const patch = { ...data };
  if (patch.status === 'lost') {
    patch.lostAt = new Date();
  } else if (patch.status) {
    patch.lostAt = null;
    patch.lostReason = null;
  }

  Object.assign(lead, patch);
  await lead.save();
  return lead;
}

async function remove(id, user) {
  const lead = await getById(id, user);
  await lead.deleteOne();
  return lead;
}

async function markLost(id, lostReason, user) {
  const lead = await getById(id, user);
  lead.status = 'lost';
  lead.lostAt = new Date();
  lead.lostReason = lostReason;
  await lead.save();
  return lead;
}

async function convert(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Lead not found');
  }

  const session = await mongoose.startSession();
  try {
    let contact;

    await session.withTransaction(async () => {
      const lead = await Lead.findById(id).session(session);
      if (!lead) {
        throw new ApiError(404, 'Lead not found');
      }
      if (!isOwnerOrAdmin(lead, user)) {
        throw new ApiError(403, 'Forbidden');
      }

      const created = await Contact.create(
        [
          {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            ownerId: lead.ownerId,
            convertedAt: new Date(),
          },
        ],
        { session }
      );
      contact = created[0];

      const { deletedCount } = await Lead.deleteOne(
        { _id: lead._id },
        { session }
      );
      if (deletedCount !== 1) {
        throw new ApiError(409, 'Lead could not be converted');
      }
    });

    return contact;
  } finally {
    session.endSession();
  }
}

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
  markLost,
  convert,
};
