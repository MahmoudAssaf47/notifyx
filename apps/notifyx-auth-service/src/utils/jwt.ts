import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN ?? '7d';

const validatedJwtSecret: string = (() => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required. Application cannot start without it.");
  return JWT_SECRET;
})();

const validatedRefreshSecret: string = (() => {
  if (!REFRESH_SECRET) throw new Error("REFRESH_SECRET environment variable is required. Application cannot start without it.");
  return REFRESH_SECRET;
})();

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, validatedJwtSecret, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
  const refreshToken = jwt.sign({ userId: payload.userId }, validatedRefreshSecret, { expiresIn: REFRESH_EXPIRES_IN } as SignOptions);
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, validatedJwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, validatedRefreshSecret) as { userId: string };
};
