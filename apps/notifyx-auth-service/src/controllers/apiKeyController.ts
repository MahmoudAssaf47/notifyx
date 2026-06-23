import { Request, Response } from "express";
import { ApiKey } from "../models/ApiKey.js";
import { generateApiKey } from "../utils/crypto.js";
import { createApiKeySchema } from "../utils/validation.js";
import { broker } from "@notifyx/shared";
import { ZodError } from "zod";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

export const createKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = createApiKeySchema.parse(req.body);
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { key, hash, prefix } = generateApiKey();

    const expiresAt = validated.expiresInDays
      ? new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey = new ApiKey({
      keyHash: hash,
      appName: validated.appName,
      prefix,
      userId: req.user.userId,
      permissions: validated.permissions ?? ["notify:send"],
      expiresAt,
    });

    await apiKey.save();

    broker.publish("audit.auth", {
      userId: req.user.userId,
      eventType: "api_key_created",
      status: "success",
      appName: validated.appName,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }).catch(() => {});

    res.status(201).json({
      success: true,
      apiKey: key,
      metadata: {
        id: apiKey._id,
        appName: apiKey.appName,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: error.errors,
      });
    } else {
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
};

export const revokeKey = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const query: Record<string, unknown> = { _id: id };
    if (req.user.role !== "admin") {
      query.userId = req.user.userId;
    }

    const apiKey = await ApiKey.findOneAndUpdate(
      query,
      { isActive: false },
      { new: true },
    );

    if (!apiKey) {
      res.status(404).json({ success: false, error: "API Key not found" });
      return;
    }

    broker.publish("audit.auth", {
      userId: req.user.userId,
      eventType: "api_key_revoked",
      status: "success",
      keyId: id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    }).catch(() => {});

    res.json({ success: true, message: "API Key revoked successfully" });
  } catch {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const listKeys = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const query = req.user.role === "admin" ? {} : { userId: req.user.userId };

    const keys = await ApiKey.find(query)
      .select("-keyHash")
      .sort({ createdAt: -1 });

    res.json({ success: true, keys });
  } catch {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
