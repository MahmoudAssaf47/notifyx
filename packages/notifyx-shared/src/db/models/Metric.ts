import mongoose, { Schema, Document } from 'mongoose';

export interface IMetric extends Document {
  name: string;
  app?: string;
  channel?: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

const MetricSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    app: { type: String, index: true },
    channel: { type: String, index: true },
    value: { type: Number, required: true },
    tags: { type: Map, of: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const Metric = mongoose.model<IMetric>('Metric', MetricSchema, 'metrics');
