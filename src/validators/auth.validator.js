const { z } = require('zod');

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

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character');

const registerSchema = z
  .object({
    name,
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or name is required'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
