import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation.js';
import { broker } from '@notifyx/shared';
import { ZodError } from 'zod';

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    
    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'User already exists' });
      return;
    }

    const passwordHash = await hashPassword(validated.password);
    const user = new User({
      email: validated.email,
      name: validated.name,
      passwordHash,
      role: 'developer'
    });

    await user.save();

    const tokens = generateTokens({
      userId: user._id.toString(),
      role: user.role,
      email: user.email
    });

    broker.publish("audit.auth", {
      userId: user._id.toString(),
      eventType: "register",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }).catch(() => {});

    res.status(201).json({
      success: true,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      tokens
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: 'Validation Error', details: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email });
    if (!user || !user.isActive) {
      broker.publish("audit.auth", {
        eventType: "login",
        status: "failure",
        reason: "invalid_credentials",
        email: validated.email,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }).catch(() => {});
      res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
      return;
    }

    const isValid = await verifyPassword(user.passwordHash, validated.password);
    if (!isValid) {
      broker.publish("audit.auth", {
        userId: user._id.toString(),
        eventType: "login",
        status: "failure",
        reason: "wrong_password",
        email: validated.email,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }).catch(() => {});
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = generateTokens({
      userId: user._id.toString(),
      role: user.role,
      email: user.email
    });

    broker.publish("audit.auth", {
      userId: user._id.toString(),
      eventType: "login",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }).catch(() => {});

    res.json({
      success: true,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      tokens
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: 'Validation Error', details: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    const decoded = verifyRefreshToken(validated.refreshToken);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      broker.publish("audit.auth", {
        userId: decoded.userId,
        eventType: "token_refresh",
        status: "failure",
        reason: "inactive_account",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }).catch(() => {});
      res.status(401).json({ success: false, error: 'Invalid refresh token or inactive account' });
      return;
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      role: user.role,
      email: user.email
    });

    broker.publish("audit.auth", {
      userId: user._id.toString(),
      eventType: "token_refresh",
      status: "success",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }).catch(() => {});

    res.json({ success: true, tokens });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};
