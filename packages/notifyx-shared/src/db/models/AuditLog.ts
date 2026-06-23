import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  app: string;
  channel: string;
  status: string;
  body?: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  metadata?: string;
  ipAddress?: string;
  response?: unknown;
  error?: string;
  reason?: string;
  user?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema(
  {
    app: { type: String, required: true, index: true },
    channel: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    body: { type: String },
    senderName: { type: String },
    senderEmail: { type: String },
    subject: { type: String },
    metadata: { type: String },
    ipAddress: { type: String },
    response: { type: Schema.Types.Mixed },
    error: { type: String },
    reason: { type: String },
    user: { type: String, index: true },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema, 'audit_logs');
