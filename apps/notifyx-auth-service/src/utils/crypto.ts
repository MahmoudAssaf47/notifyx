import argon2 from 'argon2';
import crypto from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
};

export const verifyPassword = async (hash: string, plain: string): Promise<boolean> => {
  return await argon2.verify(hash, plain);
};

export const generateApiKey = (): { key: string; hash: string; prefix: string } => {
  const key = `nx_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = key.slice(0, 8);
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, hash, prefix };
};

export const hashApiKey = (key: string): string => {
  return crypto.createHash('sha256').update(key).digest('hex');
};
