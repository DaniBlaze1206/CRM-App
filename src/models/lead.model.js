const mongoose = require('mongoose');

const LEAD_STATUS = ['new', 'contacted', 'qualified', 'lost'];
const LEAD_SOURCE = ['web', 'referral', 'event', 'social', 'ad', 'other'];
const LOST_REASON = [
  'no_budget',
  'no_response',
  'not_interested',
  'bad_timing',
  'chose_competitor',
  'other',
];

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: LEAD_SOURCE,
    },
    status: {
      type: String,
      enum: LEAD_STATUS,
      default: 'new',
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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

leadSchema.index({ ownerId: 1, status: 1 });
leadSchema.index({ email: 1 });

leadSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Lead', leadSchema);
