import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthEvent extends Document {
  userId?: string;
  app?: string;
  eventType: 'login' | 'logout' | 'register' | 'password_reset' | 'api_key_created' | 'api_key_revoked';
  status: 'success' | 'failure';
  ipAddress: string;
  userAgent?: string;
  reason?: string;
  createdAt: Date;
}

const AuthEventSchema = new Schema(
  {
    userId: { type: String, index: true },
    app: { type: String, index: true },
    eventType: { type: String, required: true, index: true },
    status: { type: String, required: true, enum: ['success', 'failure'] },
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuthEvent = mongoose.model<IAuthEvent>('AuthEvent', AuthEventSchema, 'auth_events');
