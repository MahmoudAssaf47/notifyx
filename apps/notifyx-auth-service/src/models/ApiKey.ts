import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
  keyHash: string;
  appName: string;
  prefix: string;
  userId: mongoose.Types.ObjectId;
  permissions: string[];
  expiresAt?: Date;
  lastUsed?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    keyHash: { type: String, required: true, unique: true, index: true },
    appName: { type: String, required: true },
    prefix: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permissions: [{ type: String }],
    expiresAt: { type: Date },
    lastUsed: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ApiKeySchema.index({ userId: 1 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
