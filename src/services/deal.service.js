const mongoose = require('mongoose');
const Deal = require('../models/deal.model');
const Contact = require('../models/contact.model');
const ApiError = require('../utils/ApiError');

// Legal stage graph. Deals move forward through the pipeline, may go to lost
// from any active stage, and won/lost are terminal.
const STAGE_TRANSITIONS = {
  qualified: ['proposal', 'lost'],
  proposal: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: [],
};

const isOwnerOrAdmin = (deal, user) =>
  user.role === 'admin' || deal.ownerId.toString() === user.id;

async function create(data, user) {
  if (!(await Contact.exists({ _id: data.contactId }))) {
    throw new ApiError(404, 'Contact not found');
  }

  const deal = await Deal.create({
    ...data,
    ownerId: user.id,
    statusHistory: [
      { stage: data.stage || 'qualified', changedBy: user.id },
    ],
  });
  return deal;
}

async function getById(id, user) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Deal not found');
  }

  const deal = await Deal.findById(id);
  if (!deal) {
    throw new ApiError(404, 'Deal not found');
  }

  if (!isOwnerOrAdmin(deal, user)) {
    throw new ApiError(403, 'Forbidden');
  }

  return deal;
}

async function list(user) {
  const filter = user.role === 'admin' ? {} : { ownerId: user.id };
  return Deal.find(filter).sort({ createdAt: -1 });
}

// Generic edits only. Stage moves go through changeStage so the transition is
// validated and statusHistory stays honest; lost fields are set there too.
async function update(id, data, user) {
  const deal = await getById(id, user);

  const patch = { ...data };
  delete patch.stage;
  delete patch.lostAt;
  delete patch.lostReason;

  if (patch.contactId && !(await Contact.exists({ _id: patch.contactId }))) {
    throw new ApiError(404, 'Contact not found');
  }

  Object.assign(deal, patch);
  await deal.save();
  return deal;
}

async function remove(id, user) {
  const deal = await getById(id, user);
  await deal.deleteOne();
  return deal;
}

// Validate the transition is legal, set the stage, and on a move to lost
// require and set lostReason + lostAt together. Appends a statusHistory entry.
// One document, one save -> atomic, so no transaction is needed here.
async function changeStage(id, { stage, lostReason }, user) {
  const deal = await getById(id, user);

  const allowed = STAGE_TRANSITIONS[deal.stage] || [];
  if (!allowed.includes(stage)) {
    throw new ApiError(
      400,
      `Illegal stage transition: ${deal.stage} -> ${stage}`
    );
  }

  if (stage === 'lost') {
    if (!lostReason) {
      throw new ApiError(400, 'lostReason is required when a deal is lost');
    }
    deal.lostReason = lostReason;
    deal.lostAt = new Date();
  }

  deal.stage = stage;
  deal.statusHistory.push({ stage, changedBy: user.id });
  await deal.save();
  return deal;
}

async function markLost(id, lostReason, user) {
  return changeStage(id, { stage: 'lost', lostReason }, user);
}

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
  changeStage,
  markLost,
};
