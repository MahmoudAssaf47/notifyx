import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMITED',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMITED',
    message: 'Too many API requests, please try again after a minute',
  },
});

const apiKeyHitCounts = new Map<string, { count: number; resetAt: number }>();

export const apiKeyRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.get('x-api-key');
  if (!apiKey) {
    next();
    return;
  }

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 200;

  const entry = apiKeyHitCounts.get(apiKey);

  if (!entry || now > entry.resetAt) {
    apiKeyHitCounts.set(apiKey, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    res.status(429).json({
      success: false,
      error: 'RATE_LIMITED',
      message: 'Too many requests for this API key, please try again after a minute',
    });
    return;
  }

  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of apiKeyHitCounts.entries()) {
    if (now > entry.resetAt) {
      apiKeyHitCounts.delete(key);
    }
  }
}, 60 * 1000);
