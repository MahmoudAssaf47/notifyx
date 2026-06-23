import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) return text;
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'notifyx-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export interface IAppConfig extends Document {
  appName: string;
  apiKey: string;
  discordWebhook?: string;
  discordColor?: number;
  slackWebhook?: string;
  telegramToken?: string;
  telegramChatId?: string;
  emailHost?: string;
  emailPort?: number;
  emailUser?: string;
  emailPass?: string;
  emailFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ENCRYPTED_PREFIX = 'nxenc:';

function encryptIfNeeded(value: string): string {
  if (value.startsWith(ENCRYPTED_PREFIX)) return value;
  return ENCRYPTED_PREFIX + encrypt(value);
}

const AppConfigSchema = new Schema(
  {
    appName: { type: String, required: true, unique: true, index: true },
    apiKey: { type: String, required: true, unique: true },
    discordWebhook: { type: String },
    discordColor: { type: Number },
    slackWebhook: { type: String },
    telegramToken: { type: String },
    telegramChatId: { type: String },
    emailHost: { type: String },
    emailPort: { type: Number },
    emailUser: { type: String },
    emailPass: {
      type: String,
      set: encryptIfNeeded,
    },
    emailFrom: { type: String },
  },
  { timestamps: true, toJSON: { getters: false, set: false }, toObject: { getters: false } }
);

export const AppConfigModel = mongoose.model<IAppConfig>('AppConfigModel', AppConfigSchema, 'app_configs');
