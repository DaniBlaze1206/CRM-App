const { z } = require('zod');

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'must be a valid ObjectId');

const description = z
  .string()
  .trim()
  .min(1, 'description is required')
  .max(1000, 'description must be at most 1000 characters');

const dueDate = z.coerce
  .date({ message: 'dueDate must be a valid date' })
  .refine((d) => d.getTime() > Date.now(), 'dueDate must be in the future');

const createFollowUpSchema = z.object({
  description,
  dueDate,
  contactId: objectId,
  dealId: objectId.optional(),
  assigneeId: objectId.optional(),
  done: z.boolean().default(false),
});

const updateFollowUpSchema = createFollowUpSchema.partial();

module.exports = {
  createFollowUpSchema,
  updateFollowUpSchema,
};
