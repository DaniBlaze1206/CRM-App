const { z } = require('zod');

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

const company = z.string().trim().min(1).max(120);

const createContactSchema = z.object({
  name,
  email,
  phone: phone.optional(),
  company: company.optional(),
});

const updateContactSchema = createContactSchema.partial();

module.exports = {
  createContactSchema,
  updateContactSchema,
};
