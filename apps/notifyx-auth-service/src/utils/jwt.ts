import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN ?? '7d';

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
if (!process.env.REFRESH_SECRET) throw new Error("REFRESH_SECRET is required");

const jwtSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.REFRESH_SECRET;

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
  const refreshToken = jwt.sign({ userId: payload.userId }, refreshSecret, { expiresIn: REFRESH_EXPIRES_IN } as SignOptions);
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, refreshSecret) as { userId: string };
};
