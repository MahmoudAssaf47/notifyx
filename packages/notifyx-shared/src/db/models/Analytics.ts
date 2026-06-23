import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  app: string;
  totalMessages: number;
  successCount: number;
  failureCount: number;
  spamCount: number;
  lastActive: Date;
}

const AnalyticsSchema = new Schema(
  {
    app: { type: String, required: true, unique: true },
    totalMessages: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    spamCount: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema, 'analytics');
