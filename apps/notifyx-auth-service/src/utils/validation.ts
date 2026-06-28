import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const createApiKeySchema = z.object({
  appName: z.string().min(2).max(50),
  permissions: z.array(z.string()).optional(),
  expiresInDays: z.number().int().positive().optional(),
});
