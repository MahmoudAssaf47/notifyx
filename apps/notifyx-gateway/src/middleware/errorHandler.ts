import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@notifyx/shared';

const logger = createLogger('Gateway');

interface HttpError extends Error {
  status?: number;
}

export const errorHandler = (err: HttpError, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Gateway Error: ${err.message}`, { 
    path: req.path, 
    correlationId: req.headers['x-correlation-id'],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });

  if (err.status) {
    res.status(err.status).json({
      success: false,
      error: 'GATEWAY_ERROR',
      message: err.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong'
  });
};
