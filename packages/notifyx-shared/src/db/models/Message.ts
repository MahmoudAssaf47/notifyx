import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  app: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed' | 'spam';
  body: string;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  metadata?: string;
  discord_response?: string;
  error?: string;
  ip_address?: string;
  created_at: Date;
  sent_at?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    app: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'sent', 'failed', 'spam'], 
      default: 'pending',
      index: true
    },
    body: { type: String, required: true },
    sender_name: { type: String },
    sender_email: { type: String },
    subject: { type: String },
    metadata: { type: String },
    discord_response: { type: String },
    error: { type: String },
    ip_address: { type: String },
    sent_at: { type: Date }
  },
  { 
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false
  }
);

MessageSchema.index({ app: 1, status: 1 });
MessageSchema.index({ created_at: -1 });
MessageSchema.index({ app: 1, channel: 1, status: 1, created_at: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
