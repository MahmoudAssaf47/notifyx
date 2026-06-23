import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createLogger } from '@notifyx/shared';
import authRoutes from './routes/auth.js';
import apiKeysRoutes from './routes/apiKeys.js';

dotenv.config();

const logger = createLogger('AuthService');
const app = express();
const port = parseInt(process.env.AUTH_PORT ?? '3001', 10);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/notifyx";

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notifyx-auth-service' });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/keys', apiKeysRoutes);

const start = async () => {
  try {
    await mongoose.connect(mongoUri);
    logger.info('Auth Service connected to MongoDB');
    
    const server = app.listen(port, () => {
      logger.info(`Auth Service listening on port ${port}`);
    });

    const shutdown = async () => {
      logger.info("Shutting down Auth Service...");
      await mongoose.disconnect();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start Auth Service", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

start();
