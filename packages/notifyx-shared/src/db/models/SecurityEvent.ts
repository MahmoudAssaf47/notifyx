import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityEvent extends Document {
  app: string;
  eventType: string;
  ipAddress: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
  createdAt: Date;
}

const SecurityEventSchema = new Schema(
  {
    app: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
    severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SecurityEvent = mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema, 'security_events');
