const mongoose = require('mongoose');

const DEAL_STAGE = ['qualified', 'proposal', 'negotiation', 'won', 'lost'];
const LOST_REASON = [
  'no_budget',
  'no_response',
  'not_interested',
  'bad_timing',
  'chose_competitor',
  'other',
];

const statusHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: DEAL_STAGE,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      min: 0,
      default: 0,
    },
    stage: {
      type: String,
      enum: DEAL_STAGE,
      default: 'qualified',
    },
    lostAt: {
      type: Date,
      default: null,
    },
    lostReason: {
      type: String,
      enum: LOST_REASON,
      default: null,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

dealSchema.index({ stage: 1 });
dealSchema.index({ ownerId: 1 });

dealSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Deal', dealSchema);
