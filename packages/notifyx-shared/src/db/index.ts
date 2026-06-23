import mongoose from 'mongoose';
import { createLogger } from '../telemetry.js';

const logger = createLogger('DB');

export const connectDB = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
};
