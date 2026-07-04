const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3000),

  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .url('MONGODB_URI must be a valid connection string'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),

  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');

  console.error(
    `\n Invalid environment configuration. Fix these before starting:\n${issues}\n`
  );
  process.exit(1);
}

const data = parsed.data;

const config = Object.freeze({
  env: data.NODE_ENV,
  isProduction: data.NODE_ENV === 'production',
  isDevelopment: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  port: data.PORT,
  mongoUri: data.MONGODB_URI,
  jwt: Object.freeze({
    secret: data.JWT_SECRET,
    expiresIn: data.JWT_EXPIRES_IN,
  }),
});

module.exports = config;
