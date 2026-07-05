const { z } = require('zod');

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

const name = z
  .string()
  .trim()
  .min(1, 'name is required')
  .max(120, 'name must be at most 120 characters');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('A valid email is required'));

const phone = z.string().trim().min(1).max(30);

const status = z.enum(LEAD_STATUS, {
  message: `status must be one of: ${LEAD_STATUS.join(', ')}`,
});

const source = z.enum(LEAD_SOURCE, {
  message: `source must be one of: ${LEAD_SOURCE.join(', ')}`,
});

const lostReason = z.enum(LOST_REASON, {
  message: `lostReason must be one of: ${LOST_REASON.join(', ')}`,
});

const lostRequiresReason = (data) =>
  data.status !== 'lost' || Boolean(data.lostReason);

const lostRefinement = {
  message: 'lostReason is required when status is lost',
  path: ['lostReason'],
};

const createLeadSchema = z
  .object({
    name,
    email,
    phone: phone.optional(),
    source: source.optional(),
    status: status.default('new'),
    lostReason: lostReason.optional(),
  })
  .refine(lostRequiresReason, lostRefinement);

const updateLeadSchema = z
  .object({
    name,
    email,
    phone: phone.optional(),
    source: source.optional(),
    status,
    lostReason: lostReason.optional(),
  })
  .partial()
  .refine(lostRequiresReason, lostRefinement);

module.exports = {
  createLeadSchema,
  updateLeadSchema,
};
