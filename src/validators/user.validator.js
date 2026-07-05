const { z } = require('zod');

const ROLES = ['admin', 'user'];

const name = z
  .string()
  .trim()
  .min(3, 'name must be at least 3 characters')
  .max(30, 'name must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'name may contain only letters, numbers, and underscores'
  );

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('A valid email is required'));

const role = z.enum(ROLES, {
  message: `role must be one of: ${ROLES.join(', ')}`,
});

const createUserSchema = z.object({
  name,
  email,
  role: role.default('user'),
});

const updateUserSchema = z
  .object({
    name,
    email,
    role,
  })
  .partial();

module.exports = {
  createUserSchema,
  updateUserSchema,
};
