const { z } = require('zod');

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'must be a valid ObjectId');

const body = z
  .string()
  .trim()
  .min(1, 'body is required')
  .max(5000, 'body must be at most 5000 characters');

const createNoteSchema = z.object({
  body,
  contactId: objectId,
  dealId: objectId.optional(),
});

const updateNoteSchema = createNoteSchema.partial();

module.exports = {
  createNoteSchema,
  updateNoteSchema,
};
