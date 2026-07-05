const { z } = require('zod');

const DEAL_STAGE = ['qualified', 'proposal', 'negotiation', 'won', 'lost'];
const LOST_REASON = [
  'no_budget',
  'no_response',
  'not_interested',
  'bad_timing',
  'chose_competitor',
  'other',
];

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'must be a valid ObjectId');

const title = z
  .string()
  .trim()
  .min(1, 'title is required')
  .max(200, 'title must be at most 200 characters');

const value = z
  .number({ message: 'value must be a number' })
  .min(0, 'value must be non-negative');

const stage = z.enum(DEAL_STAGE, {
  message: `stage must be one of: ${DEAL_STAGE.join(', ')}`,
});

const lostReason = z.enum(LOST_REASON, {
  message: `lostReason must be one of: ${LOST_REASON.join(', ')}`,
});

const lostRequiresReason = (data) =>
  data.stage !== 'lost' || Boolean(data.lostReason);

const lostRefinement = {
  message: 'lostReason is required when stage is lost',
  path: ['lostReason'],
};

const createDealSchema = z
  .object({
    title,
    value,
    stage: stage.default('qualified'),
    contactId: objectId,
    lostReason: lostReason.optional(),
  })
  .refine(lostRequiresReason, lostRefinement);

const updateDealSchema = z
  .object({
    title,
    value,
    stage,
    contactId: objectId,
    lostReason: lostReason.optional(),
  })
  .partial()
  .refine(lostRequiresReason, lostRefinement);

module.exports = {
  createDealSchema,
  updateDealSchema,
};
